import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') || '20';

    if (!query || query.trim() === '') {
      return NextResponse.json({ 
        success: true, 
        data: [],
        count: 0 
      });
    }

    const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      params: {
        limit: parseInt(limit),
        active: true,
        closed: false,
        order: 'volume24hr',
        ascending: false,
        query: query.trim(),
      },
    });

    const markets = response.data?.data || response.data || [];
    
    return NextResponse.json({ 
      success: true, 
      data: markets,
      count: markets.length,
      query 
    });

  } catch (error) {
    console.error('Polymarket search API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search markets',
        data: [] 
      },
      { status: 500 }
    );
  }
}
