import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBetById, castVote, getVotes, updateBetStatus, settleBet, hasVoted, initDb } from '@/lib/db'
export async function POST(req: NextRequest) {
  try {
    await initDb()
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { bet_id, vote } = await req.json()
    const bet = await getBetById(bet_id)
    if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    if (bet.subject_user_id === session.userId) return NextResponse.json({ error: 'Subject cannot vote' }, { status: 400 })
    if (await hasVoted(bet_id, session.userId)) return NextResponse.json({ error: 'Already voted' }, { status: 400 })
    await castVote(bet_id, session.userId, vote)
    if (bet.status !== 'voting') await updateBetStatus(bet_id, 'voting')
    const votes = await getVotes(bet_id)
    const eligible = (bet.participants || []).filter((p: any) => p.user_id !== bet.subject_user_id)
    if (votes.length >= eligible.length && eligible.length > 0) await settleBet(bet_id, bet.participants || [], votes)
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}