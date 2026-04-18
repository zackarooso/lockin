import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'lockin-dev-secret-change-me'
)
const COOKIE = 'lockin_session'

export async function signToken(payload: { userId: number; phone: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { userId: number; phone: string }
  } catch {
    return null
  }
}

export async function setSessionCookie(userId: number, phone: string) {
  const token = await signToken({ userId, phone })
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: '/',
  })
  return token
}

export async function getSession(): Promise<{ userId: number; phone: string } | null> {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function clearSession() {
  cookies().delete(COOKIE)
}
