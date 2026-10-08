import crypto from 'node:crypto';

const COOKIE = 'cloudy_session';

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');
  return crypto.createHash('sha256').update(secret).digest();
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url');
}

export function encryptSession(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify({ ...payload, issuedAt: Date.now() }), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => encode(part)).join('.');
}

export function decryptSession(value) {
  try {
    const [ivText, tagText, ciphertextText] = String(value || '').split('.');
    if (!ivText || !tagText || !ciphertextText) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), decode(ivText));
    decipher.setAuthTag(decode(tagText));
    const plaintext = Buffer.concat([
      decipher.update(decode(ciphertextText)),
      decipher.final()
    ]).toString('utf8');
    const payload = JSON.parse(plaintext);
    if (!payload.user?.id || !payload.accessToken) return null;
    if (Date.now() - payload.issuedAt > 1000 * 60 * 60 * 24) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response, payload) {
  response.cookies.set(COOKIE, encryptSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export function getSession(request) {
  return decryptSession(request.cookies.get(COOKIE)?.value);
}

export { COOKIE };
