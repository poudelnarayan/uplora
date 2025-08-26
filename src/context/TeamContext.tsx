"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type TeamBasic = { id: string; name: string; description?: string };

type TeamContextType = {
  teams: TeamBasic[];
  selectedTeamId: string | null;
  selectedTeam: TeamBasic | null;
  personalTeam: TeamBasic | null;
  setSelectedTeamId: (id: string | null) => void;
  refreshTeams: () => Promise<void>;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<TeamBasic[]>([]);
  const [selectedTeamId, setSelectedTeamIdState] = useState<string | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [personalTeam, setPersonalTeam] = useState<TeamBasic | null>(null);
  // Shared in-memory cache to prevent duplicate calls across pages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  if (!g.__teamsSharedCache) {
    g.__teamsSharedCache = { data: [] as TeamBasic[], personal: null as TeamBasic | null, etag: null as string | null, t: 0, inflight: null as Promise<{ data: TeamBasic[]; personal: TeamBasic | null; etag: string | null }> | null };
  }
  const shared = g.__teamsSharedCache as { data: TeamBasic[]; personal: TeamBasic | null; etag: string | null; t: number; inflight: Promise<{ data: TeamBasic[]; personal: TeamBasic | null; etag: string | null }> | null };
  const CACHE_TTL_MS = 5 * 60 * 1000;

  const setSelectedTeamId = (id: string | null) => {
    setSelectedTeamIdState(id);
    if (id) localStorage.setItem("currentTeamId", id);
    else localStorage.removeItem("currentTeamId");
  };

  const extractTeamsPayload = (json: any): TeamBasic[] => {
    if (Array.isArray(json)) return json as TeamBasic[];
    if (Array.isArray(json?.data)) return json.data as TeamBasic[];
    if (json?.ok && Array.isArray(json?.data)) return json.data as TeamBasic[];
    if (json?.ok && Array.isArray(json?.data?.data)) return json.data.data as TeamBasic[];
    return [];
  };

  const refreshTeams = async (force = false) => {
    try {
      // Use shared cache unless forced (e.g., after SSE event)
      if (!force && shared.data.length > 0 && Date.now() - shared.t < CACHE_TTL_MS) {
        setTeams(shared.data.filter(t => !(t as any).isPersonal));
        setPersonalTeam(shared.personal);
        if (shared.etag) setEtag(shared.etag);
        // Ensure selection remains valid
        const stored = localStorage.getItem("currentTeamId");
        const existing = stored && (
          shared.data.some(t => t.id === stored) || (shared.personal && shared.personal.id === stored)
        ) ? stored : null;
        if (existing) setSelectedTeamIdState(existing);
        return;
      }

      if (shared.inflight) {
        const infl = await shared.inflight;
        setTeams(infl.data.filter(t => !(t as any).isPersonal));
        setPersonalTeam(infl.personal);
        if (infl.etag) setEtag(infl.etag);
        return;
      }

      const res = await fetch("/api/teams", { cache: "no-store", headers: etag ? { "If-None-Match": etag } : {} });
      if (res.status === 304) return;
      if (!res.ok) return;
      const json = await res.json();
      const allTeams: TeamBasic[] = extractTeamsPayload(json);
      
      // Separate personal workspace from regular teams
      const personalWorkspace = allTeams.find(t => (t as any).isPersonal) || null;
      const regularTeams = allTeams.filter(t => !(t as any).isPersonal);
      
      setTeams(regularTeams);
      setPersonalTeam(personalWorkspace);
      
      // Store personal workspace separately for context
      if (personalWorkspace) {
        try {
          localStorage.setItem('personal-workspace', JSON.stringify(personalWorkspace));
        } catch {}
      }
      
      const newEtag = res.headers.get('ETag');
      if (newEtag) setEtag(newEtag);
      try { 
        localStorage.setItem('teams-cache', JSON.stringify({ 
          data: regularTeams, 
          personal: personalWorkspace,
          etag: newEtag, 
          t: Date.now() 
        })); 
      } catch {}
      // Update shared cache
      shared.data = allTeams;
      shared.personal = personalWorkspace;
      shared.etag = newEtag;
      shared.t = Date.now();
      
      // Ensure a valid selection
      const stored = localStorage.getItem("currentTeamId");
      const existing = stored && (
        regularTeams.some(t => t.id === stored) || 
        (personalWorkspace && personalWorkspace.id === stored)
      ) ? stored : null;
      
      if (existing) {
        setSelectedTeamIdState(existing);
      } else if (personalWorkspace) {
        // Default to personal workspace (use its ID)
        setSelectedTeamIdState(personalWorkspace.id);
      } else if (regularTeams.length > 0) {
        setSelectedTeamIdState(regularTeams[0].id);
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
      if (cached?.personal) setPersonalTeam(cached.personal);
    } catch {}

    // Hydrate from shared cache or local storage first for instant UI
    try {
      if (shared.data.length > 0 && Date.now() - shared.t < CACHE_TTL_MS) {
        setTeams(shared.data.filter(t => !(t as any).isPersonal));
        setPersonalTeam(shared.personal);
      } else {
        const cached = JSON.parse(localStorage.getItem('teams-cache') || 'null');
        if (cached?.data) setTeams(cached.data);
        if (cached?.etag) setEtag(cached.etag);
        if (cached?.personal) setPersonalTeam(cached.personal);
      }
    } catch {}

    refreshTeams(false);
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
          if (evt?.type?.startsWith('team.')) refreshTeams(true);
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

  const selectedTeam = useMemo(() => {
    // Check regular teams first
    const regularTeam = teams.find(t => t.id === selectedTeamId);
    if (regularTeam) return regularTeam;
    
    // Check personal workspace from state
    if (personalTeam && personalTeam.id === selectedTeamId) return personalTeam;
    
    // Check personal workspace from cache
    try {
      const cached = JSON.parse(localStorage.getItem('teams-cache') || 'null');
      if (cached?.personal && cached.personal.id === selectedTeamId) {
        return cached.personal;
      }
    } catch {}
    
    return null;
  }, [teams, personalTeam, selectedTeamId]);

  const value: TeamContextType = {
    teams,
    selectedTeamId,
    selectedTeam,
    personalTeam,
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
    personalTeam: null,
    setSelectedTeamId: () => {},
    refreshTeams: async () => {},
  };
}
