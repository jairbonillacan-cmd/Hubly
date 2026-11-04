export interface BrandProject {
  id: string;
  brandId: string;
  title: string;
  description: string;
  progress: number;
  status: "En curso" | "Revisión" | "Completado";
  dueDate: string;
  deliverablesCount: number;
  pinned?: boolean;
  archived?: boolean;
}

