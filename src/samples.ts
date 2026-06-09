import { BankStatementData } from "./types";

export const CHASE_SAMPLE: BankStatementData = {
  bankName: "Chase Bank NA",
  accountHolder: "SARAH JENKINS",
  accountNumber: "•••• 4820",
  statementPeriod: "October 1, 2025 - October 31, 2025",
  currency: "USD",
  startingBalance: 3450.25,
  endingBalance: 5912.60,
  totalDebits: 2137.65,
  totalCredits: 4600.00,
  transactions: [
    {
      id: "chase-1",
      date: "2025-10-01",
      description: "DIRECT DEPOSIT / PAYROLL TECHCORP",
      amount: 2300.00,
      type: "CREDIT",
      category: "Salary & Income",
      confidence: 0.98,
      referenceNumber: "TXN8892410-X",
      originalText: "10/01 TECHCORP PAYROLL DIR DEP   $2,300.00"
    },
    {
      id: "chase-2",
      date: "2025-10-02",
      description: "SAFEWAY STORES #1440 SAN FRANCISCO CA",
      amount: 142.50,
      type: "DEBIT",
      category: "Food & Dining",
      confidence: 0.95,
      referenceNumber: "SEQ44211",
      originalText: "10/02 SAFEWAY STORES #1440 S     $142.50"
    },
    {
      id: "chase-3",
      date: "2025-10-04",
      description: "STARBUCKS #11822 SEATTLE WA",
      amount: 14.75,
      type: "DEBIT",
      category: "Food & Dining",
      confidence: 0.99,
      referenceNumber: "STB8810",
      originalText: "10/04 STARBUCKS COFFEE #11822    $14.75"
    },
    {
      id: "chase-4",
      date: "2025-10-08",
      description: "PACIFIC GAS & ELECTRIC - ELEC BILL",
      amount: 85.20,
      type: "DEBIT",
      category: "Utilities & Bills",
      confidence: 0.96,
      referenceNumber: "PGE-884-2",
      originalText: "10/08 PG AND E INTERNET PYMT     $85.20"
    },
    {
      id: "chase-5",
      date: "2025-10-10",
      description: "AMAZON.COM*3M81H9S31 AMZN.COM/BILLWA",
      amount: 64.99,
      type: "DEBIT",
      category: "Shopping",
      confidence: 0.90,
      referenceNumber: "AMZN-22129",
      originalText: "10/10 AMAZON.COM*3M81H9S31 MKTPL  $64.99"
    },
    {
      id: "chase-6",
      date: "2025-10-12",
      description: "LANDLORD RENT HOUSING CORP",
      amount: 1600.00,
      type: "DEBIT",
      category: "Rent & Housing",
      confidence: 0.99,
      referenceNumber: "EFT-RENT-1",
      originalText: "10/12 RENT HOUSING EFT PYMT      $1,600.00"
    },
    {
      id: "chase-7",
      date: "2025-10-15",
      description: "DIRECT DEPOSIT / PAYROLL TECHCORP",
      amount: 2300.00,
      type: "CREDIT",
      category: "Salary & Income",
      confidence: 0.98,
      referenceNumber: "TXN8892415-X",
      originalText: "10/15 TECHCORP PAYROLL DIR DEP   $2,300.00"
    },
    {
      id: "chase-8",
      date: "2025-10-18",
      description: "CHEVRON #99431 OAKLAND CA",
      amount: 48.00,
      type: "DEBIT",
      category: "Travel & Transport",
      confidence: 0.94,
      referenceNumber: "CHV-00941",
      originalText: "10/18 CHEVRON OIL #99431 OAK     $48.00"
    },
    {
      id: "chase-9",
      date: "2025-10-22",
      description: "NETFLIX.COM INTERNET SUBSCRIPTION VIA",
      amount: 15.49,
      type: "DEBIT",
      category: "Entertainment",
      confidence: 0.97,
      referenceNumber: "NFLX-10",
      originalText: "10/22 NETFLIX COM STREAM SUB     $15.49"
    },
    {
      id: "chase-10",
      date: "2025-10-25",
      description: "CITY MEDICAL CLINIC CO-PAY",
      amount: 35.00,
      type: "DEBIT",
      category: "Healthcare",
      confidence: 0.95,
      referenceNumber: "CLNC-883",
      originalText: "10/25 CITY CLINIC HEALTH CO-PAY  $35.00"
    },
    {
      id: "chase-11",
      date: "2025-10-28",
      description: "MONTHLY SERVICE FEES / CHASE TOTAL CHECKING",
      amount: 12.00,
      type: "DEBIT",
      category: "Fees & Charges",
      confidence: 0.99,
      referenceNumber: "FEES-44",
      originalText: "10/28 MO SERVICE CHARGE          $12.00"
    },
    {
      id: "chase-12",
      date: "2025-10-30",
      description: "TRANSFER TO SAVINGS A/C **9014",
      amount: 121.72,
      type: "DEBIT",
      category: "Transfers & Investments",
      confidence: 0.92,
      referenceNumber: "XFER-9014",
      originalText: "10/30 ONLINE TRANSF DEB 9014     $121.72"
    }
  ]
};

