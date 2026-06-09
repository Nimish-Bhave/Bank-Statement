import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  FileText, 
  UploadCloud, 
  TrendingUp, 
  Search, 
  Download, 
  Trash2, 
  PlusCircle, 
  Edit2, 
  Check, 
  X, 
  HelpCircle, 
  ArrowUpDown, 
  RotateCcw, 
  AlertCircle,
  FileSpreadsheet,
  Coins,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
  Calendar,
  Filter,
  CheckCircle,
  TrendingDown,
  Percent,
  Plus
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { CHASE_SAMPLE, BARCLAYS_SAMPLE } from "./samples";
import { StatementSummary } from "./components/StatementSummary";
import { BankStatementData, Transaction } from "./types";
import { motion, AnimatePresence } from "motion/react";

const SUPPORTED_CATEGORIES = [
  "Salary & Income",
  "Food & Dining",
  "Utilities & Bills",
  "Rent & Housing",
  "Shopping",
  "Travel & Transport",
  "Entertainment",
  "Healthcare",
  "Transfers & Investments",
  "Fees & Charges",
  "Other"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Income": "#10b981", // Emerald
  "Food & Dining": "#f59e0b", // Amber
  "Utilities & Bills": "#f97316", // Orange
  "Rent & Housing": "#6366f1", // Indigo
  "Shopping": "#ec4899", // Pink
  "Travel & Transport": "#0ea5e9", // Sky
  "Entertainment": "#8b5cf6", // Violet
  "Healthcare": "#f43f5e", // Rose
  "Transfers & Investments": "#3b82f6", // Blue
  "Fees & Charges": "#64748b", // Slate-Gray
  "Other": "#475569" // Deep Slate
};

