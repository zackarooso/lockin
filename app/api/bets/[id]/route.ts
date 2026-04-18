import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBetById, getVotes, getProofs, initDb } from '@/lib/db'
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const bet = await getBetById(parseInt(params.id))
    if (!bet) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const [votes, proofs] = await Promise.all([getVotes(bet.id), getProofs(bet.id)])
    return NextResponse.json({ bet, votes, proofs, currentUserId: session.userId })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}