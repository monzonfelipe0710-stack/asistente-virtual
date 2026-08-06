import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { knowledgeBase, type KnowledgeEntry } from "../data/mockKnowledge";
import { users, sigedRecords, type AppUser, type SigedRecord } from "../data/mockSiged";

interface AppDataValue {
  knowledge: KnowledgeEntry[];
  toggleKnowledgeActive: (id: number) => void;
  users: AppUser[];
  siged: SigedRecord[];
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>(knowledgeBase);

  // Sin dependencias reales (usa la forma funcional de setState), así que la
  // referencia queda estable para siempre: solo tiene sentido por ser
  // dependencia del useMemo de abajo.
  const toggleKnowledgeActive = useCallback((id: number) => {
    setKnowledge((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, active: !entry.active } : entry))
    );
  }, []);

  // Sin esto, este objeto es literal nuevo en cada render del Provider y
  // todo componente que consuma el contexto se re-renderiza aunque el dato
  // que le importa a ÉL no haya cambiado.
  const value = useMemo(
    () => ({ knowledge, toggleKnowledgeActive, users, siged: sigedRecords }),
    [knowledge, toggleKnowledgeActive]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData debe usarse dentro de AppDataProvider");
  return ctx;
}

export const useKnowledgeBase = () => {
  const { knowledge, toggleKnowledgeActive } = useAppData();
  return { items: knowledge, toggleActive: toggleKnowledgeActive };
};

export const useUsers = () => {
  const { users } = useAppData();
  return { items: users };
};

export const useSigedRecords = () => {
  const { siged } = useAppData();
  return { items: siged };
};
