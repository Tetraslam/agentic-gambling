// Alpha Vantage API for market data
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY!;
const BASE_URL = 'https://www.alphavantage.co/query';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface MarketNews {
  title: string;
  summary: string;
  source: string;
  time_published: string;
  sentiment: string;
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote) return null;
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume'])
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
}

export async function getMarketNews(): Promise<MarketNews[]> {
  try {
    const response = await fetch(
      `${BASE_URL}?function=NEWS_SENTIMENT&topics=financial_markets&apikey=${API_KEY}&limit=10`
    );
    
    const data = await response.json();
    
    if (!data.feed) return [];
    
    return data.feed.map((item: any) => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      time_published: item.time_published,
      sentiment: item.overall_sentiment_label
    }));
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
}

export async function getIntradayData(symbol: string) {
  try {
    const response = await fetch(
      `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`
    );
    
    const data = await response.json();
    return data['Time Series (5min)'] || {};
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    return {};
  }
}
