import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

let _initialized = false

export async function initDb() {
  if (_initialized) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, phone TEXT UNIQUE NOT NULL,
      display_name TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bets (
      id SERIAL PRIMARY KEY, creator_user_id INT, subject_user_id INT,
      about_self BOOLEAN DEFAULT true, creator_side TEXT DEFAULT 'yes',
      text TEXT NOT NULL, stake_amount NUMERIC DEFAULT 0,
      join_deadline TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ NOT NULL,
      proof_photo BOOLEAN DEFAULT false, proof_video BOOLEAN DEFAULT false,
      proof_geolocation BOOLEAN DEFAULT false, status TEXT DEFAULT 'open',
      winning_side TEXT, nullified_reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bet_participants (
      id SERIAL PRIMARY KEY, bet_id INT, user_id INT,
      side TEXT NOT NULL, amount NUMERIC DEFAULT 0,
      joined_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(bet_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS proof_submissions (
      id SERIAL PRIMARY KEY, bet_id INT, user_id INT,
      photo_url TEXT, video_url TEXT, latitude NUMERIC, longitude NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY, bet_id INT, voter_user_id INT,
      vote TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(bet_id, voter_user_id)
    );
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id SERIAL PRIMARY KEY, bet_id INT, user_id INT,
      type TEXT NOT NULL, amount NUMERIC DEFAULT 0,
      settled_irl BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  _initialized = true
}

async function q(sql: string, args: any[] = []) {
  const r = await pool.query(sql, args)
  return r.rows
}

export async function findOrCreateUser(phone: string, displayName?: string | null) {
  const rows = await q('SELECT * FROM users WHERE phone = $1', [phone])
  if (rows[0]) return rows[0]
  const r = await q('INSERT INTO users (phone, display_name) VALUES ($1, $2) RETURNING *', [phone, displayName || null])
  return r[0]
}

export async function getUserById(id: number) {
  const r = await q('SELECT * FROM users WHERE id = $1', [id])
  return r[0] || null
}

export async function updateUserName(id: number, displayName: string) {
  await pool.query('UPDATE users SET display_name = $1 WHERE id = $2', [displayName, id])
}

async function getBetWithRelations(bet: any) {
  if (!bet) return null
  const [creator, subject, participants] = await Promise.all([
    q('SELECT * FROM users WHERE id = $1', [bet.creator_user_id]),
    q('SELECT * FROM users WHERE id = $1', [bet.subject_user_id]),
    q('SELECT bp.*, u.display_name, u.phone FROM bet_participants bp JOIN users u ON u.id = bp.user_id WHERE bp.bet_id = $1', [bet.id])
  ])
  return { ...bet, creator: creator[0], subject: subject[0], participants }
}

export async function createBet(data: any) {
  const r = await q(
    'INSERT INTO bets (creator_user_id,subject_user_id,about_self,creator_side,text,stake_amount,join_deadline,end_time,proof_photo,proof_video,proof_geolocation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
    [data.creator_user_id, data.subject_user_id, data.about_self, data.creator_side, data.text, data.stake_amount, data.join_deadline, data.end_time, data.proof_photo, data.proof_video, data.proof_geolocation]
  )
  return getBetWithRelations(r[0])
}

export async function getBetById(id: number) {
  const r = await q('SELECT * FROM bets WHERE id = $1', [id])
  return getBetWithRelations(r[0])
}

export async function getBetsForUser(userId: number) {
  const bets = await q(
    'SELECT DISTINCT b.* FROM bets b LEFT JOIN bet_participants bp ON bp.bet_id = b.id WHERE b.creator_user_id = $1 OR b.subject_user_id = $1 OR bp.user_id = $1 ORDER BY b.created_at DESC LIMIT 50',
    [userId]
  )
  return Promise.all(bets.map(getBetWithRelations))
}

export async function addParticipant(betId: number, userId: number, side: string, amount: number) {
  try {
    const r = await pool.query('INSERT INTO bet_participants (bet_id,user_id,side,amount) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [betId, userId, side, amount])
    return { changes: r.rowCount || 0 }
  } catch { return { changes: 0 } }
}

export async function updateBetStatus(id: number, status: string, extra: any = {}) {
  if (extra.winning_side) await pool.query('UPDATE bets SET status=$1,winning_side=$2 WHERE id=$3', [status, extra.winning_side, id])
  else if (extra.nullified_reason) await pool.query('UPDATE bets SET status=$1,nullified_reason=$2 WHERE id=$3', [status, extra.nullified_reason, id])
  else await pool.query('UPDATE bets SET status=$1 WHERE id=$2', [status, id])
}

export async function castVote(betId: number, voterId: number, vote: string) {
  try { await pool.query('INSERT INTO votes (bet_id,voter_user_id,vote) VALUES ($1,$2,$3)', [betId, voterId, vote]); return true } catch { return false }
}

export async function getVotes(betId: number) { return q('SELECT * FROM votes WHERE bet_id=$1', [betId]) }
export async function hasVoted(betId: number, userId: number) {
  const r = await q('SELECT id FROM votes WHERE bet_id=$1 AND voter_user_id=$2', [betId, userId])
  return r.length > 0
}

export async function addLedgerEntry(betId: number, userId: number, type: string, amount: number) {
  await pool.query('INSERT INTO ledger_entries (bet_id,user_id,type,amount) VALUES ($1,$2,$3,$4)', [betId, userId, type, amount])
}

export async function getLedgerForUser(userId: number) {
  return q('SELECT le.*, b.text as bet_text FROM ledger_entries le JOIN bets b ON b.id=le.bet_id WHERE le.user_id=$1 ORDER BY le.created_at DESC', [userId])
}

export async function markSettled(entryId: number, userId: number) {
  await pool.query('UPDATE ledger_entries SET settled_irl=true WHERE id=$1 AND user_id=$2', [entryId, userId])
}

export async function getProofs(betId: number) { return q('SELECT * FROM proof_submissions WHERE bet_id=$1', [betId]) }

export async function settleBet(betId: number, participants: any[], votes: any[]) {
  const yes = votes.filter(v => v.vote === 'yes').length
  const no = votes.filter(v => v.vote === 'no').length
  const nullify = votes.filter(v => v.vote === 'nullify').length
  if ((nullify > yes && nullify > no) || (yes === no && yes > 0)) {
    await updateBetStatus(betId, 'nullified', { nullified_reason: yes === no ? 'Tied vote' : 'Majority nullify' })
    await Promise.all(participants.map(p => addLedgerEntry(betId, p.user_id, 'nullify', 0)))
    return
  }
  const winningSide = yes > no ? 'yes' : 'no'
  await updateBetStatus(betId, 'settled', { winning_side: winningSide })
  const winners = participants.filter(p => p.side === winningSide)
  const losers = participants.filter(p => p.side !== winningSide)
  const loserPool = losers.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const winnerPool = winners.reduce((s: number, p: any) => s + Number(p.amount), 0)
  await Promise.all([
    ...winners.map(w => addLedgerEntry(betId, w.user_id, 'win', winnerPool > 0 ? (w.amount / winnerPool) * loserPool : 0)),
    ...losers.map(l => addLedgerEntry(betId, l.user_id, 'loss', l.amount))
  ])
}