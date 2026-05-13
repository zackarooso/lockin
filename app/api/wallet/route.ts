import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getUserWallet, initDb } from '@/lib/db'
import { getOnrampUrl, getUSDCBalance } from '@/lib/privy'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wallet = await getUserWallet(session.userId)
    if (!wallet?.wallet_address) {
      return NextResponse.json({ wallet_address: null, balance: 0, onramp_url: null })
    }
    const balance = await getUSDCBalance(wallet.wallet_address)
    return NextResponse.json({
      wallet_address: wallet.wallet_address,
      wallet_id: wallet.wallet_id,
      balance,
      onramp_url: getOnrampUrl(wallet.wallet_address, 20),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