export const BARCLAYS_SAMPLE: BankStatementData = {
  bankName: "Barclays Bank UK",
  accountHolder: "DR. OLIVER BENTLEY",
  accountNumber: "•••• 3391",
  statementPeriod: "September 1, 2025 - September 30, 2025",
  currency: "GBP",
  startingBalance: 1289.44,
  endingBalance: 2470.94,
  totalDebits: 1318.50,
  totalCredits: 2500.00,
  transactions: [
    {
      id: "barclays-1",
      date: "2025-09-01",
      description: "NHS ENGLAND PAYROLL SALARY",
      amount: 2500.00,
      type: "CREDIT",
      category: "Salary & Income",
      confidence: 0.99,
      referenceNumber: "NHS-992",
      originalText: "01 SEP NHS SALARY RECPT          £2,500.00"
    },
    {
      id: "barclays-2",
      date: "2025-09-03",
      description: "TFL TRAVEL CHARGE LONDON UNDERGROUND",
      amount: 8.40,
      type: "DEBIT",
      category: "Travel & Transport",
      confidence: 0.98,
      referenceNumber: "TFL-UNDER",
      originalText: "03 SEP CONTACTLESS TFL CTR       £8.40"
    },
    {
      id: "barclays-3",
      date: "2025-09-05",
      description: "Sainsburys Supermarkets London",
      amount: 64.20,
      type: "DEBIT",
      category: "Food & Dining",
      confidence: 0.97,
      referenceNumber: "SAINS-31",
      originalText: "05 SEP SAINSBURYS S/MKT 2911     £64.20"
    },
    {
      id: "barclays-4",
      date: "2025-09-10",
      description: "THAMES WATER DD BILLING",
      amount: 32.50,
      type: "DEBIT",
      category: "Utilities & Bills",
      confidence: 0.99,
      referenceNumber: "THM-WT-22",
      originalText: "10 SEP THAMES WATER DIRECT DEB   £32.50"
    },
    {
      id: "barclays-5",
      date: "2025-09-15",
      description: "FLAT 4B MONTHLY RENTAL PYMT",
      amount: 1100.00,
      type: "DEBIT",
      category: "Rent & Housing",
      confidence: 0.95,
      referenceNumber: "RENT-4B",
      originalText: "15 SEP STANDING ORDER - RENT B   £1,100.00"
    },
    {
      id: "barclays-6",
      date: "2025-09-18",
      description: "GastroPub Highbury London",
      amount: 72.00,
      type: "DEBIT",
      category: "Food & Dining",
      confidence: 0.92,
      referenceNumber: "PUB-4491",
      originalText: "18 SEP CARD PYMT GASTROPUB HIG   £72.00"
    },
    {
      id: "barclays-7",
      date: "2025-09-22",
      description: "BOOTS PHARMACY LONDON",
      amount: 16.40,
      type: "DEBIT",
      category: "Healthcare",
      confidence: 0.96,
      referenceNumber: "BT-PHRM",
      originalText: "22 SEP CARD PYMT BOOTS PHAR      £16.40"
    },
    {
      id: "barclays-8",
      date: "2025-09-29",
      description: "FOREIGN TRANSACTION FEE",
      amount: 25.00,
      type: "DEBIT",
      category: "Fees & Charges",
      confidence: 0.99,
      referenceNumber: "FEE-FTF",
      originalText: "29 SEP TRANS FEE CARD US-MKT     £25.00"
    }
  ]
};
