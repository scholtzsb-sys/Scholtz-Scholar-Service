import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET is not set');

export function signSession(session) {
  return jwt.sign(session, SECRET, { expiresIn: '30d' });
}

export function verifySession(token) {
  return jwt.verify(token, SECRET);
}
