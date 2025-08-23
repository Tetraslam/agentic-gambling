import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';
    const order = searchParams.get('order') || 'volume24hr';
    const ascending = searchParams.get('ascending') || 'false';
    const category = searchParams.get('category');

    const params: any = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      active: true,
      closed: false,
      order,
      ascending: ascending === 'true',
    };

    // Add category filter if provided
    if (category) {
      params.category = category;
    }

    const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      params,
    });

    const markets = response.data?.data || response.data || [];
    
    return NextResponse.json({ 
      success: true, 
      data: markets,
      count: markets.length 
    });

  } catch (error) {
    console.error('Polymarket API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch markets',
        data: [] 
      },
      { status: 500 }
    );
  }
}
