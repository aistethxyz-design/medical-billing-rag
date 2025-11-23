# RAG Agent Setup Guide

## ✅ What's Configured

### 1. **Knowledge Base**
- **CSV File**: `Codes by class.csv` (383 billing codes)
- **Location**: Root directory of the project
- **Service**: `billingCodeService.ts` loads and indexes all codes

### 2. **RAG Agent**
- **Service**: `ragBillingAgent.ts`
- **Features**:
  - Clinical text analysis
  - Semantic code search
  - Revenue optimization
  - Risk assessment
  - Documentation requirements

### 3. **OpenRouter API**
- **Configuration**: Uses `OPENAI_BASE_URL` and `OPENAI_API_KEY` from `.env`
- **Model**: `anthropic/claude-3.5-sonnet` (configurable)
- **Service**: `aiService.ts` handles all AI interactions

## 🚀 Quick Start

### Step 1: Set Up OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up and get your API key
3. Create `backend/.env` file with:
   ```
   OPENAI_API_KEY=sk-or-v1-your-actual-key-here
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_MODEL=anthropic/claude-3.5-sonnet
   PORT=3002
   NODE_ENV=development
   ```

### Step 2: Start the Backend

```bash
cd backend
npm run dev
```

The server will:
- Load all billing codes from `Codes by class.csv`
- Initialize the RAG agent
- Start on port 3002

### Step 3: Access the RAG Agent

1. **Frontend**: Navigate to `http://localhost:3000` (or whatever port your frontend uses)
2. **Go to**: `/billing` route
3. **Use the interface**:
   - Enter clinical text
   - Click "Analyze for Optimal Codes"
   - View suggestions with revenue impact

## 📊 API Endpoints

### Main RAG Endpoint
```
POST /api/billing/analyze
Body: {
  "clinicalText": "Patient presents with chest pain...",
  "encounterType": "Emergency",
  "timeOfDay": "Evening",
  "specialty": "Emergency Medicine"
}
```

### Code Search
```
GET /api/billing/search?q=chest pain&category=Emergency
```

## 🔍 How It Works

1. **Input**: Clinical text (e.g., "Patient with chest pain, EKG shows ST elevation")
2. **Processing**:
   - AI extracts clinical entities (symptoms, diagnoses, procedures)
   - RAG agent searches billing codes using semantic matching
   - Revenue optimization suggestions generated
   - Risk assessment calculated
3. **Output**: 
   - Suggested billing codes
   - Revenue impact analysis
   - Risk level (LOW/MEDIUM/HIGH)
   - Documentation requirements
   - AI explanation

## 📝 Example Usage

**Input Clinical Text:**
```
Patient presents with acute chest pain. EKG shows ST elevation. 
Given aspirin, clopidogrel, and taken to cath lab for primary PCI.
```

**RAG Agent Output:**
- **Primary Codes**: H132 (Comprehensive assessment - Evening), G521 (Critical Care)
- **Add-on Codes**: Z437 (Cardioversion), G211 (Intubation)
- **Revenue Impact**: $XXX increase
- **Risk Level**: MEDIUM
- **Documentation**: Document critical care time, interventions performed

## 🛠️ Troubleshooting

### CSV Not Found
- Make sure `Codes by class.csv` is in the root directory
- Check file permissions

### OpenRouter API Errors
- Verify API key in `.env` file
- Check API key has credits
- Ensure model name is correct

### Backend Won't Start
- Check Node.js version (v18+)
- Run `npm install` in backend directory
- Check for port conflicts

## 📚 Knowledge Base Details

- **Total Codes**: 383 billing codes
- **Categories**: Assessment, Emergency, Procedure, Consultation, Premium, Surgery, etc.
- **Time-based**: Day, Evening, Night, Weekend billing
- **Amounts**: CAD currency, various price points

The RAG agent uses this knowledge base to:
- Match clinical text to appropriate codes
- Suggest optimal code combinations
- Calculate revenue potential
- Assess compliance risk

