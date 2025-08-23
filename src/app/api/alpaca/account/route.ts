import { NextResponse } from 'next/server';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY!;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY!;
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';

const alpacaHeaders = {
  'APCA-API-KEY-ID': ALPACA_API_KEY,
  'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  'Content-Type': 'application/json',
};

export async function GET() {
  try {
    const response = await fetch(`${ALPACA_BASE_URL}/v2/account`, {
      headers: alpacaHeaders,
    });
    
    if (!response.ok) {
      console.error('Alpaca API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch account data' }, { status: response.status });
    }
    
    const account = await response.json();
    console.log('Raw Alpaca account:', account); // Debug log
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Account API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
