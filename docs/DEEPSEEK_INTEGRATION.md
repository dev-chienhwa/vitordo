# DeepSeek Reasoner Integration Guide

## Overview
Vitordo now supports DeepSeek's Reasoner model, which provides advanced reasoning capabilities for task parsing and status updates. This guide explains how to configure and use DeepSeek with Vitordo.

## What is DeepSeek Reasoner?
DeepSeek Reasoner is an advanced AI model that provides detailed reasoning processes for complex tasks. It's particularly good at:
- Understanding complex natural language instructions
- Breaking down multi-step tasks
- Providing reasoning explanations for its decisions
- Handling ambiguous or context-dependent requests

## Configuration

### 1. Get Your DeepSeek API Key
1. Visit [DeepSeek's website](https://www.deepseek.com)
2. Sign up for an account
3. Navigate to the API section
4. Generate your API key

### 2. Environment Setup
Add your DeepSeek API key to your environment variables:

```bash
# .env.local
DEEPSEEK_API_KEY=your_deepseek_api_key_here
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=deepseek
```

### 3. Verify Configuration
Check that DeepSeek is properly configured by visiting the health check endpoint:
```
GET /api/health
```

Look for the `deepseek: 'configured'` status in the response.

## Features

### Advanced Task Parsing
DeepSeek Reasoner excels at understanding complex task descriptions:

**Example Input:**
```
"I need to prepare for the quarterly board meeting next week. This includes reviewing last quarter's financials, preparing the presentation slides, scheduling one-on-ones with department heads, and booking the conference room."
```

**DeepSeek Output:**
- Breaks down into 4 separate tasks
- Assigns appropriate priorities and time estimates
- Provides reasoning for scheduling decisions
- Considers dependencies between tasks

### Intelligent Status Updates
DeepSeek can understand nuanced status updates:

**Example Input:**
```
"I finished most of the presentation but still need to add the financial charts. The meeting with Sarah went well."
```

**DeepSeek Output:**
- Updates presentation task to partial completion
- Marks Sarah meeting as completed
- Provides reasoning for each decision

### Reasoning Transparency
Unlike other providers, DeepSeek shows its reasoning process:

```json
{
  "success": true,
  "tasks": [...],
  "reasoning": "I identified 4 distinct tasks from the input. The board meeting is next week, so I scheduled preparation tasks for this week with appropriate lead times. The financial review should be done first as it informs the presentation content."
}
```

## API Differences

### Request Format
DeepSeek uses the same OpenAI-compatible format:
```typescript
{
  model: "deepseek-reasoner",
  messages: [...],
  temperature: 0.1,
  max_tokens: 2000
}
```

### Response Handling
DeepSeek responses may include reasoning blocks that need to be parsed:
```
<reasoning>
The user mentioned "quarterly board meeting next week" which indicates urgency. I should break this down into preparatory tasks...
</reasoning>

{
  "success": true,
  "tasks": [...]
}
```

The Vitordo integration automatically extracts the JSON from reasoning responses.

## Configuration Options

### Model Selection
```typescript
// Default configuration
const deepseekProvider = new DeepSeekProvider(apiKey, {
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-reasoner'
});

// Custom configuration
const deepseekProvider = new DeepSeekProvider(apiKey, {
  baseURL: 'https://your-custom-endpoint.com/v1',
  model: 'deepseek-reasoner-v2'
});
```

### Environment Variables
```bash
# Required
DEEPSEEK_API_KEY=your_api_key

# Optional - Custom endpoint
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Optional - Custom model
DEEPSEEK_MODEL=deepseek-reasoner
```

## Best Practices

### 1. Leverage Reasoning Capabilities
DeepSeek works best with complex, multi-part requests:
- ✅ "Plan my week including work meetings, personal appointments, and family time"
- ❌ "Meeting at 2pm"

### 2. Provide Context
Give DeepSeek context for better reasoning:
- ✅ "I have a client presentation on Friday, so I need to prepare slides and practice beforehand"
- ❌ "Prepare slides"

### 3. Use Natural Language
DeepSeek understands conversational input:
- ✅ "I'm swamped this week but need to fit in the dentist appointment somehow"
- ❌ "dentist appointment urgent"

### 4. Review Reasoning
Check the reasoning field to understand DeepSeek's decisions:
```typescript
const response = await llmService.parseTaskInput(input);
if (response.reasoning) {
  console.log('DeepSeek reasoning:', response.reasoning);
}
```

## Performance Considerations

### Response Time
DeepSeek Reasoner may take longer than other models due to its reasoning process:
- Typical response time: 2-5 seconds
- Complex requests: 5-10 seconds
- Timeout configured: 30 seconds

### Token Usage
Reasoning responses use more tokens:
- Simple task: ~200-500 tokens
- Complex task: ~500-1500 tokens
- Status update: ~100-300 tokens

### Caching
DeepSeek responses are cached like other providers:
- Cache TTL: 30 minutes (configurable)
- Cache key includes reasoning context
- Reasoning explanations are cached too

## Troubleshooting

### Common Issues

#### 1. API Key Issues
```
Error: DEEPSEEK_API_KEY is required
```
**Solution:** Ensure your API key is set in environment variables.

#### 2. Parsing Errors
```
Error: Failed to parse response: Unexpected token
```
**Solution:** DeepSeek sometimes includes reasoning text. The integration handles this automatically, but custom implementations should extract JSON from reasoning blocks.

#### 3. Timeout Errors
```
Error: Request timeout after 30000ms
```
**Solution:** DeepSeek reasoning can be slow. Consider increasing timeout for complex requests.

#### 4. Rate Limiting
```
Error: Rate limit exceeded
```
**Solution:** DeepSeek has rate limits. Implement exponential backoff or reduce request frequency.

### Debug Mode
Enable debug mode to see detailed request/response logs:
```bash
NEXT_PUBLIC_DEBUG_MODE=true
```

## Migration from Other Providers

### From OpenAI
1. Change environment variable:
   ```bash
   NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=deepseek
   ```
2. Add DeepSeek API key
3. No code changes required

### From Anthropic
Same process as OpenAI migration.

### Fallback Configuration
Use DeepSeek as primary with OpenAI fallback:
```typescript
const llmService = new LLMService({
  provider: 'deepseek',
  fallbackProvider: 'openai',
  cacheEnabled: true,
  cacheTTL: 30
});
```

## Cost Comparison

| Provider | Input (1K tokens) | Output (1K tokens) | Reasoning Overhead |
|----------|-------------------|--------------------|--------------------|
| OpenAI GPT-4 | $0.03 | $0.06 | None |
| Anthropic Claude | $0.015 | $0.075 | None |
| DeepSeek Reasoner | $0.002 | $0.002 | ~2x tokens |

**Note:** DeepSeek is significantly cheaper but uses more tokens due to reasoning.

## Advanced Usage

### Custom Prompts
Override default prompts for specific use cases:
```typescript
const customProvider = new DeepSeekProvider(apiKey);
// Custom implementation would override buildTaskParsingPrompt
```

### Reasoning Analysis
Extract and analyze reasoning patterns:
```typescript
const response = await llmService.parseTaskInput(input);
if (response.reasoning) {
  // Analyze reasoning quality
  // Store reasoning for learning
  // Provide user feedback
}
```

### Multi-Provider Setup
Use different providers for different tasks:
```typescript
// DeepSeek for complex planning
const planningService = new LLMService({ provider: 'deepseek' });

// OpenAI for quick status updates
const statusService = new LLMService({ provider: 'openai' });
```

## Support and Resources

### Documentation
- [DeepSeek API Documentation](https://docs.deepseek.com)
- [Vitordo LLM Integration Guide](./API.md#llm-service)

### Community
- [DeepSeek Discord](https://discord.gg/deepseek)
- [Vitordo GitHub Issues](https://github.com/your-org/vitordo/issues)

### Updates
DeepSeek integration is actively maintained. Check for updates:
- Model improvements
- New reasoning capabilities
- Performance optimizations
- Cost reductions

---

**Ready to use DeepSeek Reasoner with Vitordo? Just add your API key and set the provider to 'deepseek'!**