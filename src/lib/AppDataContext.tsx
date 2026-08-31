import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import * as api from './api';
import type { BehaviourCategory, Campus, IlpBridgeNote, Incident, Student } from '../types';

interface AppDataState {
  campuses: Campus[];
  categories: BehaviourCategory[];
  ilpNotes: IlpBridgeNote[];
  students: Student[];
  incidents: Incident[];
  campusScope: string | null;
  setCampusScope: (id: string | null) => void;
  canSwitchCampus: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppDataState | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [categories, setCategories] = useState<BehaviourCategory[]>([]);
  const [ilpNotes, setIlpNotes] = useState<IlpBridgeNote[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const canSwitchCampus = profile?.campus_id == null;
  const [campusScope, setCampusScope] = useState<string | null>(profile?.campus_id ?? null);

  useEffect(() => {
    setCampusScope(profile?.campus_id ?? null);
  }, [profile?.campus_id]);

  const refresh = useCallback(async () => {
    if (!profile || profile.role === 'pending') return;
    setLoading(true);
    try {
      const [c, cat, ilp, st, inc] = await Promise.all([
        api.fetchCampuses(),
        api.fetchCategories(),
        api.fetchIlpNotes(),
        api.fetchStudents(campusScope),
        api.fetchIncidents(campusScope),
      ]);
      setCampuses(c);
      setCategories(cat);
      setIlpNotes(ilp);
      setStudents(st);
      setIncidents(inc);
    } finally {
      setLoading(false);
    }
  }, [profile, campusScope]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      campuses,
      categories,
      ilpNotes,
      students,
      incidents,
      campusScope,
      setCampusScope,
      canSwitchCampus,
      loading,
      refresh,
    }),
    [campuses, categories, ilpNotes, students, incidents, campusScope, canSwitchCampus, loading, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
