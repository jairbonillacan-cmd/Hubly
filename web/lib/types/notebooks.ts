export interface NotebookItem {
  id: string;
  brandId: string;
  title: string;
  subtitle: string;
  stamp?: string;
  variant?: "post" | "report" | "space" | "brand";
  category: string;
  content: string;
  bgGradient: string;
  accentColor: string;
  updatedAt: string;
  updatedBy: string;
  isPinned: boolean;
}


