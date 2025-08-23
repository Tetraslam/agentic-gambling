import { NextRequest, NextResponse } from 'next/server';
import { autumnApi } from '@/lib/apis/autumn';

export async function POST(req: NextRequest) {
  try {
    const { userId = 'user' } = await req.json();

    // Check if user already exists
    const existingCustomer = await autumnApi.getCustomerByUserId(userId);
    if (existingCustomer) {
      return NextResponse.json({ 
        success: true, 
        message: 'User already initialized',
        customer: existingCustomer 
      });
    }

    // Initialize new user with degen plan
    const result = await autumnApi.initializeUser(userId);
    
    return NextResponse.json({ 
      success: true,
      message: 'User initialized successfully',
      ...result
    });

  } catch (error) {
    console.error('Failed to initialize user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize user' },
      { status: 500 }
    );
  }
}
