interface Video {
  id: string;
  key: string;
  filename: string;
  contentType: string;
  status?: string;
  teamId?: string | null;
  uploadedAt?: string;
  updatedAt?: string;
  description?: string;
  visibility?: "private" | "unlisted" | "public";
  madeForKids?: boolean;
  thumbnailKey?: string | null;
}

interface CachedVideo extends Video {
  cachedAt: number;
  playUrl?: string;
  webOptimizedUrl?: string;
  thumbnailUrl?: string;
}

class VideoCache {
  private cache = new Map<string, CachedVideo>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  get(id: string): CachedVideo | null {
    const cached = this.cache.get(id);
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.cachedAt > this.CACHE_DURATION) {
      this.cache.delete(id);
      return null;
    }
    
    return cached;
  }

  set(video: Video, playUrl?: string, webOptimizedUrl?: string, thumbnailUrl?: string): void {
    const cachedVideo: CachedVideo = {
      ...video,
      cachedAt: Date.now(),
      playUrl,
      webOptimizedUrl,
      thumbnailUrl,
    };
    this.cache.set(video.id, cachedVideo);
  }

  update(id: string, updates: Partial<Video>): void {
    const cached = this.cache.get(id);
    if (cached) {
      Object.assign(cached, updates);
      cached.cachedAt = Date.now(); // Refresh cache time
    }
  }

  invalidate(id: string): void {
    this.cache.delete(id);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cached URLs without full video data
  getUrls(id: string): { playUrl?: string; webOptimizedUrl?: string; thumbnailUrl?: string } | null {
    const cached = this.get(id);
    if (!cached) return null;
    
    return {
      playUrl: cached.playUrl,
      webOptimizedUrl: cached.webOptimizedUrl,
      thumbnailUrl: cached.thumbnailUrl,
    };
  }

  // Set thumbnail URL in cache
  setThumbnailUrl(id: string, thumbnailUrl: string): void {
    const cached = this.cache.get(id);
    if (cached) {
      cached.thumbnailUrl = thumbnailUrl;
      cached.cachedAt = Date.now(); // Refresh cache time
    }
  }

  // Get thumbnail URL from cache
  getThumbnailUrl(id: string): string | null {
    const cached = this.get(id);
    return cached?.thumbnailUrl || null;
  }
}

export const videoCache = new VideoCache();
export type { Video, CachedVideo };
