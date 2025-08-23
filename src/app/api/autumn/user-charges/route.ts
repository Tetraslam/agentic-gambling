import { NextRequest, NextResponse } from 'next/server';
import { autumnApi } from '@/lib/apis/autumn';

export async function POST(req: NextRequest) {
  try {
    const { userId = 'user' } = await req.json();

    // Get all charges for this user
    const charges = await autumnApi.getUserCharges(userId);
    
    // Calculate totals
    const totalCharges = charges.reduce((sum, charge) => sum + (charge.amount / 100), 0); // Convert from cents
    const totalProfitShared = charges.reduce((sum, charge) => {
      const originalProfit = charge.metadata?.originalProfit || 0;
      return sum + originalProfit;
    }, 0);

    return NextResponse.json({ 
      success: true,
      charges,
      totalCharges,
      totalProfitShared,
      chargeCount: charges.length
    });

  } catch (error) {
    console.error('Failed to get user charges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user charges' },
      { status: 500 }
    );
  }
}
