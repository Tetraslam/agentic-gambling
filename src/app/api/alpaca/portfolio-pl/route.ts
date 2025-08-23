import { NextResponse } from 'next/server';
import { getPortfolioPL } from '@/lib/apis/alpaca';

export async function GET() {
  try {
    const portfolioPL = await getPortfolioPL();
    return NextResponse.json(portfolioPL);
  } catch (error) {
    console.error('Error fetching portfolio P&L:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio P&L' },
      { status: 500 }
    );
  }
}
