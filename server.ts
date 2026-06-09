import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable wide JSON boundaries for high-res file transfers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// Lazy-loaded Gemini SDK Instance
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Executes a Gemini content generation request with automatic retry and model fallback logic.
 * This handles 503 (Unavailable/Overloaded) errors gracefully by retrying and shifting to fallback models.
 */
async function generateContentWithRetry(ai: GoogleGenAI, contents: any, config: any): Promise<any> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  const maxAttemptsPerModel = 3;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        console.log(`[OCR Engine] Attempt ${attempt}/${maxAttemptsPerModel} using model: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err.message || err.status || err || "").toLowerCase();
        const is503 = errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("overloaded") || errMsg.includes("high demand") || err.status === 503;

        console.error(`[OCR Engine] Model ${modelName} on attempt ${attempt} failed: ${err.message || err}`);

        if (is503) {
          if (attempt < maxAttemptsPerModel) {
            const delayMs = attempt * 1200; // 1.2s, 2.4s
            console.warn(`[OCR Engine] Model is overloaded. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          } else {
            console.warn(`[OCR Engine] Model ${modelName} exhausted all attempts due to high load.`);
          }
        } else {
          // Non-503 errors (e.g. invalid arguments/payload) should be raised immediately without wasteful retries
          throw err;
        }
      }
    }
  }

  // If we reach here, all attempts failed
  throw lastError || new Error("All transcription models are currently under heavy load. Please try again in a few seconds.");
}

// --------------------------------------------------------
// Structured Schema for Bank Statement Parsing
// --------------------------------------------------------
const bankingSchema = {
  type: Type.OBJECT,
  properties: {
    bankName: {
      type: Type.STRING,
      description: "The name of the issuing bank or financial institution (e.g. Chase Bank, Barclays, HSBC, etc.)"
    },
    accountHolder: {
      type: Type.STRING,
      description: "Full legal or organization name of the account owner listed on the statement"
    },
    accountNumber: {
      type: Type.STRING,
      description: "Account number or masked identifier (e.g., ...1234 or full numeric value)"
    },
    statementPeriod: {
      type: Type.STRING,
      description: "The date span of the statement, e.g., 'October 1, 2025 - October 31, 2025' or 'June 2026'"
    },
    currency: {
      type: Type.STRING,
      description: "Three letter ISO currency code of the transaction amounts (e.g., USD, EUR, GBP, AUD, CAD)"
    },
    startingBalance: {
      type: Type.NUMBER,
      description: "The opening account balance for this statement period. Float number."
    },
    endingBalance: {
      type: Type.NUMBER,
      description: "The closing or ending account balance for this statement period. Float number."
    },
    totalDebits: {
      type: Type.NUMBER,
      description: "The accumulated sum of all withdrawals/payments/debits in the statement. Positive float."
    },
    totalCredits: {
      type: Type.NUMBER,
      description: "The accumulated sum of all deposits/credits/refunds in the statement. Positive float."
    },
    transactions: {
      type: Type.ARRAY,
      description: "Highly accurate record-for-record list of bank statement transactions",
      items: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            description: "The transaction date normalized strictly into 'YYYY-MM-DD' format. If only month/day is available in the table, infer the year logically from the statementPeriod."
          },
          description: {
            type: Type.STRING,
            description: "The full row description or merchant text (e.g., 'STARBUCKS #1223 SEATTLE WA'). Keep it readable but unmodified."
          },
          amount: {
            type: Type.NUMBER,
            description: "The monetary amount. Always normalize as an absolute positive decimal number (withdrawals and deposits are both positive; the type property will distinguish them)."
          },
          type: {
            type: Type.STRING,
            description: "Action flag. Use 'DEBIT' for any withdrawal, payment, fee, check, or charge. Use 'CREDIT' for any deposit, payroll, salary, transfer-in, reward, or refund."
          },
          category: {
            type: Type.STRING,
            description: "Inferred descriptive category. Select from: 'Salary & Income', 'Food & Dining', 'Utilities & Bills', 'Rent & Housing', 'Shopping', 'Travel & Transport', 'Entertainment', 'Healthcare', 'Transfers & Investments', 'Fees & Charges', or 'Other'."
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence scoring of our categorization logic between 0.0 and 1.0"
          },
          referenceNumber: {
            type: Type.STRING,
            description: "Unique transaction transaction id, audit sequence, check index, or reference digits if available in the table. Otherwise leave blank."
          },
          originalText: {
            type: Type.STRING,
            description: "The original raw text line or cells belonging to this row before cleaning."
          }
        },
        required: ["date", "description", "amount", "type", "category", "confidence"]
      }
    }
  },
  required: [
    "bankName",
    "accountHolder",
    "accountNumber",
    "statementPeriod",
    "currency",
    "startingBalance",
    "endingBalance",
    "totalDebits",
    "totalCredits",
    "transactions"
  ]
};

