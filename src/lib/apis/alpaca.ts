// Alpaca API for paper trading
const ALPACA_API_KEY = process.env.ALPACA_API_KEY!;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY!;
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets'; // Paper trading endpoint

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPL: number;
  marketValue: number;
}

export interface Order {
  id: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  status: string;
  filled_at?: string;
  filled_price?: number;
}

export interface Account {
  cash: number;
  portfolio_value: number;
  buying_power: number;
  equity: number;
}

const alpacaHeaders = {
  'APCA-API-KEY-ID': ALPACA_API_KEY,
  'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
  'Content-Type': 'application/json',
};

export async function getAccount(): Promise<Account | null> {
  try {
    const response = await fetch(`${ALPACA_BASE_URL}/v2/account`, {
      headers: alpacaHeaders,
    });
    
    const data = await response.json();
    
    return {
      cash: parseFloat(data.cash),
      portfolio_value: parseFloat(data.portfolio_value),
      buying_power: parseFloat(data.buying_power),
      equity: parseFloat(data.equity),
    };
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}

export async function getPositions(): Promise<Position[]> {
  try {
    const response = await fetch(`${ALPACA_BASE_URL}/v2/positions`, {
      headers: alpacaHeaders,
    });
    
    const data = await response.json();
    
    return data.map((pos: any) => ({
      symbol: pos.symbol,
      quantity: parseInt(pos.qty),
      avgPrice: parseFloat(pos.avg_entry_price),
      currentPrice: parseFloat(pos.current_price),
      unrealizedPL: parseFloat(pos.unrealized_pl),
      marketValue: parseFloat(pos.market_value),
    }));
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

export async function placeOrder(
  symbol: string,
  qty: number,
  side: 'buy' | 'sell',
  type: 'market' | 'limit' = 'market',
  limitPrice?: number
): Promise<Order | null> {
  try {
    const orderData: any = {
      symbol,
      qty: qty.toString(),
      side,
      type,
      time_in_force: 'day',
    };
    
    if (type === 'limit' && limitPrice) {
      orderData.limit_price = limitPrice.toString();
    }
    
    const response = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
      method: 'POST',
      headers: alpacaHeaders,
      body: JSON.stringify(orderData),
    });
    
    const data = await response.json();
    
    return {
      id: data.id,
      symbol: data.symbol,
      qty: parseInt(data.qty),
      side: data.side,
      type: data.type,
      status: data.status,
      filled_at: data.filled_at,
      filled_price: data.filled_avg_price ? parseFloat(data.filled_avg_price) : undefined,
    };
  } catch (error) {
    console.error('Error placing order:', error);
    return null;
  }
}

export async function getOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${ALPACA_BASE_URL}/v2/orders?status=all&limit=50`, {
      headers: alpacaHeaders,
    });
    
    const data = await response.json();
    
    return data.map((order: any) => ({
      id: order.id,
      symbol: order.symbol,
      qty: parseInt(order.qty),
      side: order.side,
      type: order.type,
      status: order.status,
      filled_at: order.filled_at,
      filled_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Get only pending/open orders
export async function getPendingOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${ALPACA_BASE_URL}/v2/orders?status=open&limit=50`, {
      headers: alpacaHeaders,
    });
    
    const data = await response.json();
    
    return data.map((order: any) => ({
      id: order.id,
      symbol: order.symbol,
      qty: parseInt(order.qty),
      side: order.side,
      type: order.type,
      status: order.status,
      filled_at: order.filled_at,
      filled_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }
}

// Calculate total portfolio P&L from positions
export async function getPortfolioPL(): Promise<{
  totalUnrealizedPL: number;
  totalMarketValue: number;
  totalCostBasis: number;
}> {
  try {
    const positions = await getPositions();
    const totalUnrealizedPL = positions.reduce((sum, pos) => sum + pos.unrealizedPL, 0);
    const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const totalCostBasis = positions.reduce((sum, pos) => sum + (pos.quantity * pos.avgPrice), 0);
    
    return {
      totalUnrealizedPL,
      totalMarketValue,
      totalCostBasis,
    };
  } catch (error) {
    console.error('Error calculating portfolio P&L:', error);
    return {
      totalUnrealizedPL: 0,
      totalMarketValue: 0,
      totalCostBasis: 0,
    };
  }
}

export async function cancelOrder(orderId: string): Promise<boolean> {
  try {
    const response = await fetch(`${ALPACA_BASE_URL}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: alpacaHeaders,
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error cancelling order:', error);
    return false;
  }
}
