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
  const [etag, setEtag] = useState<string | null>(null);

  const setSelectedTeamId = (id: string | null) => {
    setSelectedTeamIdState(id);
    if (id) localStorage.setItem("currentTeamId", id);
    else localStorage.removeItem("currentTeamId");
  };

  const refreshTeams = async () => {
    try {
      const res = await fetch("/api/teams", { cache: "no-store", headers: etag ? { "If-None-Match": etag } : {} });
      if (res.status === 304) return;
      if (!res.ok) return;
      const data = await res.json();
      const list: TeamBasic[] = Array.isArray(data) ? data : [];
      setTeams(list);
      const newEtag = res.headers.get('ETag');
      if (newEtag) setEtag(newEtag);
      try { localStorage.setItem('teams-cache', JSON.stringify({ data: list, etag: newEtag, t: Date.now() })); } catch {}
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
    // hydrate from cache
    try {
      const cached = JSON.parse(localStorage.getItem('teams-cache') || 'null');
      if (cached?.data) setTeams(cached.data);
      if (cached?.etag) setEtag(cached.etag);
    } catch {}

    refreshTeams();
    const onFocusOrVisible = () => { if (!document.hidden) refreshTeams(); };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    // Sync across tabs
    const onStorage = (e: StorageEvent) => { if (e.key === "currentTeamId") setSelectedTeamIdState(e.newValue); };
    window.addEventListener("storage", onStorage);

    // SSE subscribe for team updates
    let es: EventSource | null = null;
    try {
      const url = selectedTeamId ? `/api/events?teamId=${encodeURIComponent(selectedTeamId)}` : `/api/events`;
      es = new EventSource(url);
      es.onmessage = (ev) => {
        try {
          const evt = JSON.parse(ev.data);
          if (evt?.type?.startsWith('team.')) refreshTeams();
        } catch {}
      };
      es.onerror = () => { try { es?.close(); } catch {}; es = null; };
    } catch {}

    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      window.removeEventListener("storage", onStorage);
      try { es?.close(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId]);

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
