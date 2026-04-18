# 🔒 Lock In
> Put money on it. Let your friends judge you.

Flamingo energy. Ferrari money. Zero Supabase.

---

## Stack
- **Next.js 14** (App Router)
- **SQLite** via `better-sqlite3` — database lives at `./data/lockin.db`, zero external services
- **JWT** sessions in httpOnly cookies — 90-day expiry
- **Phone-only login** — type your number, you're in. No SMS, no OTP, no passwords.

---

## Run locally

```bash
unzip lockin.zip
cd lockin
npm install
npm run dev
```

Open http://localhost:3000 on your phone (or shrink browser to <600px wide).

---

## Deploy to Railway

1. **Push to GitHub**
```bash
git init && git add . && git commit -m "🔒 Lock In"
# create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/lockin.git
git push -u origin main
```

2. **Deploy**
- Go to [railway.app](https://railway.app)
- New Project → Deploy from GitHub → pick your repo
- Go to **Variables** tab → add:

```
JWT_SECRET=make-this-something-long-and-random-seriously
DB_PATH=/data/lockin.db
NODE_ENV=production
```

3. **Persist the database** (important!)
In Railway: go to your service → **Volumes** → Add Volume → mount at `/data`
This makes sure your SQLite file survives deploys.

4. Railway auto-detects Next.js and deploys. Live in ~2 min. ~$5/mo.

---

## That's it. No Twilio. No Supabase. No accounts needed.

---

## How it works

| Feature | How |
|---|---|
| Auth | Enter phone → you're in. Phone = identity. |
| Database | SQLite file at `/data/lockin.db` |
| Sessions | JWT in httpOnly cookie, 90 days |
| Friends | Enter their phone when creating a bet |
| Proof | Photo/video/geo capture (uploads coming) |
| Settlement | Vote → majority wins → ledger updated |
