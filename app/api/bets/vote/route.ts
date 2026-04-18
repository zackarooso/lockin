import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBetById, castVote, getVotes, updateBetStatus, settleBet, hasVoted } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bet_id, vote } = await req.json()
    const bet = getBetById(bet_id)
    if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    if (bet.subject_user_id === session.userId) return NextResponse.json({ error: "Subject can't vote on their own bet" }, { status: 400 })
    if (hasVoted(bet_id, session.userId)) return NextResponse.json({ error: 'Already voted' }, { status: 400 })

    castVote(bet_id, session.userId, vote)
    if (bet.status !== 'voting') updateBetStatus(bet_id, 'voting')

    // Check if all eligible voters have voted
    const votes = getVotes(bet_id)
    const eligible = (bet.participants || []).filter((p: any) => p.user_id !== bet.subject_user_id)
    if (votes.length >= eligible.length && eligible.length > 0) {
      settleBet(bet_id, bet.participants || [], votes)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
