import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      params: {
        limit: parseInt(limit),
        active: true,
        closed: false,
        order: 'featured',
        ascending: false,
      },
    });

    const markets = response.data?.data || response.data || [];
    
    return NextResponse.json({ 
      success: true, 
      data: markets,
      count: markets.length 
    });

  } catch (error) {
    console.error('Polymarket featured API error:', error);
    
    // Fallback to regular markets sorted by volume
    try {
      const fallbackResponse = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
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
        },
      });

      const fallbackMarkets = fallbackResponse.data?.data || fallbackResponse.data || [];
      
      return NextResponse.json({ 
        success: true, 
        data: fallbackMarkets,
        count: fallbackMarkets.length,
        fallback: true 
      });

    } catch (fallbackError) {
      console.error('Polymarket fallback API error:', fallbackError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch featured markets',
          data: [] 
        },
        { status: 500 }
      );
    }
  }
}
