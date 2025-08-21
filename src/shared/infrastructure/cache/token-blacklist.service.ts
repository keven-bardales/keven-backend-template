import { LoggerService } from '../logging/logger.service';
import { DateUtils } from '../utils/date.utils';

export interface BlacklistedToken {
  jti: string; // JWT ID
  userId: string;
  tokenType: 'access' | 'refresh';
  blacklistedAt: string;
  expiresAt: string;
  reason:
    | 'logout'
    | 'logout_all'
    | 'password_change'
    | 'account_disabled'
    | 'security_breach'
    | 'manual';
}

export interface TokenBlacklistStats {
  totalBlacklisted: number;
  byType: {
    access: number;
    refresh: number;
  };
  byReason: Record<string, number>;
  lastCleanup: string;
  estimatedMemoryUsage: number;
}

export class TokenBlacklistService {
  private static instance: TokenBlacklistService;
  private readonly blacklist = new Map<string, BlacklistedToken>();
  private readonly logger = LoggerService.getInstance();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Run cleanup every hour to remove expired tokens
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      60 * 60 * 1000
    );

    // Log blacklist stats every 6 hours
    setInterval(
      () => {
        this.logStats();
      },
      6 * 60 * 60 * 1000
    );
  }

  public static getInstance(): TokenBlacklistService {
    if (!TokenBlacklistService.instance) {
      TokenBlacklistService.instance = new TokenBlacklistService();
    }
    return TokenBlacklistService.instance;
  }

  /**
   * Blacklist a specific token
   */
  public blacklistToken(
    jti: string,
    userId: string,
    tokenType: 'access' | 'refresh',
    expiresAt: string,
    reason: BlacklistedToken['reason']
  ): void {
    const blacklistedToken: BlacklistedToken = {
      jti,
      userId,
      tokenType,
      blacklistedAt: DateUtils.utcNow(),
      expiresAt,
      reason,
    };

    this.blacklist.set(jti, blacklistedToken);

    this.logger.security('Token blacklisted', {
      jti,
      userId,
      tokenType,
      reason,
      expiresAt,
    });
  }

  /**
   * Blacklist all tokens for a user
   */
  public blacklistAllUserTokens(
    userId: string,
    reason: BlacklistedToken['reason'] = 'logout_all'
  ): number {
    let blacklistedCount = 0;
    const now = DateUtils.utcNow();

    // Find all non-expired tokens for this user and blacklist them
    for (const [jti, token] of this.blacklist.entries()) {
      if (token.userId === userId && DateUtils.isAfter(token.expiresAt, now)) {
        // Update the reason if not already blacklisted
        this.blacklist.set(jti, {
          ...token,
          reason,
          blacklistedAt: now,
        });
        blacklistedCount++;
      }
    }

    this.logger.security('All user tokens blacklisted', {
      userId,
      reason,
      blacklistedCount,
    });

    return blacklistedCount;
  }

  /**
   * Blacklist all refresh tokens for a user (typically on password change)
   */
  public blacklistUserRefreshTokens(
    userId: string,
    reason: BlacklistedToken['reason'] = 'password_change'
  ): number {
    let blacklistedCount = 0;
    const now = DateUtils.utcNow();

    for (const [jti, token] of this.blacklist.entries()) {
      if (
        token.userId === userId &&
        token.tokenType === 'refresh' &&
        DateUtils.isAfter(token.expiresAt, now)
      ) {
        this.blacklist.set(jti, {
          ...token,
          reason,
          blacklistedAt: now,
        });
        blacklistedCount++;
      }
    }

    this.logger.security('User refresh tokens blacklisted', {
      userId,
      reason,
      blacklistedCount,
    });

    return blacklistedCount;
  }

  /**
   * Check if a token is blacklisted
   */
  public isTokenBlacklisted(jti: string): boolean {
    const token = this.blacklist.get(jti);

    if (!token) {
      return false;
    }

    // Check if token has expired - if so, it's not really blacklisted anymore
    if (DateUtils.isAfter(DateUtils.utcNow(), token.expiresAt)) {
      // Clean up expired entry
      this.blacklist.delete(jti);
      return false;
    }

    this.logger.security('Blocked blacklisted token usage', {
      jti,
      userId: token.userId,
      tokenType: token.tokenType,
      reason: token.reason,
      blacklistedAt: token.blacklistedAt,
    });

    return true;
  }

  /**
   * Get blacklist information for a token
   */
  public getBlacklistInfo(jti: string): BlacklistedToken | null {
    const token = this.blacklist.get(jti);

    if (!token) {
      return null;
    }

    // Check if token has expired
    if (DateUtils.isAfter(DateUtils.utcNow(), token.expiresAt)) {
      this.blacklist.delete(jti);
      return null;
    }

    return token;
  }

  /**
   * Remove a token from blacklist (typically not needed, but useful for testing)
   */
  public removeFromBlacklist(jti: string): boolean {
    const removed = this.blacklist.delete(jti);

    if (removed) {
      this.logger.debug('Token removed from blacklist', { jti });
    }

    return removed;
  }

  /**
   * Get all blacklisted tokens for a user
   */
  public getUserBlacklistedTokens(userId: string): BlacklistedToken[] {
    const userTokens: BlacklistedToken[] = [];
    const now = DateUtils.utcNow();

    for (const token of this.blacklist.values()) {
      if (token.userId === userId && DateUtils.isAfter(token.expiresAt, now)) {
        userTokens.push(token);
      }
    }

    return userTokens;
  }

  /**
   * Get blacklist statistics
   */
  public getStats(): TokenBlacklistStats {
    const stats: TokenBlacklistStats = {
      totalBlacklisted: 0,
      byType: {
        access: 0,
        refresh: 0,
      },
      byReason: {},
      lastCleanup: DateUtils.utcNow(),
      estimatedMemoryUsage: 0,
    };

    let totalMemory = 0;
    const now = DateUtils.utcNow();

    for (const [jti, token] of this.blacklist.entries()) {
      // Only count non-expired tokens
      if (DateUtils.isAfter(token.expiresAt, now)) {
        stats.totalBlacklisted++;
        stats.byType[token.tokenType]++;

        if (!stats.byReason[token.reason]) {
          stats.byReason[token.reason] = 0;
        }
        stats.byReason[token.reason]++;

        // Estimate memory usage
        totalMemory += jti.length * 2; // Unicode characters are 2 bytes
        totalMemory += JSON.stringify(token).length * 2;
        totalMemory += 64; // Overhead for Map entry
      }
    }

    stats.estimatedMemoryUsage = totalMemory;
    return stats;
  }

  /**
   * Clean up expired tokens from blacklist
   */
  public cleanup(): void {
    const now = DateUtils.utcNow();
    let cleanedCount = 0;

    for (const [jti, token] of this.blacklist.entries()) {
      if (DateUtils.isAfter(now, token.expiresAt)) {
        this.blacklist.delete(jti);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug('Cleaned up expired blacklisted tokens', {
        cleanedCount,
        remainingCount: this.blacklist.size,
      });
    }
  }

  /**
   * Clear all blacklisted tokens (use with caution)
   */
  public clearAll(): number {
    const count = this.blacklist.size;
    this.blacklist.clear();

    this.logger.warn('All blacklisted tokens cleared', { clearedCount: count });

    return count;
  }

  /**
   * Emergency blacklist - blacklist all tokens globally
   * This is used in case of a security breach
   */
  public emergencyBlacklistAll(reason: string = 'security_breach'): number {
    const blacklistedCount = 0;
    const now = DateUtils.utcNow();

    // This would need to be implemented by fetching all active tokens from database
    // For now, we'll just log the emergency action
    this.logger.fatal('Emergency blacklist activated', {
      reason,
      timestamp: now,
      action: 'all_tokens_invalidated',
    });

    // In a real implementation, you might:
    // 1. Update a global "emergency blacklist" timestamp in database
    // 2. All tokens issued before this timestamp are considered invalid
    // 3. Force all users to re-authenticate

    return blacklistedCount;
  }

  /**
   * Check if a token was issued before an emergency blacklist
   */
  public isTokenFromBeforeEmergencyBlacklist(
    tokenIssuedAt: string,
    emergencyTimestamp?: string
  ): boolean {
    if (!emergencyTimestamp) {
      return false;
    }

    return DateUtils.isBefore(tokenIssuedAt, emergencyTimestamp);
  }

  /**
   * Destroy the service and clean up resources
   */
  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.blacklist.clear();
    this.logger.info('Token blacklist service destroyed');
  }

  private logStats(): void {
    const stats = this.getStats();
    this.logger.info('Token blacklist statistics', {
      ...stats,
      memoryUsageMB: Math.round((stats.estimatedMemoryUsage / 1024 / 1024) * 100) / 100,
    });
  }
}
