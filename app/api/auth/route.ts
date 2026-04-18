import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateUser, updateUserName } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'
export async function POST(req: NextRequest) {
  try {
    const { phone, display_name } = await req.json()
    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
    const normalized = '+1' + digits.slice(-10)
    let user = await findOrCreateUser(normalized, display_name)
    if (display_name && !user.display_name) { await updateUserName(user.id, display_name); user.display_name = display_name }
    await setSessionCookie(user.id, normalized)
    return NextResponse.json({ user: { id: user.id, phone: user.phone, display_name: user.display_name }, isNew: !user.display_name })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}