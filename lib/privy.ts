const PRIVY_APP_ID = process.env.PRIVY_APP_ID || ''
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || ''

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
    console.error('Privy: missing PRIVY_APP_ID or PRIVY_APP_SECRET env vars')
    return null
  }
  try {
    const res = await fetch('https://api.privy.io/v1/wallets', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ chain_type: 'ethereum' }),
    })
    const text = await res.text()
    console.log('Privy createWallet response:', res.status, text)
    if (!res.ok) return null
    const data = JSON.parse(text)
    return { id: data.id, address: data.address }
  } catch (e: any) {
    console.error('Privy createWallet error:', e.message)
    return null
  }
}

export function getOnrampUrl(walletAddress: string, amount?: number): string {
  const params = new URLSearchParams({
    walletAddress,
    defaultCurrencyCode: 'usdc_base',
    colorCode: '%23FF1F6B',
  })
  if (amount) params.set('defaultBaseCurrencyAmount', String(amount))
  return 'https://buy.moonpay.com?' + params.toString()
}

export async function sendUSDC(
  walletId: string,
  to: string,
  amount: number,
  chainId: string = 'eip155:8453'
): Promise<{ hash: string } | null> {
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
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
        caip2: chainId,
        params: { transaction: { to: USDC_ADDRESS, data, value: '0x0' } }
      }),
    })
    if (!res.ok) { console.error('Privy USDC error:', res.status, await res.text()); return null }
    const result = await res.json()
    return { hash: result.data?.hash || result.hash }
  } catch (e: any) { console.error('Privy USDC failed:', e.message); return null }
}
