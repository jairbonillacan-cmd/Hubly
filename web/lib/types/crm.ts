export type LeadStage = "nuevo" | "contactado" | "propuesta" | "ganado" | "perdido";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  value: number; // MXN al mes
  stage: LeadStage;
  notes: string;
  createdAt: string; // ISO
}

export type QuoteStatus = "Borrador" | "Enviada" | "Aceptada" | "Rechazada";

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  leadId: string;
  title: string;
  status: QuoteStatus;
  items: QuoteItem[];
  createdAt: string; // ISO
}

