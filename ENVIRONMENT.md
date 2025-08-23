# Environment Variables

Add these to your `.env.local` file:

```bash
# Alpha Vantage API (free tier available)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Alpaca API (paper trading - free)
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here

# Perplexity API for market headlines
PERPLEXITY_API_KEY=your_perplexity_key_here

# OpenAI API for GPT-4o (for trading agent)
OPENAI_API_KEY=your_openai_key_here

# Convex (for auth & data storage)
CONVEX_DEPLOYMENT=your_convex_deployment_url
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

## Getting API Keys

1. **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (free)
2. **Alpaca**: https://alpaca.markets/ (paper trading account)
3. **Perplexity**: https://www.perplexity.ai/settings/api
4. **OpenAI**: https://platform.openai.com/api-keys
5. **Convex**: https://convex.dev/ (set up via `pnpm convex dev`)
