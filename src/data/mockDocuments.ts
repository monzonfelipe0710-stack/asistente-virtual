export type DocumentFormat = "PDF" | "DOCX" | "XLSX";
export type DocumentCategory = "Todos" | "Formularios" | "Guías" | "Modelos";

export interface MockDocument {
  id: number;
  title: string;
  description: string;
  category: Exclude<DocumentCategory, "Todos">;
  fileSize: string;
  format: DocumentFormat;
}

export const documents: MockDocument[] = [
  {
    id: 1,
    title: "Formulario de Licencia Anual",
    description: "Solicitud de licencia ordinaria para agentes de la administración pública.",
    category: "Formularios",
    fileSize: "245 KB",
    format: "PDF",
  },
  {
    id: 2,
    title: "Guía de Trámites Administrativos",
    description: "Manual completo con todos los procedimientos administrativos vigentes.",
    category: "Guías",
    fileSize: "1.2 MB",
    format: "PDF",
  },
  {
    id: 3,
    title: "Modelo de Nota - Solicitud de Certificación",
    description: "Plantilla modelo para solicitar certificación de servicios.",
    category: "Modelos",
    fileSize: "85 KB",
    format: "DOCX",
  },
  {
    id: 4,
    title: "Formulario de Declaración Jurada de Bienes",
    description: "Declaración jurada patrimonial obligatoria para agentes públicos.",
    category: "Formularios",
    fileSize: "310 KB",
    format: "PDF",
  },
  {
    id: 5,
    title: "Planilla de Liquidación de Viáticos",
    description: "Formulario para rendición de viáticos y gastos de viaje.",
    category: "Formularios",
    fileSize: "180 KB",
    format: "XLSX",
  },
  {
    id: 6,
    title: "Modelo de Convenio Marco",
    description: "Plantilla estandarizada para convenios entre organismos.",
    category: "Modelos",
    fileSize: "95 KB",
    format: "DOCX",
  },
];

export const documentCategories: DocumentCategory[] = ["Todos", "Formularios", "Guías", "Modelos"];