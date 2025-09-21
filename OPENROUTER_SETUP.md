# AISteth OpenRouter Setup Guide

## Quick Start

### 1. Get OpenRouter API Key
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Go to your [API Keys page](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the API key

### 2. Run Setup Script
```bash
# Windows
setup-openrouter.bat

# Or manually:
# 1. Create backend/.env file
# 2. Add your OpenRouter API key
# 3. Install dependencies
```

### 3. Configure Environment
Edit `backend/.env` and replace `your-openrouter-api-key-here` with your actual OpenRouter API key:

```env
OPENAI_API_KEY="sk-or-v1-your-actual-openrouter-key-here"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
OPENAI_MODEL="anthropic/claude-3.5-sonnet"
```

### 4. Start the Application
```bash
# Terminal 1 - Backend
start-backend.bat

# Terminal 2 - Frontend  
start-frontend.bat
```

## Available Models on OpenRouter

The application is configured to use Claude 3.5 Sonnet, but you can change the model in `backend/.env`:

### Recommended Models:
- `anthropic/claude-3.5-sonnet` - Best overall performance
- `anthropic/claude-3.5-haiku` - Faster, cheaper
- `openai/gpt-4o` - OpenAI's latest
- `openai/gpt-4o-mini` - Faster, cheaper GPT-4
- `meta-llama/llama-3.1-405b-instruct` - Open source option

### Medical/Specialized Models:
- `google/gemini-pro-1.5` - Good for medical text
- `microsoft/phi-3-medium-128k-instruct` - Efficient option

## Configuration Details

### Backend Configuration (`backend/.env`)
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (change in production)
JWT_SECRET="aisteth-super-secret-jwt-key-2024"

# OpenRouter Configuration
OPENAI_API_KEY="sk-or-v1-your-key-here"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
OPENAI_MODEL="anthropic/claude-3.5-sonnet"

# Redis (optional - for caching)
REDIS_URL="redis://localhost:6379"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Server
PORT=3001
NODE_ENV=development
```

## API Endpoints

Once running, the Billing Assistant will be available at:

- **Frontend**: http://localhost:5173/billing
- **Backend API**: http://localhost:3001/api/billing
- **Health Check**: http://localhost:3001/health

### Key Billing API Endpoints:
- `POST /api/billing/analyze` - Analyze clinical text
- `GET /api/billing/search` - Search billing codes
- `GET /api/billing/categories` - Get code categories
- `GET /api/billing/revenue-optimization` - Revenue analysis

## Testing the Billing Assistant

### 1. Access the Interface
Navigate to http://localhost:5173/billing

### 2. Test Clinical Text Analysis
Try this sample clinical text:
```
Patient presents with chest pain, shortness of breath, and diaphoresis. 
Emergency assessment performed including EKG, chest X-ray, and cardiac enzymes. 
Patient diagnosed with acute myocardial infarction. 
Critical care provided for 2 hours including IV medications and monitoring.
```

### 3. Test Code Search
Search for terms like:
- "assessment"
- "emergency"
- "chest pain"
- "critical care"

## Troubleshooting

### Common Issues:

1. **"API key not found" error**
   - Check that `backend/.env` exists and has your OpenRouter API key
   - Ensure the key starts with `sk-or-v1-`

2. **"Model not found" error**
   - Verify the model name in `OPENAI_MODEL` is correct
   - Check OpenRouter's available models list

3. **CORS errors**
   - Ensure frontend is running on port 5173
   - Check `CORS_ORIGIN` in backend/.env

4. **Database errors**
   - Run `cd backend && npx prisma generate`
   - Check that `prisma/dev.db` exists

### Logs
- Backend logs: `backend/logs/`
- Check console output for detailed error messages

## Production Deployment

For production deployment:

1. **Change JWT secret** in `.env`
2. **Use production database** (PostgreSQL/MySQL)
3. **Set up Redis** for caching
4. **Configure proper CORS origins**
5. **Set up SSL/HTTPS**
6. **Use environment variables** for sensitive data

## Support

If you encounter issues:
1. Check the logs in `backend/logs/`
2. Verify your OpenRouter API key is valid
3. Ensure all dependencies are installed
4. Check that ports 3001 and 5173 are available

## Cost Optimization

OpenRouter pricing varies by model. To optimize costs:
- Use `claude-3.5-haiku` for faster/cheaper responses
- Implement caching for repeated queries
- Use shorter prompts where possible
- Monitor usage in your OpenRouter dashboard
