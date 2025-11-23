# 🔧 DeepSeek API Setup

## Current Status

✅ **API Key Updated**: DeepSeek key configured  
⚠️ **Balance Issue**: The DeepSeek account shows "402 Insufficient Balance"

## Configuration Options

### Option 1: Use DeepSeek via OpenRouter (Recommended)

If your DeepSeek key works with OpenRouter:
- **Model**: `deepseek/deepseek-chat`
- **Base URL**: `https://openrouter.ai/api/v1`
- **API Key**: Your DeepSeek key

**Current Setup**: ✅ Configured this way

### Option 2: Use DeepSeek API Directly

If you want to use DeepSeek's API directly:
- **Model**: `deepseek-chat`
- **Base URL**: `https://api.deepseek.com/v1`
- **API Key**: Your DeepSeek key

**Note**: This requires credits in your DeepSeek account.

## To Fix Balance Issue

1. **For OpenRouter**:
   - Go to: https://openrouter.ai/account
   - Add credits to your account
   - Your DeepSeek key should work via OpenRouter

2. **For DeepSeek Direct**:
   - Go to: https://platform.deepseek.com/
   - Check your account balance
   - Add credits if needed

## Restart Server

After updating configuration:
```bash
cd backend
node simple-rag-server.js
```

## Test

Run the test script:
```bash
node test-ai-direct.js
```

If successful, you'll see:
```
✅ Success! AI Response: ...
```

If you see "402 Insufficient Balance", add credits to your account.

