import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getUserById, getBetsForUser, getLedgerForUser, initDb } from '@/lib/db'
export async function GET(req: NextRequest) {
  try {
    await initDb()
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const [user, bets, ledger] = await Promise.all([getUserById(session.userId), getBetsForUser(session.userId), getLedgerForUser(session.userId)])
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user, bets, ledger })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}