// --------------------------------------------------------
// API Endpoint: Parse Document
// --------------------------------------------------------
app.post("/api/parse-statement", async (req, res): Promise<any> => {
  try {
    const { fileBase64, mimeType } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({
        success: false,
        error: "Missing fields. 'fileBase64' and 'mimeType' parameters are required."
      });
    }

    // Verify Gemini configuration
    let ai;
    try {
      ai = getGeminiClient();
    } catch (envError: any) {
      console.error("Gemini init error:", envError.message);
      return res.status(500).json({
        success: false,
        error: "The server is missing the necessary API configuration (GEMINI_API_KEY environment variable is not defined)."
      });
    }

    // Convert incoming base64 payload into Gemini's Part structure
    const cleanedBase64 = fileBase64.replace(/^data:.*,/, "");
    const documentPart = {
      inlineData: {
        data: cleanedBase64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: `You are an elite financial PDF parser and OCR engine.
Analyze the uploaded bank statement document (PDF or image) and extract all transaction records accurately.

Follow these rules:
1. Target all tables containing transaction ledgers or histories. Skip general ads, generic disclaimers, decorative elements, and general informational charts.
2. Read dates carefully. Convert them to YYYY-MM-DD. Look at the statement header (or the files statementPeriod metadata) to resolve the correct transaction year if the year is missing in individual tables rows (like 'Oct 14' -> '2025-10-14').
3. For amounts, remove any currency symbols (e.g. $, £, €), remove thousands commas separators, and compile them as positive numbers.
4. Correctly classify 'DEBIT' vs 'CREDIT'. Withdrawal rows, payment columns, and bank fees are DEBITs. Deposit rows, credits column, salary, direct deposit, and reward payments are CREDITs.
5. Intelligently categorize each transaction based on description. Pick from: 'Salary & Income', 'Food & Dining', 'Utilities & Bills', 'Rent & Housing', 'Shopping', 'Travel & Transport', 'Entertainment', 'Healthcare', 'Transfers & Investments', 'Fees & Charges', 'Other'. Provide a categorization confidence rating between 0.0 and 1.0.
6. Gather starting balance, ending balance, total debits, total credits, bank name, account holder, account number, and currency cleanly. If they are completely absent or unreadable, default them to placeholder/logical guesses but NEVER make up fake transaction rows.

Process this file as structured JSON according to the schema provided.`
    };

    console.log("Submitting statement to Gemini OCR Engine with failover routing rules...");
    const response = await generateContentWithRetry(
      ai,
      { parts: [documentPart, textPart] },
      {
        responseMimeType: "application/json",
        responseSchema: bankingSchema,
        temperature: 0.1, // low temperature for precise extraction
      }
    );

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Empty response received from the Gemini OCR engine.");
    }

    console.log("Gemini parse successful.");
    const parsedData = JSON.parse(outputText.trim());

    // Send back formatted response
    return res.json({
      success: true,
      data: parsedData
    });

  } catch (error: any) {
    console.error("Statement Processing Error:", error);
    return res.status(500).json({
      success: false,
      error: `OCR Extraction Failed: ${error.message || "An unexpected error occurred during processing."}`
    });
  }
});

// App Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// --------------------------------------------------------
// Express + Vite Integration Mode Setup
// --------------------------------------------------------
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware integrated.");
  } else {
    // Serve production static assets from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Financial Server running at http://0.0.0.0:${PORT} [ENV: ${process.env.NODE_ENV || "development"}]`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
