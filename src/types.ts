export interface Transaction {
  id: string; // generated client-side or server-side
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // always positive numeric value
  type: 'DEBIT' | 'CREDIT';
  category: string; // Inferred smart category (e.g. Food & Dining, Utilities, Income, Travel, Shopping, etc.)
  confidence: number; // confidence score (0 to 1) for the inferred category
  referenceNumber?: string;
  originalText?: string;
}

export interface BankStatementData {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  statementPeriod: string;
  currency: string;
  startingBalance: number;
  endingBalance: number;
  totalDebits: number;
  totalCredits: number;
  transactions: Transaction[];
  rawTextExcerpt?: string;
}

export interface ProcessResponse {
  success: boolean;
  data?: BankStatementData;
  error?: string;
}
