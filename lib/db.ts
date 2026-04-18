import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DB_PATH || './data/lockin.db'
const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      phone       TEXT UNIQUE NOT NULL,
      display_name TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bets (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_user_id   INTEGER REFERENCES users(id),
      subject_user_id   INTEGER REFERENCES users(id),
      about_self        INTEGER DEFAULT 1,
      creator_side      TEXT DEFAULT 'yes',
      text              TEXT NOT NULL,
      stake_amount      REAL DEFAULT 0,
      join_deadline     TEXT NOT NULL,
      end_time          TEXT NOT NULL,
      proof_photo       INTEGER DEFAULT 0,
      proof_video       INTEGER DEFAULT 0,
      proof_geolocation INTEGER DEFAULT 0,
      status            TEXT DEFAULT 'open',
      winning_side      TEXT,
      nullified_reason  TEXT,
      created_at        TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bet_participants (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      bet_id    INTEGER REFERENCES bets(id),
      user_id   INTEGER REFERENCES users(id),
      side      TEXT NOT NULL,
      amount    REAL DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bet_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS proof_submissions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      bet_id     INTEGER REFERENCES bets(id),
      user_id    INTEGER REFERENCES users(id),
      photo_url  TEXT,
      video_url  TEXT,
      latitude   REAL,
      longitude  REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS votes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      bet_id        INTEGER REFERENCES bets(id),
      voter_user_id INTEGER REFERENCES users(id),
      vote          TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      UNIQUE(bet_id, voter_user_id)
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      bet_id      INTEGER REFERENCES bets(id),
      user_id     INTEGER REFERENCES users(id),
      type        TEXT NOT NULL,
      amount      REAL DEFAULT 0,
      settled_irl INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `)
}

// ── USER ──────────────────────────────────────────────
export function findOrCreateUser(phone: string, displayName?: string) {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
  if (existing) return existing
  const result = db.prepare('INSERT INTO users (phone, display_name) VALUES (?, ?)').run(phone, displayName || null)
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any
}

export function getUserById(id: number) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as any
}

export function updateUserName(id: number, displayName: string) {
  getDb().prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, id)
}

// ── BETS ──────────────────────────────────────────────
export function createBet(data: any) {
  const db = getDb()
  const r = db.prepare(`
    INSERT INTO bets (creator_user_id, subject_user_id, about_self, creator_side, text,
      stake_amount, join_deadline, end_time, proof_photo, proof_video, proof_geolocation)
    VALUES (@creator_user_id, @subject_user_id, @about_self, @creator_side, @text,
      @stake_amount, @join_deadline, @end_time, @proof_photo, @proof_video, @proof_geolocation)
  `).run(data)
  return getBetById(Number(r.lastInsertRowid))
}

export function getBetById(id: number) {
  const db = getDb()
  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(id) as any
  if (!bet) return null
  bet.creator = db.prepare('SELECT * FROM users WHERE id = ?').get(bet.creator_user_id)
  bet.subject = db.prepare('SELECT * FROM users WHERE id = ?').get(bet.subject_user_id)
  bet.participants = db.prepare(`
    SELECT bp.*, u.display_name, u.phone FROM bet_participants bp
    JOIN users u ON u.id = bp.user_id WHERE bp.bet_id = ?
  `).all(id)
  return bet
}

export function getBetsForUser(userId: number) {
  const db = getDb()
  const bets = db.prepare(`
    SELECT DISTINCT b.* FROM bets b
    LEFT JOIN bet_participants bp ON bp.bet_id = b.id
    WHERE b.creator_user_id = ? OR b.subject_user_id = ? OR bp.user_id = ?
    ORDER BY b.created_at DESC LIMIT 50
  `).all(userId, userId, userId) as any[]

  return bets.map(b => {
    b.creator = db.prepare('SELECT * FROM users WHERE id = ?').get(b.creator_user_id)
    b.subject = db.prepare('SELECT * FROM users WHERE id = ?').get(b.subject_user_id)
    b.participants = db.prepare(`
      SELECT bp.*, u.display_name, u.phone FROM bet_participants bp
      JOIN users u ON u.id = bp.user_id WHERE bp.bet_id = ?
    `).all(b.id)
    return b
  })
}

export function addParticipant(betId: number, userId: number, side: string, amount: number) {
  return getDb().prepare(
    'INSERT OR IGNORE INTO bet_participants (bet_id, user_id, side, amount) VALUES (?, ?, ?, ?)'
  ).run(betId, userId, side, amount)
}

export function updateBetStatus(id: number, status: string, extra: any = {}) {
  const db = getDb()
  if (extra.winning_side) {
    db.prepare('UPDATE bets SET status = ?, winning_side = ? WHERE id = ?').run(status, extra.winning_side, id)
  } else if (extra.nullified_reason) {
    db.prepare('UPDATE bets SET status = ?, nullified_reason = ? WHERE id = ?').run(status, extra.nullified_reason, id)
  } else {
    db.prepare('UPDATE bets SET status = ? WHERE id = ?').run(status, id)
  }
}

// ── VOTES ─────────────────────────────────────────────
export function castVote(betId: number, voterId: number, vote: string) {
  try {
    getDb().prepare('INSERT INTO votes (bet_id, voter_user_id, vote) VALUES (?, ?, ?)').run(betId, voterId, vote)
    return true
  } catch { return false }
}

export function getVotes(betId: number) {
  return getDb().prepare('SELECT * FROM votes WHERE bet_id = ?').all(betId) as any[]
}

export function hasVoted(betId: number, userId: number) {
  return !!getDb().prepare('SELECT id FROM votes WHERE bet_id = ? AND voter_user_id = ?').get(betId, userId)
}

// ── LEDGER ────────────────────────────────────────────
export function addLedgerEntry(betId: number, userId: number, type: string, amount: number) {
  getDb().prepare(
    'INSERT INTO ledger_entries (bet_id, user_id, type, amount) VALUES (?, ?, ?, ?)'
  ).run(betId, userId, type, amount)
}

export function getLedgerForUser(userId: number) {
  return getDb().prepare(`
    SELECT le.*, b.text as bet_text FROM ledger_entries le
    JOIN bets b ON b.id = le.bet_id
    WHERE le.user_id = ? ORDER BY le.created_at DESC
  `).all(userId) as any[]
}

export function markSettled(entryId: number, userId: number) {
  getDb().prepare('UPDATE ledger_entries SET settled_irl = 1 WHERE id = ? AND user_id = ?').run(entryId, userId)
}

// ── PROOF ─────────────────────────────────────────────
export function addProof(data: any) {
  getDb().prepare(`
    INSERT INTO proof_submissions (bet_id, user_id, photo_url, video_url, latitude, longitude)
    VALUES (@bet_id, @user_id, @photo_url, @video_url, @latitude, @longitude)
  `).run(data)
}

export function getProofs(betId: number) {
  return getDb().prepare('SELECT * FROM proof_submissions WHERE bet_id = ?').all(betId) as any[]
}

// ── SETTLEMENT ────────────────────────────────────────
export function settleBet(betId: number, participants: any[], votes: any[]) {
  const yes = votes.filter(v => v.vote === 'yes').length
  const no = votes.filter(v => v.vote === 'no').length
  const nullify = votes.filter(v => v.vote === 'nullify').length

  if (nullify > yes && nullify > no || (yes === no && yes > 0)) {
    updateBetStatus(betId, 'nullified', { nullified_reason: yes === no ? 'Tied vote' : 'Majority nullify' })
    for (const p of participants) addLedgerEntry(betId, p.user_id, 'nullify', 0)
    return
  }

  const winningSide = yes > no ? 'yes' : 'no'
  const losingSide = winningSide === 'yes' ? 'no' : 'yes'
  updateBetStatus(betId, 'settled', { winning_side: winningSide })

  const winners = participants.filter(p => p.side === winningSide)
  const losers = participants.filter(p => p.side === losingSide)
  const loserPool = losers.reduce((s: number, p: any) => s + p.amount, 0)
  const winnerPool = winners.reduce((s: number, p: any) => s + p.amount, 0)

  for (const w of winners) {
    const share = winnerPool > 0 ? (w.amount / winnerPool) * loserPool : 0
    addLedgerEntry(betId, w.user_id, 'win', share)
  }
  for (const l of losers) {
    addLedgerEntry(betId, l.user_id, 'loss', l.amount)
  }
}
