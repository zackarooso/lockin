import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBetById, getVotes, getProofs } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bet = getBetById(parseInt(params.id))
  if (!bet) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const votes = getVotes(bet.id)
  const proofs = getProofs(bet.id)

  return NextResponse.json({ bet, votes, proofs, currentUserId: session.userId })
}
