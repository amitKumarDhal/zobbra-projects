import { Request, Response, NextFunction } from 'express';

/**
 * Minimal fixed-window, per-IP rate limiter (in-process memory).
 *
 * This is a first line of defence only. Per-phone limits that must hold across
 * instances (resend cooldown, sends per hour, verify attempts) are enforced in
 * the database by the OTP service.
 */
export interface RateLimiter {
  (req: Request, res: Response, next: NextFunction): void;
  reset(): void;
}

export function createRateLimiter(opts: { windowMs: number; max: number; message: string }): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  const limiter = ((req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';

    // Opportunistic cleanup so the map cannot grow unbounded
    if (hits.size > 10000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, message: opts.message, retryAfter });
    }
    next();
  }) as RateLimiter;

  limiter.reset = () => hits.clear();
  return limiter;
}
