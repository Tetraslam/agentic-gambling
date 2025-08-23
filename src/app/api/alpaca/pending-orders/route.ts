import { NextResponse } from 'next/server';
import { getPendingOrders } from '@/lib/apis/alpaca';

export async function GET() {
  try {
    const pendingOrders = await getPendingOrders();
    return NextResponse.json(pendingOrders);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending orders' },
      { status: 500 }
    );
  }
}
