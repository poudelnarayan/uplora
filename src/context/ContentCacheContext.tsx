"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNotifications } from '@/components/ui/Notification';

interface ContentItem {
  id: string;
  type: 'video' | 'image' | 'text' | 'reel';
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  platforms: string[];
  scheduledFor?: string;
  metadata: any;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface ContentCache {
  [key: string]: {
    data: ContentItem[];
    total: number;
    timestamp: number;
    teamId: string;
    types: string[];
    status: string;
  };
}

interface ContentCacheContextType {
  getCachedContent: (teamId: string, types: string[], status: string) => ContentItem[] | null;
  setCachedContent: (teamId: string, types: string[], status: string, data: ContentItem[], total: number) => void;
  invalidateCache: (teamId?: string) => void;
  updateContentItem: (teamId: string, itemId: string, updates: Partial<ContentItem>) => void;
  removeContentItem: (teamId: string, itemId: string) => void;
  addContentItem: (teamId: string, item: ContentItem) => void;
  isStale: (teamId: string, types: string[], status: string) => boolean;
}

const ContentCacheContext = createContext<ContentCacheContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function ContentCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<ContentCache>({});
  const notifications = useNotifications();

  const generateCacheKey = useCallback((teamId: string, types: string[], status: string) => {
    return `${teamId}-${types.sort().join(',')}-${status}`;
  }, []);

  const getCachedContent = useCallback((teamId: string, types: string[], status: string): ContentItem[] | null => {
    const key = generateCacheKey(teamId, types, status);
    const cached = cache[key];
    
    if (!cached) return null;
    
    // Check if cache is stale
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      return null;
    }
    
    return cached.data;
  }, [cache, generateCacheKey]);

  const setCachedContent = useCallback((teamId: string, types: string[], status: string, data: ContentItem[], total: number) => {
    const key = generateCacheKey(teamId, types, status);
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        total,
        timestamp: Date.now(),
        teamId,
        types,
        status
      }
    }));
  }, [generateCacheKey]);

  const invalidateCache = useCallback((teamId?: string) => {
    if (teamId) {
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          if (newCache[key].teamId === teamId) {
            delete newCache[key];
          }
        });
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  const updateContentItem = useCallback((teamId: string, itemId: string, updates: Partial<ContentItem>) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (newCache[key].teamId === teamId) {
          newCache[key] = {
            ...newCache[key],
            data: newCache[key].data.map(item => 
              item.id === itemId ? { ...item, ...updates } : item
            )
          };
        }
      });
      return newCache;
    });
  }, []);

  const removeContentItem = useCallback((teamId: string, itemId: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (newCache[key].teamId === teamId) {
          newCache[key] = {
            ...newCache[key],
            data: newCache[key].data.filter(item => item.id !== itemId),
            total: Math.max(0, newCache[key].total - 1)
          };
        }
      });
      return newCache;
    });
  }, []);

  const addContentItem = useCallback((teamId: string, item: ContentItem) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (newCache[key].teamId === teamId) {
          newCache[key] = {
            ...newCache[key],
            data: [item, ...newCache[key].data],
            total: newCache[key].total + 1
          };
        }
      });
      return newCache;
    });
  }, []);

  const isStale = useCallback((teamId: string, types: string[], status: string): boolean => {
    const key = generateCacheKey(teamId, types, status);
    const cached = cache[key];
    
    if (!cached) return true;
    
    return Date.now() - cached.timestamp > CACHE_DURATION;
  }, [cache, generateCacheKey]);

  // Clean up stale cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(prev => {
        const newCache = { ...prev };
        const now = Date.now();
        
        Object.keys(newCache).forEach(key => {
          if (now - newCache[key].timestamp > CACHE_DURATION) {
            delete newCache[key];
          }
        });
        
        return newCache;
      });
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  const value: ContentCacheContextType = {
    getCachedContent,
    setCachedContent,
    invalidateCache,
    updateContentItem,
    removeContentItem,
    addContentItem,
    isStale
  };

  return (
    <ContentCacheContext.Provider value={value}>
      {children}
    </ContentCacheContext.Provider>
  );
}

export function useContentCache() {
  const context = useContext(ContentCacheContext);
  if (context === undefined) {
    throw new Error('useContentCache must be used within a ContentCacheProvider');
  }
  return context;
}
