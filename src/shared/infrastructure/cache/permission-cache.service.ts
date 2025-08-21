import { LoggerService } from '../logging/logger.service';
import { DateUtils } from '../utils/date.utils';

export interface CacheEntry<T> {
  data: T;
  expiresAt: string; // ISO UTC string
  createdAt: string; // ISO UTC string
}

export interface UserPermissions {
  userId: string;
  permissions: string[];
  roles: Array<{
    id: string;
    name: string;
    permissions: string[];
  }>;
}

export interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  lastCleanup: string;
  memoryUsage: {
    estimatedBytes: number;
    maxEntries: number;
  };
}

export class PermissionCacheService {
  private static instance: PermissionCacheService;
  private readonly cache = new Map<string, CacheEntry<UserPermissions>>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ENTRIES = 10000; // Prevent memory leaks
  private readonly logger = LoggerService.getInstance();

  // Statistics tracking
  private stats = {
    hits: 0,
    misses: 0,
    lastCleanup: DateUtils.utcNow(),
  };

  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);

    // Log cache stats every 10 minutes
    setInterval(
      () => {
        this.logStats();
      },
      10 * 60 * 1000
    );
  }

  public static getInstance(): PermissionCacheService {
    if (!PermissionCacheService.instance) {
      PermissionCacheService.instance = new PermissionCacheService();
    }
    return PermissionCacheService.instance;
  }

  public async getUserPermissions(
    userId: string,
    fetchFunction: (userId: string) => Promise<UserPermissions>
  ): Promise<UserPermissions> {
    const cacheKey = this.generateCacheKey(userId);
    const cached = this.cache.get(cacheKey);
    const now = DateUtils.utcNow();

    // Check if cached entry exists and is not expired
    if (cached && DateUtils.isAfter(cached.expiresAt, now)) {
      this.stats.hits++;
      this.logger.debug('Permission cache hit', {
        userId,
        cacheKey,
        expiresAt: cached.expiresAt,
      });
      return cached.data;
    }

    // Cache miss - fetch fresh data
    this.stats.misses++;
    this.logger.debug('Permission cache miss', {
      userId,
      cacheKey,
      expired: cached ? DateUtils.isAfter(now, cached.expiresAt) : false,
    });

    try {
      const permissions = await fetchFunction(userId);

      // Store in cache
      this.set(userId, permissions);

      return permissions;
    } catch (error) {
      this.logger.error('Failed to fetch user permissions', error, { userId });

      // Return stale data if available and not too old (up to 15 minutes)
      if (cached && DateUtils.getDifferenceInMinutes(now, cached.createdAt) <= 15) {
        this.logger.warn('Returning stale permission data due to fetch error', {
          userId,
          age: DateUtils.getDifferenceInMinutes(now, cached.createdAt),
        });
        return cached.data;
      }

      throw error;
    }
  }

  public set(userId: string, permissions: UserPermissions): void {
    const cacheKey = this.generateCacheKey(userId);
    const now = DateUtils.utcNow();
    const expiresAt = DateUtils.addMinutes(now, this.TTL_MS / 60000);

    // Check cache size limits
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.evictOldest();
    }

    this.cache.set(cacheKey, {
      data: permissions,
      expiresAt,
      createdAt: now,
    });

    this.logger.debug('Cached user permissions', {
      userId,
      cacheKey,
      expiresAt,
      permissionCount: permissions.permissions.length,
      roleCount: permissions.roles.length,
    });
  }

  public invalidateUser(userId: string): void {
    const cacheKey = this.generateCacheKey(userId);
    const deleted = this.cache.delete(cacheKey);

    if (deleted) {
      this.logger.debug('Invalidated user permissions cache', { userId, cacheKey });
    }
  }

  public invalidateUsersWithRole(roleId: string): void {
    let invalidatedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.data.roles.some(role => role.id === roleId)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    this.logger.info('Invalidated permissions cache for users with role', {
      roleId,
      invalidatedCount,
    });
  }

  public invalidateAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;

    this.logger.info('Cleared all permission cache entries', { clearedCount: size });
  }

  public getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      lastCleanup: this.stats.lastCleanup,
      memoryUsage: {
        estimatedBytes: this.estimateMemoryUsage(),
        maxEntries: this.MAX_ENTRIES,
      },
    };
  }

  public async warmup(
    userIds: string[],
    fetchFunction: (userId: string) => Promise<UserPermissions>
  ): Promise<void> {
    this.logger.info('Starting permission cache warmup', { userCount: userIds.length });

    const promises = userIds.map(async userId => {
      try {
        await this.getUserPermissions(userId, fetchFunction);
      } catch (error) {
        this.logger.error('Failed to warmup cache for user', error, { userId });
      }
    });

    await Promise.allSettled(promises);
  }

  public cleanup(): void {
    const now = DateUtils.utcNow();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (DateUtils.isAfter(now, entry.expiresAt)) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    this.stats.lastCleanup = now;

    if (expiredCount > 0) {
      this.logger.debug('Cleaned up expired permission cache entries', {
        expiredCount,
        remainingCount: this.cache.size,
      });
    }
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    this.logger.info('Permission cache service destroyed');
  }

  private generateCacheKey(userId: string): string {
    return `permissions:${userId}`;
  }

  private evictOldest(): void {
    // Find the oldest entry by created date
    let oldestKey: string | null = null;
    let oldestDate: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldestDate || DateUtils.isBefore(entry.createdAt, oldestDate)) {
        oldestKey = key;
        oldestDate = entry.createdAt;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug('Evicted oldest permission cache entry', {
        evictedKey: oldestKey,
        age: DateUtils.getDifferenceInMinutes(DateUtils.utcNow(), oldestDate!),
      });
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalBytes = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Key size
      totalBytes += key.length * 2; // Unicode characters are 2 bytes each

      // Entry metadata
      totalBytes += 100; // Rough estimate for dates and structure

      // Data size estimation
      totalBytes += JSON.stringify(entry.data).length * 2;
    }

    return totalBytes;
  }

  private logStats(): void {
    const stats = this.getStats();
    this.logger.info('Permission cache statistics', {
      ...stats,
      memoryUsage: {
        ...stats.memoryUsage,
        estimatedMB: Math.round((stats.memoryUsage.estimatedBytes / 1024 / 1024) * 100) / 100,
      },
    });
  }

  // Helper method to check if user has specific permission
  public static hasPermission(
    userPermissions: UserPermissions,
    requiredPermission: string
  ): boolean {
    return userPermissions.permissions.includes(requiredPermission);
  }

  // Helper method to check if user has any of the specified permissions
  public static hasAnyPermission(
    userPermissions: UserPermissions,
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.some(permission => userPermissions.permissions.includes(permission));
  }

  // Helper method to check if user has all of the specified permissions
  public static hasAllPermissions(
    userPermissions: UserPermissions,
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.every(permission =>
      userPermissions.permissions.includes(permission)
    );
  }

  // Helper method to get user roles
  public static getUserRoles(userPermissions: UserPermissions): string[] {
    return userPermissions.roles.map(role => role.name);
  }

  // Helper method to check if user has specific role
  public static hasRole(userPermissions: UserPermissions, roleName: string): boolean {
    return userPermissions.roles.some(role => role.name === roleName);
  }
}
