import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBetById, getVotes, updateBetStatus, settleBet, initDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bet_id, action } = await req.json()
    if (!bet_id || !action) {
      return NextResponse.json({ error: 'Missing bet_id or action' }, { status: 400 })
    }

    const bet = await getBetById(Number(bet_id))
    if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })

    if (Number(bet.creator_user_id) !== Number(session.userId)) {
      return NextResponse.json({ error: 'Only the creator can close this bet' }, { status: 403 })
    }

    if (action === 'force_voting') {
      if (bet.status !== 'open' && bet.status !== 'active') {
        return NextResponse.json({ error: 'Bet is not open or active' }, { status: 400 })
      }
      await updateBetStatus(Number(bet_id), 'voting')
      return NextResponse.json({ success: true, status: 'voting' })
    }

    if (action === 'finalize') {
      if (bet.status !== 'voting') {
        return NextResponse.json({ error: 'Bet must be in voting status to finalize' }, { status: 400 })
      }
      const votes = await getVotes(Number(bet_id))
      if (!votes || votes.length === 0) {
        return NextResponse.json({ error: 'No votes cast yet. Cannot finalize.' }, { status: 400 })
      }
      await settleBet(Number(bet_id), bet.participants || [], votes)
      return NextResponse.json({ success: true })
    }

    if (action === 'nullify') {
      await updateBetStatus(Number(bet_id), 'nullified', { nullified_reason: 'Closed by creator' })
      return NextResponse.json({ success: true, status: 'nullified' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
