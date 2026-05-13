const PRIVY_APP_ID = process.env.PRIVY_APP_ID || ''
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || ''

// USDC on Base mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const BASE_CHAIN = 'eip155:8453'

function authHeader() {
  const credentials = PRIVY_APP_ID + ':' + PRIVY_APP_SECRET
  const encoded = Buffer.from(credentials).toString('base64')
  return {
    'Authorization': 'Basic ' + encoded,
    'privy-app-id': PRIVY_APP_ID,
    'Content-Type': 'application/json',
  }
}

export async function createWallet(): Promise<{ id: string; address: string } | null> {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    console.error('Privy: missing env vars')
    return null
  }
  try {
    const res = await fetch('https://api.privy.io/v1/wallets', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ chain_type: 'ethereum' }),
    })
    if (!res.ok) {
      console.error('Privy createWallet:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return { id: data.id, address: data.address }
  } catch (e: any) {
    console.error('Privy createWallet error:', e.message)
    return null
  }
}

// Get USDC balance for a wallet (returns balance in dollars, e.g. 5.25)
export async function getUSDCBalance(walletAddress: string): Promise<number> {
  if (!walletAddress) return 0
  try {
    // ERC-20 balanceOf(address) call
    const balanceOfSelector = '0x70a08231'
    const paddedAddr = walletAddress.slice(2).toLowerCase().padStart(64, '0')
    const callData = balanceOfSelector + paddedAddr

    // Use Base public RPC
    const res = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: USDC_ADDRESS, data: callData }, 'latest']
      })
    })
    const data = await res.json()
    if (!data.result || data.result === '0x') return 0
    // USDC has 6 decimals
    const raw = BigInt(data.result)
    return Number(raw) / 1000000
  } catch (e: any) {
    console.error('balance check error:', e.message)
    return 0
  }
}

export function getOnrampUrl(walletAddress: string, amount?: number): string {
  const params = new URLSearchParams({
    walletAddress,
    defaultCurrencyCode: 'usdc_base',
    colorCode: '#FF1F6B',
  })
  if (amount) params.set('defaultBaseCurrencyAmount', String(amount))
  return 'https://buy.moonpay.com?' + params.toString()
}

export async function sendUSDC(
  walletId: string,
  to: string,
  amount: number
): Promise<{ hash: string } | null> {
  const rawAmount = BigInt(Math.round(amount * 1000000))
  const transferSelector = '0xa9059cbb'
  const paddedTo = to.slice(2).padStart(64, '0')
  const paddedAmount = rawAmount.toString(16).padStart(64, '0')
  const data = transferSelector + paddedTo + paddedAmount

  try {
    const res = await fetch('https://api.privy.io/v1/wallets/' + walletId + '/rpc', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        caip2: BASE_CHAIN,
        params: { transaction: { to: USDC_ADDRESS, data, value: '0x0' } }
      }),
    })
    if (!res.ok) { console.error('USDC send:', res.status, await res.text()); return null }
    const result = await res.json()
    return { hash: result.data?.hash || result.hash }
  } catch (e: any) { console.error('USDC error:', e.message); return null }
}
