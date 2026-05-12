import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getUserById, getUserWallet, initDb } from '@/lib/db'
import { getOnrampUrl } from '@/lib/privy'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserById(session.userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const wallet = await getUserWallet(session.userId)

    return NextResponse.json({
      wallet_address: wallet?.wallet_address || null,
      wallet_id: wallet?.wallet_id || null,
      onramp_url: wallet?.wallet_address ? getOnrampUrl(wallet.wallet_address) : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
