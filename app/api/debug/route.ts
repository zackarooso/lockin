import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { createWallet } from '@/lib/privy'

export async function GET(req: NextRequest) {
  const results: any = {}
  
  // Check env vars
  results.hasPrivyId = !!process.env.PRIVY_APP_ID
  results.hasPrivySecret = !!process.env.PRIVY_APP_SECRET
  results.privyIdPrefix = (process.env.PRIVY_APP_ID || '').slice(0, 8)
  
  // Test DB columns
  try {
    await initDb()
    results.initDb = 'ok'
  } catch(e: any) { results.initDb = 'error: ' + e.message }

  // Test wallet creation
  try {
    const wallet = await createWallet()
    results.wallet = wallet
  } catch(e: any) { results.walletError = e.message }

  return NextResponse.json(results)
}
