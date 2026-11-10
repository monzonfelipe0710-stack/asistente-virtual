export type KnowledgeCategory =
  | "Todas"
  | "Licencias"
  | "Haberes"
  | "Ingresos"
  | "Trámites"
  | "Legajos"
  | "Sistemas";

export interface KnowledgeEntry {
  id: number;
  question: string;
  answer: string;
  category: Exclude<KnowledgeCategory, "Todas">;
  active: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export const knowledgeCategories: KnowledgeCategory[] = ["Todas", "Licencias", "Haberes", "Ingresos", "Trámites", "Legajos", "Sistemas"];
