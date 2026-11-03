"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.clearSessions = exports.endSession = exports.startSession = exports.checkPassword = exports.makeUser = void 0;
exports.requireAuth = requireAuth;
const crypto_1 = require("crypto");
// Training-grade auth: scrypt password hashes and in-memory session tokens.
// For production use a real identity provider (SSO) and signed, expiring tokens.
const makeUser = (username, password, role) => {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    return { username, role, salt, hash: (0, crypto_1.scryptSync)(password, salt, 32).toString('hex') };
};
exports.makeUser = makeUser;
const checkPassword = (u, password) => (0, crypto_1.timingSafeEqual)(Buffer.from(u.hash, 'hex'), (0, crypto_1.scryptSync)(password, u.salt, 32));
exports.checkPassword = checkPassword;
const sessions = new Map();
const startSession = (u) => { const t = (0, crypto_1.randomUUID)(); sessions.set(t, u); return t; };
exports.startSession = startSession;
const endSession = (t) => sessions.delete(t);
exports.endSession = endSession;
const clearSessions = () => sessions.clear();
exports.clearSessions = clearSessions;
function requireAuth(req, res, next) {
    const token = (req.headers.authorization ?? '').replace('Bearer ', '');
    const user = sessions.get(token);
    if (!user)
        return res.status(401).json({ error: 'Please sign in' });
    req.user = user;
    req.token = token;
    next();
}
const requireRole = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Administrator access required' });
exports.requireRole = requireRole;
