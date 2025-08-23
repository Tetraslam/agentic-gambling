// Perplexity API for market headlines context
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const BASE_URL = 'https://api.perplexity.ai/chat/completions';

export async function getMarketHeadlines(): Promise<string> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial news summarizer. Provide a concise summary of the most important market headlines from the past hour.'
          },
          {
            role: 'user',
            content: 'Give me the top 5 most important financial market headlines from the past hour that could affect trading decisions. Keep it concise and focused on actionable market-moving news.'
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
        top_p: 0.9,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    
    return 'No recent market headlines available.';
  } catch (error) {
    console.error('Error fetching market headlines:', error);
    return 'Unable to fetch market headlines at this time.';
  }
}
