import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { Role, User } from './types';

// Training-grade auth: scrypt password hashes and in-memory session tokens.
// For production use a real identity provider (SSO) and signed, expiring tokens.
export const makeUser = (username: string, password: string, role: Role): User => {
  const salt = randomBytes(16).toString('hex');
  return { username, role, salt, hash: scryptSync(password, salt, 32).toString('hex') };
};
export const checkPassword = (u: User, password: string) =>
  timingSafeEqual(Buffer.from(u.hash, 'hex'), scryptSync(password, u.salt, 32));

const sessions = new Map<string, User>();
export const startSession = (u: User) => { const t = randomUUID(); sessions.set(t, u); return t; };
export const endSession = (t: string) => sessions.delete(t);
export const clearSessions = () => sessions.clear();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  const user = sessions.get(token);
  if (!user) return res.status(401).json({ error: 'Please sign in' });
  (req as any).user = user; (req as any).token = token;
  next();
}
export const requireRole = (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) =>
  roles.includes((req as any).user.role) ? next() : res.status(403).json({ error: 'Administrator access required' });
