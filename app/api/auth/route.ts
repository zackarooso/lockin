import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateUser, updateUserName, initDb, setUserWallet } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'
import { createWallet } from '@/lib/privy'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const { phone, display_name } = await req.json()
    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
    const normalized = '+1' + digits.slice(-10)
    let user = await findOrCreateUser(normalized, display_name)
    if (display_name && !user.display_name) {
      await updateUserName(user.id, display_name)
      user = { ...user, display_name }
    }
    // Create Privy wallet if user doesn't have one yet
    if (!user.privy_wallet_id) {
      const wallet = await createWallet()
      if (wallet) {
        await setUserWallet(user.id, wallet.id, wallet.address)
        user = { ...user, privy_wallet_id: wallet.id, privy_wallet_address: wallet.address }
      }
    }
    await setSessionCookie(Number(user.id), normalized)
    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        display_name: user.display_name,
        wallet_address: user.privy_wallet_address || null,
      },
      isNew: !user.display_name
    })
  } catch (e: any) {
    console.error('AUTH ERROR:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
