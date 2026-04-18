import { createClient } from '@libsql/client'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DB_PATH || './data/lockin.db'
const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = createClient({ url: 'file:' + DB_PATH })

async function init() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT UNIQUE NOT NULL, display_name TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS bets (id INTEGER PRIMARY KEY AUTOINCREMENT, creator_user_id INTEGER, subject_user_id INTEGER, about_self INTEGER DEFAULT 1, creator_side TEXT DEFAULT 'yes', text TEXT NOT NULL, stake_amount REAL DEFAULT 0, join_deadline TEXT NOT NULL, end_time TEXT NOT NULL, proof_photo INTEGER DEFAULT 0, proof_video INTEGER DEFAULT 0, proof_geolocation INTEGER DEFAULT 0, status TEXT DEFAULT 'open', winning_side TEXT, nullified_reason TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS bet_participants (id INTEGER PRIMARY KEY AUTOINCREMENT, bet_id INTEGER, user_id INTEGER, side TEXT NOT NULL, amount REAL DEFAULT 0, joined_at TEXT DEFAULT (datetime('now')), UNIQUE(bet_id, user_id));
    CREATE TABLE IF NOT EXISTS proof_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, bet_id INTEGER, user_id INTEGER, photo_url TEXT, video_url TEXT, latitude REAL, longitude REAL, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, bet_id INTEGER, voter_user_id INTEGER, vote TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(bet_id, voter_user_id));
    CREATE TABLE IF NOT EXISTS ledger_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, bet_id INTEGER, user_id INTEGER, type TEXT NOT NULL, amount REAL DEFAULT 0, settled_irl INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
  `)
}

const initPromise = init()

async function q(sql: string, args: any[] = []) {
  await initPromise
  const r = await db.execute({ sql, args })
  return r.rows as any[]
}

async function run(sql: string, args: any[] = []) {
  await initPromise
  const r = await db.execute({ sql, args })
  return { lastInsertRowid: r.lastInsertRowid, changes: r.rowsAffected }
}

export async function findOrCreateUser(phone: string, displayName?: string) {
  const rows = await q('SELECT * FROM users WHERE phone = ?', [phone])
  if (rows[0]) return rows[0]
  const r = await run('INSERT INTO users (phone, display_name) VALUES (?, ?)', [phone, displayName || null])
  const u = await q('SELECT * FROM users WHERE id = ?', [Number(r.lastInsertRowid)])
  return u[0]
}

export async function getUserById(id: number) {
  const rows = await q('SELECT * FROM users WHERE id = ?', [id])
  return rows[0] || null
}

export async function updateUserName(id: number, displayName: string) {
  await run('UPDATE users SET display_name = ? WHERE id = ?', [displayName, id])
}

export async function createBet(data: any) {
  const r = await run(
    'INSERT INTO bets (creator_user_id, subject_user_id, about_self, creator_side, text, stake_amount, join_deadline, end_time, proof_photo, proof_video, proof_geolocation) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [data.creator_user_id, data.subject_user_id, data.about_self, data.creator_side, data.text, data.stake_amount, data.join_deadline, data.end_time, data.proof_photo, data.proof_video, data.proof_geolocation]
  )
  return getBetById(Number(r.lastInsertRowid))
}

export async function getBetById(id: number) {
  const rows = await q('SELECT * FROM bets WHERE id = ?', [id])
  if (!rows[0]) return null
  const bet = rows[0]
  const [creator, subject, participants] = await Promise.all([
    q('SELECT * FROM users WHERE id = ?', [bet.creator_user_id]),
    q('SELECT * FROM users WHERE id = ?', [bet.subject_user_id]),
    q('SELECT bp.*, u.display_name, u.phone FROM bet_participants bp JOIN users u ON u.id = bp.user_id WHERE bp.bet_id = ?', [id])
  ])
  bet.creator = creator[0]
  bet.subject = subject[0]
  bet.participants = participants
  return bet
}

export async function getBetsForUser(userId: number) {
  const bets = await q(
    'SELECT DISTINCT b.* FROM bets b LEFT JOIN bet_participants bp ON bp.bet_id = b.id WHERE b.creator_user_id = ? OR b.subject_user_id = ? OR bp.user_id = ? ORDER BY b.created_at DESC LIMIT 50',
    [userId, userId, userId]
  )
  return Promise.all(bets.map(async b => {
    const [creator, subject, participants] = await Promise.all([
      q('SELECT * FROM users WHERE id = ?', [b.creator_user_id]),
      q('SELECT * FROM users WHERE id = ?', [b.subject_user_id]),
      q('SELECT bp.*, u.display_name, u.phone FROM bet_participants bp JOIN users u ON u.id = bp.user_id WHERE bp.bet_id = ?', [b.id])
    ])
    b.creator = creator[0]; b.subject = subject[0]; b.participants = participants
    return b
  }))
}

export async function addParticipant(betId: number, userId: number, side: string, amount: number) {
  try {
    const r = await run('INSERT INTO bet_participants (bet_id, user_id, side, amount) VALUES (?,?,?,?)', [betId, userId, side, amount])
    return r
  } catch { return { changes: 0 } }
}

export async function updateBetStatus(id: number, status: string, extra: any = {}) {
  if (extra.winning_side) await run('UPDATE bets SET status = ?, winning_side = ? WHERE id = ?', [status, extra.winning_side, id])
  else if (extra.nullified_reason) await run('UPDATE bets SET status = ?, nullified_reason = ? WHERE id = ?', [status, extra.nullified_reason, id])
  else await run('UPDATE bets SET status = ? WHERE id = ?', [status, id])
}

export async function castVote(betId: number, voterId: number, vote: string) {
  try { await run('INSERT INTO votes (bet_id, voter_user_id, vote) VALUES (?,?,?)', [betId, voterId, vote]); return true } catch { return false }
}

export async function getVotes(betId: number) { return q('SELECT * FROM votes WHERE bet_id = ?', [betId]) }
export async function hasVoted(betId: number, userId: number) { const r = await q('SELECT id FROM votes WHERE bet_id = ? AND voter_user_id = ?', [betId, userId]); return r.length > 0 }

export async function addLedgerEntry(betId: number, userId: number, type: string, amount: number) {
  await run('INSERT INTO ledger_entries (bet_id, user_id, type, amount) VALUES (?,?,?,?)', [betId, userId, type, amount])
}

export async function getLedgerForUser(userId: number) {
  return q('SELECT le.*, b.text as bet_text FROM ledger_entries le JOIN bets b ON b.id = le.bet_id WHERE le.user_id = ? ORDER BY le.created_at DESC', [userId])
}

export async function markSettled(entryId: number, userId: number) {
  await run('UPDATE ledger_entries SET settled_irl = 1 WHERE id = ? AND user_id = ?', [entryId, userId])
}

export async function getProofs(betId: number) { return q('SELECT * FROM proof_submissions WHERE bet_id = ?', [betId]) }

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
  const losingSide = winningSide === 'yes' ? 'no' : 'yes'
  await updateBetStatus(betId, 'settled', { winning_side: winningSide })
  const winners = participants.filter(p => p.side === winningSide)
  const losers = participants.filter(p => p.side === losingSide)
  const loserPool = losers.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const winnerPool = winners.reduce((s: number, p: any) => s + Number(p.amount), 0)
  await Promise.all([
    ...winners.map(w => addLedgerEntry(betId, w.user_id, 'win', winnerPool > 0 ? (w.amount / winnerPool) * loserPool : 0)),
    ...losers.map(l => addLedgerEntry(betId, l.user_id, 'loss', l.amount))
  ])
}