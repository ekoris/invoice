export type InvoiceStatus = 'DRAFT' | 'TERKIRIM' | 'LUNAS' | 'JATUH_TEMPO' | 'BATAL';

export interface InvoiceItemData {
  id?: string;
  product: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder?: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  title: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  
  // Company info
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;

  // Client info
  clientId?: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;

  // Items
  items: InvoiceItemData[];

  // Totals
  subtotal: number;
  taxPercent?: number;
  taxAmount?: number;
  discount?: number;
  total: number;

  // Contract & Term Breakdown
  contractTotal?: number;
  contractTerm?: string;
  contractPaid?: number;
  contractRemaining?: number;

  // Payment Details
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  transferNote?: string;

  // Tax Status & Terms
  taxNote?: string;
  termsConditions?: string;

  // Notes & Signature
  notes?: string;
  signatureImage?: string;
  signatureTitle?: string;
  signatureName?: string;
  signerRole?: string;
  showSignature?: boolean;

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ClientData {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt?: Date | string;
}

export interface CompanyProfileData {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  signatureUrl?: string;
  signerName: string;
  signerRole?: string;
  defaultNotes: string;
  taxNote?: string;
  termsConditions?: string;
}

export interface BankAccountData {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}
