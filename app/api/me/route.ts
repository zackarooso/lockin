import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getUserById, getBetsForUser, getLedgerForUser } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = getUserById(session.userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const bets = getBetsForUser(session.userId)
  const ledger = getLedgerForUser(session.userId)

  return NextResponse.json({ user, bets, ledger })
}
