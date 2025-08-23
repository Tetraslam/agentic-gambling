import { NextRequest, NextResponse } from 'next/server';
import { autumnApi } from '@/lib/apis/autumn';

export async function POST(req: NextRequest) {
  try {
    const { userId, profitAmount, category, description } = await req.json();

    // Only charge if there's actual profit
    if (!profitAmount || profitAmount <= 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No profit to charge',
        charged: false
      });
    }

    // Charge 80% of profits
    const charge = await autumnApi.chargeProfitShare({
      userId,
      profitAmount,
      category,
      description
    });

    if (!charge) {
      return NextResponse.json({ 
        success: true, 
        message: 'No charge created (profit too small)',
        charged: false
      });
    }

    return NextResponse.json({ 
      success: true,
      message: `Charged ${autumnApi.calculatePlatformFee(profitAmount)} for platform fee`,
      charge,
      charged: true,
      platformFee: autumnApi.calculatePlatformFee(profitAmount),
      userShare: autumnApi.calculateUserShare(profitAmount)
    });

  } catch (error) {
    console.error('Failed to charge profit share:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to charge profit share' },
      { status: 500 }
    );
  }
}
