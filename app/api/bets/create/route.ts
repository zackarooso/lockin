import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { findOrCreateUser, createBet, addParticipant } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      about_self, friend_name, friend_phone,
      text, creator_side, stake_amount,
      join_deadline, end_time,
      proof_photo, proof_video, proof_geolocation,
    } = body

    if (!text?.trim()) return NextResponse.json({ error: 'Bet text required' }, { status: 400 })
    if (!stake_amount || stake_amount <= 0) return NextResponse.json({ error: 'Stake required' }, { status: 400 })

    let subject_user_id = session.userId

    if (!about_self && friend_phone) {
      const digits = friend_phone.replace(/\D/g, '')
      const e164 = `+1${digits.slice(-10)}`
      const friend = findOrCreateUser(e164, friend_name || null)
      subject_user_id = friend.id
    }

    const actualSide = about_self ? 'yes' : (creator_side || 'yes')

    const bet = createBet({
      creator_user_id: session.userId,
      subject_user_id,
      about_self: about_self ? 1 : 0,
      creator_side: actualSide,
      text: text.trim(),
      stake_amount: parseFloat(stake_amount),
      join_deadline,
      end_time,
      proof_photo: proof_photo ? 1 : 0,
      proof_video: proof_video ? 1 : 0,
      proof_geolocation: proof_geolocation ? 1 : 0,
    })

    addParticipant(bet.id, session.userId, actualSide, parseFloat(stake_amount))

    return NextResponse.json({ bet })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
