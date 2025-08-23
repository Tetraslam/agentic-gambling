# 🔧 AI SDK Import Fix

## Current Issue:
```typescript
import { useChat } from 'ai/react'; // ❌ Module not found
```

## Temporary Solution:
- Trading agent uses manual chat simulation
- All TypeScript types are correct
- API route `/api/chat/trading` is fully implemented and working

## Possible Solutions to Try:

### 1. Install React-specific package:
```bash
pnpm add @ai-sdk/react
# Then: import { useChat } from '@ai-sdk/react';
```

### 2. Or try newer AI SDK:
```bash
pnpm add ai@latest @ai-sdk/openai@latest
# Then: import { useChat } from 'ai/react';
```

### 3. Check AI SDK docs:
- https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot
- Verify correct import path for v5.x

## Quick Fix in `src/components/agents/trading-agent.tsx`:

Replace the temporary implementation with:
```typescript
import { useChat } from 'ai/react'; // or correct import
// Remove lines 18-45 (manual chat simulation)
// Restore original useChat hook:
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat/trading',
});
```

## Priority: 
🔴 **LOW** - Trading functionality works via API, just UI chat is simulated for now
