export type DocumentFormat = "PDF" | "DOCX" | "XLSX";
export type DocumentCategory = "Todos" | "Formularios" | "Guías" | "Modelos";

export interface MockDocument {
  id: number;
  title: string;
  description: string;
  category: Exclude<DocumentCategory, "Todos">;
  format: DocumentFormat;
  fileSize: string;
  downloads: number;
  updatedAt: string;
}

export const documentCategories: DocumentCategory[] = ["Todos", "Formularios", "Guías", "Modelos"];
export const documentFormats: DocumentFormat[] = ["PDF", "DOCX", "XLSX"];
