# 🚀 Quick Start Guide - RAG Agent

## ✅ Current Status

- ✅ **Frontend**: Running on http://localhost:3000
- ⚠️ **Backend**: Needs to be started on port 3002
- ✅ **CSV Knowledge Base**: `Codes by class.csv` (383 codes)
- ✅ **RAG Agent**: Configured and ready

## 🎯 To Access the RAG Agent:

### Option 1: Use the Startup Script (Easiest)
```bash
start-rag-agent.bat
```
This will start both frontend and backend in separate windows.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📝 Before Starting - Set Your OpenRouter API Key

1. Create `backend/.env` file:
```
OPENAI_API_KEY=sk-or-v1-your-actual-key-here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet
PORT=3002
NODE_ENV=development
```

2. Get your API key from: https://openrouter.ai/

## 🌐 Access Points

- **Frontend UI**: http://localhost:3000
- **Billing Assistant (RAG Agent)**: http://localhost:3000/billing
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## 🧪 Test the RAG Agent

1. Go to: http://localhost:3000/billing
2. Enter clinical text, for example:
   ```
   Patient presents with chest pain. EKG shows ST elevation. 
   Given aspirin and taken to cath lab for primary PCI.
   ```
3. Click "Analyze for Optimal Codes"
4. View suggestions with revenue impact!

## 🔧 Troubleshooting

### Backend Won't Start
- Check `backend/.env` exists
- Run `npm install` in backend folder
- Check for TypeScript errors

### Frontend Shows Error
- Make sure backend is running on port 3002
- Check browser console for errors
- Verify proxy settings in `vite.config.ts`

### CSV Not Found
- Ensure `Codes by class.csv` is in the root directory
- Check file permissions

## 📊 What the RAG Agent Does

1. **Loads** all 383 billing codes from CSV
2. **Analyzes** your clinical text using AI
3. **Searches** for relevant codes using semantic matching
4. **Suggests** optimal code combinations
5. **Calculates** revenue impact
6. **Assesses** compliance risk
7. **Generates** documentation requirements

Enjoy your RAG-powered billing assistant! 🎉