export default function App() {
  // Current active statement data
  const [statementData, setStatementData] = useState<BankStatementData | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  
  // OCR processing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Grid interactive filters & logic
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Manual Adjustments Form State
  const [isAddingAdjustment, setIsAddingAdjustment] = useState<boolean>(false);
  const [newTxnDate, setNewTxnDate] = useState<string>("");
  const [newTxnDescription, setNewTxnDescription] = useState<string>("");
  const [newTxnAmount, setNewTxnAmount] = useState<string>("");
  const [newTxnType, setNewTxnType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [newTxnCategory, setNewTxnCategory] = useState<string>("Other");

  // Inline Row-level Editor State
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editType, setEditType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [editCategory, setEditCategory] = useState<string>("");

  // Refs for Drag & Drop
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Auto-set date to today on adjustment form open
  useEffect(() => {
    if (isAddingAdjustment && !newTxnDate) {
      setNewTxnDate(new Date().toISOString().substring(0, 10));
    }
  }, [isAddingAdjustment]);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Submit base64 encoded document to Gemini OCR endpoint
  const processDocument = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setOriginalFilename(file.name);
    
    const steps = [
      "Securing connection to financial indexer...",
      "Isolating banking tabular matrices...",
      "Applying multi-layered OCR character isolation...",
      "Normalizing amounts and ledger metadata...",
      "Calculating balance reconciliations...",
      "Running semantic categorizations on descriptions..."
    ];

    let currentStepIdx = 0;
    setProcessingStep(steps[currentStepIdx]);
    
    const stepInterval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setProcessingStep(steps[currentStepIdx]);
      }
    }, 1800);

    try {
      const base64Content = await fileToBase64(file);
      const mimeType = file.type;

      // Ensure file is image or PDF
      if (!mimeType.includes("pdf") && !mimeType.includes("image")) {
        throw new Error("Invalid format. Please supply a valid PDF document or PNG/JPEG image.");
      }

      const response = await fetch("/api/parse-statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileBase64: base64Content,
          mimeType: mimeType
        })
      });

      const result = await response.json();
      clearInterval(stepInterval);

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Server processing failed.");
      }

      // Add unique IDs to response transactions if they don't exist
      const enrichedTransactions = (result.data.transactions || []).map((t: any, index: number) => ({
        ...t,
        id: t.id || `ocr-${Date.now()}-${index}`,
        originalText: t.originalText || t.description
      }));

      setStatementData({
        ...result.data,
        transactions: enrichedTransactions
      });

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setErrorMessage(err.message || "An error occurred during file upload and character parsing.");
      setOriginalFilename(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Drag Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processDocument(file);
    }
  };

  // Handle Input File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processDocument(file);
    }
  };

  // Load Preset Demos
  const loadDemo = (sample: BankStatementData, name: string) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStep("Formulating sandbox test profile...");
    
    setTimeout(() => {
      // Add random unique keys to avoid memory leaks
      const cleanTransactions = sample.transactions.map((t, idx) => ({
        ...t,
        id: `${sample.bankName.toLowerCase().replace(/\s+/g, "-")}-${idx}-${Date.now()}`
      }));

      setStatementData({
        ...sample,
        transactions: cleanTransactions
      });
      setOriginalFilename(`${name.replace(/\s+/g, "_")}_demo_statement.pdf`);
      setIsProcessing(false);
    }, 800);
  };

  // Remove completely
  const resetApp = () => {
    setStatementData(null);
    setOriginalFilename(null);
    setSearchTerm("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setErrorMessage(null);
    setEditingRowId(null);
    setIsAddingAdjustment(false);
  };

  // Delete Transaction row
  const deleteTransaction = (id: string) => {
    if (!statementData) return;
    
    const updatedTxns = statementData.transactions.filter(t => t.id !== id);
    
    // Re-sum totals in real-time
    const totalDebits = updatedTxns.filter(t => t.type === "DEBIT").reduce((acc, curr) => acc + curr.amount, 0);
    const totalCredits = updatedTxns.filter(t => t.type === "CREDIT").reduce((acc, curr) => acc + curr.amount, 0);
    
    setStatementData({
      ...statementData,
      totalDebits: Number(totalDebits.toFixed(2)),
      totalCredits: Number(totalCredits.toFixed(2)),
      transactions: updatedTxns
    });
  };

  // Enter row edit state
  const startEditRow = (txn: Transaction) => {
    setEditingRowId(txn.id);
    setEditDate(txn.date);
    setEditDescription(txn.description);
    setEditAmount(txn.amount.toString());
    setEditType(txn.type);
    setEditCategory(txn.category);
  };

  // Save row edits
  const saveRowEdits = (id: string) => {
    if (!statementData) return;
    
    const valAmount = parseFloat(editAmount);
    if (isNaN(valAmount) || valAmount < 0) {
      alert("Please configure a positive numerical amount.");
      return;
    }

    const updatedTxns = statementData.transactions.map(t => {
      if (t.id === id) {
        return {
          ...t,
          date: editDate,
          description: editDescription,
          amount: valAmount,
          type: editType,
          category: editCategory,
          confidence: 1.0 // user manually verified
        };
      }
      return t;
    });

    // Recalculate statements summary
    const totalDebits = updatedTxns.filter(t => t.type === "DEBIT").reduce((acc, curr) => acc + curr.amount, 0);
    const totalCredits = updatedTxns.filter(t => t.type === "CREDIT").reduce((acc, curr) => acc + curr.amount, 0);

    setStatementData({
      ...statementData,
      totalDebits: Number(totalDebits.toFixed(2)),
      totalCredits: Number(totalCredits.toFixed(2)),
      transactions: updatedTxns
    });
    setEditingRowId(null);
  };

  // Direct category quick-swap logic (smooth click switch)
  const quickSwapCategory = (id: string, category: string) => {
    if (!statementData) return;
    const updatedTxns = statementData.transactions.map(t => {
      if (t.id === id) {
        return { ...t, category, confidence: 1.0 };
      }
      return t;
    });
    setStatementData({
      ...statementData,
      transactions: updatedTxns
    });
  };

  // Insert manual adjustment row
  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementData) return;

    const amt = parseFloat(newTxnAmount);
    if (!newTxnDescription || isNaN(amt) || amt <= 0) {
      alert("Make sure to fill out a merchant key and positive decimal value.");
      return;
    }

    const newTxn: Transaction = {
      id: `manual-adj-${Date.now()}`,
      date: newTxnDate || new Date().toISOString().substring(0, 10),
      description: `[Adjustment] ${newTxnDescription.toUpperCase()}`,
      amount: amt,
      type: newTxnType,
      category: newTxnCategory,
      confidence: 1.0,
      originalText: `Client inserted adjustment row $${amt}`
    };

    const updatedTxns = [newTxn, ...statementData.transactions];

    // Re-sum totals in real-time
    const totalDebits = updatedTxns.filter(t => t.type === "DEBIT").reduce((acc, curr) => acc + curr.amount, 0);
    const totalCredits = updatedTxns.filter(t => t.type === "CREDIT").reduce((acc, curr) => acc + curr.amount, 0);

    setStatementData({
      ...statementData,
      totalDebits: Number(totalDebits.toFixed(2)),
      totalCredits: Number(totalCredits.toFixed(2)),
      transactions: updatedTxns
    });

    // Reset Form Fields
    setNewTxnDescription("");
    setNewTxnAmount("");
    setNewTxnType("DEBIT");
    setNewTxnCategory("Other");
    setIsAddingAdjustment(false);
  };

  // Filter and Sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    if (!statementData) return [];

    let list = [...statementData.transactions];

    // 1. Filter with Search Term
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      list = list.filter(t => 
        t.description.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(query))
      );
    }

    // 2. Filter with Transaction Type
    if (typeFilter !== "ALL") {
      list = list.filter(t => t.type === typeFilter);
    }

    // 3. Filter with Category Tab Select
    if (categoryFilter !== "ALL") {
      list = list.filter(t => t.category === categoryFilter);
    }

    // 4. Sort table columns
    list.sort((a, b) => {
      let nodeA: any = a[sortBy];
      let nodeB: any = b[sortBy];

      if (sortBy === "description") {
        nodeA = a.description.toLowerCase();
        nodeB = b.description.toLowerCase();
      }

      if (nodeA < nodeB) return sortOrder === "asc" ? -1 : 1;
      if (nodeA > nodeB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [statementData, searchTerm, typeFilter, categoryFilter, sortBy, sortOrder]);

  // Format dynamic currency based on state metadata
  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: statementData?.currency || "USD",
    }).format(amt);
  };

  // Compile Chart data dynamically purely based on filtered dataset, or total dataset
  const categoryChartData = useMemo(() => {
    if (!statementData) return [];
    const sums: Record<string, number> = {};
    
    // Sum amount spent (DEBIT) or all depending on filter behavior
    statementData.transactions.forEach(t => {
      if (t.type === "DEBIT") {
        sums[t.category] = (sums[t.category] || 0) + t.amount;
      }
    });

    return Object.entries(sums)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [statementData]);

  // Total debits count for matching percentages
  const debitsGrandTotal = useMemo(() => {
    return categoryChartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryChartData]);

  // Reconcile calculation: Starting + Credits - Debits = Ending
  const expectedEndingBalance = useMemo(() => {
    if (!statementData) return 0;
    return Number((statementData.startingBalance + statementData.totalCredits - statementData.totalDebits).toFixed(2));
  }, [statementData]);

  const actualEndingBalance = useMemo(() => {
    if (!statementData) return 0;
    return Number(statementData.endingBalance.toFixed(2));
  }, [statementData]);

  const reconcileDiff = useMemo(() => {
    return Number((actualEndingBalance - expectedEndingBalance).toFixed(2));
  }, [actualEndingBalance, expectedEndingBalance]);

  const ledgerIsReconciled = useMemo(() => {
    return Math.abs(reconcileDiff) <= 0.05;
  }, [reconcileDiff]);

  // Export dynamically to CSV file
  const downloadCSV = () => {
    if (!statementData) return;
    const headers = ["Date", "Description", "Type", "Category", "Amount", "Reference", "Original OCR Text"];
    const rows = statementData.transactions.map(t => [
      t.date,
      t.description,
      t.type,
      t.category,
      t.amount.toString(),
      t.referenceNumber || "",
      t.originalText || ""
    ]);
    
    const csvString = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${(statementData.bankName || "bank_statement").toLowerCase().replace(/[^a-z0-9]+/g, "_")}_ledger_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSortToggle = (field: "date" | "amount" | "description") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/20 min-h-screen text-slate-800 font-sans antialiased pb-24 h-full" id="ocr-app-root">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 shadow-sm" id="dashboard-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                Bank Statement OCR Parser
                <span className="text-[10px] uppercase bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded tracking-wide">
                  Expert Engine
                </span>
              </h1>
              <p className="text-xs text-slate-500">Advanced transaction table isolator & category categorizer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded">
              UTC: 2026-06-09
            </span>
            {statementData && (
              <button 
                id="btn-global-reset"
                onClick={resetApp}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <RotateCcw size={13} /> Reset Parser
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DETAILED WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* RUNTIME ERROR MESSAGE */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="alert-error-container"
              className="mb-8 p-5 bg-rose-50 border border-rose-150 rounded-2xl flex gap-3 text-sm text-rose-800 shadow-sm"
            >
              <AlertCircle size={20} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold">Ocr Extraction Interrupted</h4>
                <p className="text-rose-700/90">{errorMessage}</p>
                <div className="pt-2 text-xs flex gap-2">
                  <span className="font-semibold underline cursor-pointer hover:text-rose-900" onClick={() => setErrorMessage(null)}>
                    Dismiss notification
                  </span>
                  <span>•</span>
                  <span>Try reloading or clicking one of the instant sandbox test states below.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ONBOARDING STATE: RENDERED IF NO STATEMENT IS YET LOADED */}
        {!statementData && !isProcessing && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="onboarding-grid">
            
            {/* FILE DROPPER ELEMENT */}
            <div className="lg:col-span-7 space-y-6">
              
              <div 
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                id="file-dropzone-box"
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[360px] bg-white shadow-sm hover:shadow-md ${
                  isDragOver 
                    ? "border-indigo-500 bg-indigo-50/40 shadow-indigo-100/50 scale-[1.01]" 
                    : "border-slate-200 hover:border-slate-350 bg-white"
                }`}
              >
                <input 
                  type="file" 
                  id="statement-file-input" 
                  className="hidden" 
                  accept="application/pdf,image/*" 
                  onChange={handleFileChange}
                />
                
                <label htmlFor="statement-file-input" className="cursor-pointer flex flex-col items-center">
                  <div className={`p-5 rounded-2xl mb-5 transition-transform ${isDragOver ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-50 text-indigo-600 hover:scale-105'}`}>
                    <UploadCloud size={40} />
                  </div>
                  
                  <span className="text-lg font-bold text-slate-800">
                    Upload your Bank Statement
                  </span>
                  
                  <p className="text-sm text-slate-400 mt-2 max-w-sm">
                    Drag and drop your bank statement <span className="font-semibold text-indigo-600">PDF document</span> or <span className="font-semibold text-indigo-600">scanned invoice image</span> here.
                  </p>
                  
                  <p className="text-xs text-slate-400 font-mono mt-4 bg-slate-50 px-3 py-1 rounded border border-slate-150">
                    PDF, PNG, JPG, or WEBP up to 50MB
                  </p>
                </label>
              </div>

              {/* STATEMENTS EXAMPLES */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm" id="card-demo-selector">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Instant Try Sandbox</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Don't have a real PDF statement ready? Instant-load our high-fidelity, pre-balanced bank ledgers to evaluate charts, editing algorithms, and CSV export utilities instantly.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DEMO 1 */}
                  <div 
                    id="btn-load-chase-demo"
                    onClick={() => loadDemo(CHASE_SAMPLE, "Chase Statement")}
                    className="p-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-100 text-left cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-indigo-100 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white rounded-lg transition-colors mt-0.5">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-slate-400 font-semibold block uppercase">PRESET 01</span>
                      <p className="font-bold text-sm text-slate-700">Chase Bank USA</p>
                      <p className="text-xs text-slate-500 mt-1">USD statement, 12 isolated transactions, reconciled formula and credit salary entries.</p>
                    </div>
                  </div>

                  {/* DEMO 2 */}
                  <div 
                    id="btn-load-barclays-demo"
                    onClick={() => loadDemo(BARCLAYS_SAMPLE, "Barclays Statement")}
                    className="p-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-slate-50/70 hover:bg-emerald-50/30 border border-slate-100 hover:border-emerald-100 text-left cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-emerald-100 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white rounded-lg transition-colors mt-0.5">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-slate-400 font-semibold block uppercase">PRESET 02</span>
                      <p className="font-bold text-sm text-slate-700">Barclays Bank UK</p>
                      <p className="text-xs text-slate-500 mt-1">GBP currency statement, 8 transaction items, with contactless London tube trips.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BENEFITS SIDEBAR */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
                  <Coins size={240} />
                </div>
                
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-300" />
                  Premium OCR Standardized
                </h3>
                
                <ul className="space-y-4 text-sm text-indigo-100">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-white/10 rounded mt-0.5 text-amber-300">
                      <Check size={14} />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Absolute Table Parsing</span>
                      Extracts transactional tables accurately across varying bank formats, sorting dates even from skewed scanned images.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-white/10 rounded mt-0.5 text-amber-300">
                      <Check size={14} />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Contextual Normalizations</span>
                      Maps amounts as standardized positive values and resolves chronological years intelligently from statement cover spans.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-white/10 rounded mt-0.5 text-amber-300">
                      <Check size={14} />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Cognitive Categorization</span>
                      Labels and categorizes merchants into standardized budget classes like Housing, Dining, Utilities with confidence indicators.
                    </div>
                  </li>
                </ul>
                
                <div className="mt-8 pt-6 border-t border-indigo-850 flex items-center gap-2 text-xs text-indigo-200">
                  <Info size={14} />
                  <span>Statements processed entirely server-side via trusted Gemini models.</span>
                </div>
              </div>

              {/* RECONCILIATION EXPLANATORY CARD */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">How Statement Reconciling Works:</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Financial statements specify a starting balance alongside overall credit/debit aggregate values. An exact equation checks this:
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[11px] text-center text-slate-600">
                  Starting Balance + Total Credits - Total Debits = Ending Balance
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our system verifies this calculation. If transactions are missed by the scanner, our parser marks it with a warning, permitting you to insert adjustments.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* PROCESSING LOADER STATE */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-xl mx-auto" id="loader-display-container">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <Sparkles size={20} className="text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-800">Processing Financial Document</h3>
            <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50 mt-2 animate-pulse">
              {processingStep}
            </p>
            
            <p className="text-xs text-slate-400 text-center max-w-xs mt-6 leading-relaxed">
              This will take a few seconds as Gemini isolates statement metrics, normalizes columns, and structures transaction data.
            </p>
          </div>
        )}

        {/* PARSED STATE DOCK */}
        {statementData && !isProcessing && (
          <div className="space-y-8" id="active-document-workspace">
            
            {/* FILE METADATA AND RESET ROW */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono">Parsed Document</p>
                  <p className="font-bold text-slate-850 text-sm max-w-md truncate">{originalFilename || "uploaded_statement.pdf"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-download-csv-export"
                  onClick={downloadCSV}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-md shadow-indigo-600/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FileSpreadsheet size={14} /> Export CSV Ledger
                </button>
                <button
                  id="btn-adjustment-row-toggle"
                  onClick={() => setIsAddingAdjustment(!isAddingAdjustment)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-150 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl transition-all"
                >
                  <Plus size={14} /> Add Adjustment
                </button>
              </div>
            </div>

            {/* CARD 1: METADATA & RECONCILIATIONS PLATES */}
            <StatementSummary data={statementData} />

            {/* RECONCILIATION EXTRA STATS */}
            <div id="reconciliation-health-indicator-card" className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm ${
              ledgerIsReconciled 
                ? "bg-emerald-50/55 border-emerald-100 text-emerald-800" 
                : "bg-amber-50/55 border-amber-100 text-amber-800"
            }`}>
              <div className="flex gap-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${ledgerIsReconciled ? "bg-emerald-100/80 text-emerald-700" : "bg-amber-100/80 text-amber-700"}`}>
                  {ledgerIsReconciled ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-sm tracking-tight">
                    {ledgerIsReconciled ? "Verification Formulas Check Good" : "Verification Totals Misaligned"}
                  </p>
                  <p className="text-xs opacity-90 max-w-xl">
                    {ledgerIsReconciled 
                      ? "Starting Balance + Credits - Debits translates exactly into the Ending Balance. No missing list entries detected by OCR scanner." 
                      : `A discrepancy of ${formatAmount(reconcileDiff)} was identified. Missing entries may exist, or manual line edits might have created a gap.`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">Calculated Difference</span>
                <span className={`text-base font-mono font-bold ${ledgerIsReconciled ? "text-emerald-700" : "text-amber-700"}`}>
                  {reconcileDiff > 0 ? "+" : ""}{formatAmount(reconcileDiff)}
                </span>
              </div>
            </div>

            {/* ADJUSTMENT FORM POPOVER */}
            <AnimatePresence>
              {isAddingAdjustment && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  id="form-add-adjustment-container"
                  className="bg-white rounded-3xl border border-dashed border-indigo-200 p-6 overflow-hidden shadow-sm shadow-indigo-50 bg-indigo-50/10"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-100/30">
                    <span className="font-bold text-sm text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                      <PlusCircle size={16} /> Insert Adjustment / Correction Row
                    </span>
                    <button onClick={() => setIsAddingAdjustment(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleAddAdjustment} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Transaction Date</label>
                      <input 
                        type="date"
                        required
                        value={newTxnDate}
                        onChange={(e) => setNewTxnDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-indigo-500 outline-none"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 block mb-1">Merchant / Description</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g., Target stores, cash adjustment..."
                        value={newTxnDescription}
                        onChange={(e) => setNewTxnDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Flow Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                          {statementData.currency === "GBP" ? "£" : statementData.currency === "EUR" ? "€" : "$"}
                        </span>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={newTxnAmount}
                          onChange={(e) => setNewTxnAmount(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Action Type</label>
                        <select
                          value={newTxnType}
                          onChange={(e: any) => setNewTxnType(e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none font-semibold text-slate-700"
                        >
                          <option value="DEBIT">Debit (-)</option>
                          <option value="CREDIT">Credit (+)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Category</label>
                        <select
                          value={newTxnCategory}
                          onChange={(e) => setNewTxnCategory(e.target.value)}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none text-slate-705"
                        >
                          {SUPPORTED_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-1 py-1">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-colors"
                      >
                        <PlusCircle size={14} /> Save Row
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CHART ANALYTICS AND METRIC BLOCKS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="card-category-analysis">
              
              {/* RECHARTS CATEGORY DONUT */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Debit Outflows Category Mix</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Transactional slice allocation for debits (withdrawals)</p>
                  </div>
                  <TrendingUp size={16} className="text-slate-400" />
                </div>

                {categoryChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-xs text-slate-400">No withdrawals identified in current filtered views.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* CHART CANVAS Container */}
                    <div className="md:col-span-7 h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} 
                              />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            formatter={(value: number) => [formatAmount(value), "Debit Total"]}
                            contentStyle={{ 
                              borderRadius: "12px", 
                              border: "none", 
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              fontSize: "11px",
                              fontFamily: "Space Grotesk, sans-serif"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* PROGRESS BAR PERCENTAGES */}
                    <div className="md:col-span-5 space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {categoryChartData.slice(0, 5).map((item) => {
                        const pct = debitsGrandTotal > 0 ? Number(((item.value / debitsGrandTotal) * 100).toFixed(1)) : 0;
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-slate-600 truncate">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[item.name] }}></span>
                                {item.name}
                              </span>
                              <span className="text-slate-700 font-mono text-[11px] font-bold">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[item.name] }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {categoryChartData.length > 5 && (
                        <p className="text-[10px] text-slate-400 text-center font-semibold pt-1">
                          + {categoryChartData.length - 5} other smaller categories
                        </p>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* CASHFLOW TREND & INSIGHT CARD */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Flow Allocation Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">Income Inlets (Credits)</span>
                        <p className="text-lg font-bold text-slate-850 mt-0.5">{formatAmount(statementData.totalCredits)}</p>
                      </div>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <TrendingDown size={18} className="rotate-180" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">Expenses Outlets (Debits)</span>
                        <p className="text-lg font-bold text-slate-850 mt-0.5">{formatAmount(statementData.totalDebits)}</p>
                      </div>
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                        <TrendingUp size={18} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-1">
                      <div>
                        <span className="text-xs text-slate-400 font-medium font-bold block">Net Cashflow</span>
                        {statementData.totalCredits - statementData.totalDebits >= 0 ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50/70 px-2 py-0.5 rounded-full mt-1 inline-block border border-emerald-100">
                            Positive Savings
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50/70 px-2 py-0.5 rounded-full mt-1 inline-block border border-rose-100">
                            Capital Deficit
                          </span>
                        )}
                      </div>
                      <p className={`text-xl font-extrabold font-mono ${statementData.totalCredits - statementData.totalDebits >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {statementData.totalCredits - statementData.totalDebits >= 0 ? "+" : ""}
                        {formatAmount(statementData.totalCredits - statementData.totalDebits)}
                      </p>
                    </div>

                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex gap-3 text-xs text-slate-600 mt-6 md:mt-2">
                  <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Quick Tip: Filter individual categories in the ledger table underneath using the category buttons below to view contextual row lists instantly.
                  </p>
                </div>
              </div>

            </div>

            {/* TRANSACTION LEDGER TABLE WRAP */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="card-transaction-ledger">
              
              {/* SEARCH & CONTROLLERS FILTERS TAB */}
              <div className="p-6 border-b border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Transaction Ledger Table</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Interactive ledger entries. Editable rows and category overrides updates working balance equation.</p>
                  </div>
                  
                  {/* SEARCH DECK INPUT */}
                  <div className="relative w-full sm:w-72">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search description, reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-slate-50/55 focus:bg-white transition-all text-slate-700"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* FILTERS SHELF: TYPE BUTTONS & CATEGORIES BAR */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  
                  {/* Sift flow types */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setTypeFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800 text-slate-705"}`}
                    >
                      All ({statementData.transactions.length})
                    </button>
                    <button 
                      onClick={() => setTypeFilter("DEBIT")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === "DEBIT" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800 text-slate-705"}`}
                    >
                      Debits ({statementData.transactions.filter(t => t.type === "DEBIT").length})
                    </button>
                    <button 
                      onClick={() => setTypeFilter("CREDIT")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === "CREDIT" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800 text-slate-705"}`}
                    >
                      Credits ({statementData.transactions.filter(t => t.type === "CREDIT").length})
                    </button>
                  </div>

                  {/* RESET FILTERS */}
                  {(categoryFilter !== "ALL" || searchTerm || typeFilter !== "ALL") && (
                    <button 
                      onClick={() => {
                        setCategoryFilter("ALL");
                        setSearchTerm("");
                        setTypeFilter("ALL");
                      }}
                      className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-bold border border-rose-100 bg-rose-50/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* HORIZONTAL SCROLLABLE CATEGORIES QUICK FILTER BAR */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-6 px-6 mask-scroll-fade">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0 mr-2 flex items-center gap-1">
                    <Filter size={11} /> Filter:
                  </span>
                  <button
                    onClick={() => setCategoryFilter("ALL")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      categoryFilter === "ALL" 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    All Categories
                  </button>
                  {SUPPORTED_CATEGORIES.map(cat => {
                    const count = statementData.transactions.filter(t => t.category === cat).length;
                    if (count === 0) return null;
                    const isActive = categoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(isActive ? "ALL" : cat)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                          isActive 
                            ? "bg-slate-800 text-white border-slate-850 shadow-sm" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CATEGORY_COLORS[cat] }}></span>
                        {cat} <span className="opacity-60 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* DATA TABLE GRID CONTAINER */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold select-none">
                      <th className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSortToggle("date")}>
                        <div className="flex items-center gap-1.5">
                          Date
                          <ArrowUpDown size={13} className={sortBy === "date" ? "text-indigo-600" : "text-slate-300"} />
                        </div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSortToggle("description")}>
                        <div className="flex items-center gap-1.5">
                          Description
                          <ArrowUpDown size={13} className={sortBy === "description" ? "text-indigo-600" : "text-slate-300"} />
                        </div>
                      </th>
                      <th className="px-6 py-4">Inferred Category</th>
                      <th className="px-6 py-4">Reference No.</th>
                      <th className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors text-right" onClick={() => handleSortToggle("amount")}>
                        <div className="flex items-center gap-1.5 justify-end">
                          Flow Value
                          <ArrowUpDown size={13} className={sortBy === "amount" ? "text-indigo-600" : "text-slate-300"} />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center">Confidence</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    <AnimatePresence initial={false}>
                      {filteredAndSortedTransactions.map((txn) => {
                        const isEditing = editingRowId === txn.id;
                        return (
                          <motion.tr 
                            key={txn.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            {/* DATE COLUMN */}
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                              {isEditing ? (
                                <input 
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="px-2 py-1 border border-slate-200 rounded font-mono text-xs outline-none focus:border-indigo-500 bg-white"
                                />
                              ) : (
                                txn.date
                              )}
                            </td>

                            {/* DESCRIPTION COLUMN */}
                            <td className="px-6 py-4 max-w-sm">
                              {isEditing ? (
                                <input 
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 bg-white uppercase"
                                />
                              ) : (
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-850 tracking-tight leading-snug">{txn.description}</p>
                                  {txn.originalText && txn.originalText !== txn.description && (
                                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs" title={txn.originalText}>
                                      OCR: {txn.originalText}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* CATEGORY COLUMN - Click pill to swap dropdown online immediately */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 bg-white"
                                >
                                  {SUPPORTED_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center gap-1">
                                  {/* Select menu styling as pill */}
                                  <select
                                    value={txn.category}
                                    onChange={(e) => quickSwapCategory(txn.id, e.target.value)}
                                    style={{ borderLeftColor: CATEGORY_COLORS[txn.category] || "#94a3b8" }}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-full border-l-4 border-y border-r border-slate-205 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
                                  >
                                    {SUPPORTED_CATEGORIES.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </td>

                            {/* REFERENCE NUMBER COLUMN */}
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">
                              {txn.referenceNumber || <span className="opacity-20">—</span>}
                            </td>

                            {/* AMOUNT FLOW COLUMN */}
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold">
                              {isEditing ? (
                                <div className="flex justify-end gap-1 items-center">
                                  <select 
                                    value={editType}
                                    onChange={(e: any) => setEditType(e.target.value)}
                                    className="px-1 py-1 border border-slate-200 rounded text-xs outline-none bg-white font-bold"
                                  >
                                    <option value="DEBIT">Debit (-)</option>
                                    <option value="CREDIT">Credit (+)</option>
                                  </select>
                                  <input 
                                    type="text"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="w-16 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 bg-white text-right"
                                  />
                                </div>
                              ) : (
                                <span className={txn.type === "CREDIT" ? "text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded" : "text-slate-800"}>
                                  {txn.type === "CREDIT" ? "+" : "-"}
                                  {formatAmount(txn.amount)}
                                </span>
                              )}
                            </td>

                            {/* CONFIDENCE COLUMN */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {isEditing ? (
                                <span className="text-xs text-slate-400">100% (Manual)</span>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  txn.confidence >= 0.95 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : txn.confidence >= 0.85 
                                    ? "bg-blue-50 text-blue-700" 
                                    : "bg-amber-50 text-amber-700"
                                }`}>
                                  {Math.round(txn.confidence * 100)}%
                                </span>
                              )}
                            </td>

                            {/* ACTIONS COLUMNS */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => saveRowEdits(txn.id)}
                                    className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                  >
                                    <Check size={12} /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRowId(null)}
                                    className="p-1 px-1.5 bg-slate-150 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition-all"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end items-center gap-1.5">
                                  <button
                                    onClick={() => startEditRow(txn)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors"
                                    title="Edit Row"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => deleteTransaction(txn.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/55 rounded-lg transition-colors"
                                    title="Delete Entry"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </td>

                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>

                    {filteredAndSortedTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                          No transaction records matching active filters. Try writing other values in search or resetting the view filters.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

            </div>

          </div>
        )}

      </main>
      
    </div>
  );
}
