"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type TeamBasic = { id: string; name: string; description?: string };

type TeamContextType = {
  teams: TeamBasic[];
  selectedTeamId: string | null;
  selectedTeam: TeamBasic | null;
  setSelectedTeamId: (id: string | null) => void;
  refreshTeams: () => Promise<void>;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<TeamBasic[]>([]);
  const [selectedTeamId, setSelectedTeamIdState] = useState<string | null>(null);

  const setSelectedTeamId = (id: string | null) => {
    setSelectedTeamIdState(id);
    if (id) localStorage.setItem("currentTeamId", id);
    else localStorage.removeItem("currentTeamId");
  };

  const refreshTeams = async () => {
    try {
      const res = await fetch("/api/teams", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list: TeamBasic[] = Array.isArray(data) ? data : [];
      setTeams(list);
      // Ensure a valid selection
      const stored = localStorage.getItem("currentTeamId");
      const existing = stored && list.some(t => t.id === stored) ? stored : null;
      if (existing) {
        setSelectedTeamIdState(existing);
      } else if (list.length > 0) {
        setSelectedTeamIdState(list[0].id);
      } else {
        setSelectedTeamIdState(null);
      }
    } catch {}
  };

  useEffect(() => {
    refreshTeams();
    const onFocusOrVisible = () => { if (!document.hidden) refreshTeams(); };
    const interval = setInterval(onFocusOrVisible, 10000);
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    // Sync across tabs
    const onStorage = (e: StorageEvent) => { if (e.key === "currentTeamId") setSelectedTeamIdState(e.newValue); };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTeam = useMemo(() => teams.find(t => t.id === selectedTeamId) || null, [teams, selectedTeamId]);

  const value: TeamContextType = {
    teams,
    selectedTeamId,
    selectedTeam,
    setSelectedTeamId,
    refreshTeams,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextType {
  const ctx = useContext(TeamContext);
  if (ctx) return ctx;
  // Safe fallback (prevents runtime crash if provider not mounted yet)
  return {
    teams: [],
    selectedTeamId: null,
    selectedTeam: null,
    setSelectedTeamId: () => {},
    refreshTeams: async () => {},
  };
}
