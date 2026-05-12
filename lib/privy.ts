// Privy server-side wallet helper
// Uses REST API - no frontend SDK needed

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || ''
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || ''

function authHeader() {
  const encoded = Buffer.from(PRIVY_APP_ID + ':' + PRIVY_APP_SECRET).toString('base64')
  return {
    'Authorization': 'Basic ' + encoded,
    'privy-app-id': PRIVY_APP_ID,
    'Content-Type': 'application/json',
  }
}

export async function createWallet(): Promise<{ id: string; address: string } | null> {
  try {
    const res = await fetch('https://api.privy.io/v1/wallets', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ chain_type: 'ethereum' }),
    })
    if (!res.ok) {
      console.error('Privy create wallet error:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return { id: data.id, address: data.address }
  } catch (e: any) {
    console.error('Privy create wallet failed:', e.message)
    return null
  }
}

export async function getWalletBalance(walletId: string, chainId: string = 'eip155:8453'): Promise<string> {
  try {
    // Use eth_getBalance RPC call via Privy
    const res = await fetch('https://api.privy.io/v1/wallets/' + walletId + '/rpc', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        method: 'eth_getBalance',
        caip2: chainId,
        params: { address: '' } // Privy uses wallet's own address
      }),
    })
    if (!res.ok) return '0'
    const data = await res.json()
    return data.data?.balance || '0'
  } catch { return '0' }
}

export async function sendTransaction(
  walletId: string,
  to: string,
  value: string, // in wei
  chainId: string = 'eip155:8453' // Base mainnet
): Promise<{ hash: string } | null> {
  try {
    const res = await fetch('https://api.privy.io/v1/wallets/' + walletId + '/rpc', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        caip2: chainId,
        params: {
          transaction: { to, value }
        }
      }),
    })
    if (!res.ok) {
      console.error('Privy send tx error:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return { hash: data.data?.hash || data.hash }
  } catch (e: any) {
    console.error('Privy send tx failed:', e.message)
    return null
  }
}

// Send USDC (ERC-20 transfer) on Base
// USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
export async function sendUSDC(
  walletId: string,
  to: string,
  amount: number, // in dollars (e.g. 5 = $5 USDC)
  chainId: string = 'eip155:8453'
): Promise<{ hash: string } | null> {
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  const USDC_DECIMALS = 6
  const rawAmount = BigInt(Math.round(amount * (10 ** USDC_DECIMALS)))
  
  // ERC-20 transfer(address,uint256) function selector
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
        params: {
          transaction: { to: USDC_ADDRESS, data, value: '0x0' }
        }
      }),
    })
    if (!res.ok) {
      console.error('Privy USDC transfer error:', res.status, await res.text())
      return null
    }
    const result = await res.json()
    return { hash: result.data?.hash || result.hash }
  } catch (e: any) {
    console.error('Privy USDC transfer failed:', e.message)
    return null
  }
}

export function getOnrampUrl(walletAddress: string, amount?: number): string {
  // Privy integrates with MoonPay for onramp
  // This generates a URL that opens MoonPay with the user's wallet pre-filled
  const params = new URLSearchParams({
    walletAddress,
    defaultCurrencyCode: 'usdc_base',
    colorCode: '%23FF1F6B',
  })
  if (amount) params.set('defaultBaseCurrencyAmount', String(amount))
  return 'https://buy.moonpay.com?' + params.toString()
}
