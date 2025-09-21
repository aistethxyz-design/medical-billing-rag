# Billing Assistant - RAG Agent for Medical Billing Optimization

## Overview

The Billing Assistant is a sophisticated RAG (Retrieval-Augmented Generation) agent designed to help healthcare providers find optimal billing codes for maximum revenue while maintaining compliance. It uses AI to analyze clinical text and suggest the most appropriate billing codes from a curated database of medical billing codes.

## Features

### 🔍 **Intelligent Code Search**
- Semantic search across 380+ billing codes
- Filter by category, time of day, and amount range
- Quick search suggestions for common code types
- Recent codes tracking

### 🤖 **AI-Powered Analysis**
- Clinical text analysis using GPT-4
- Automatic code suggestion based on medical documentation
- Revenue impact calculation
- Risk assessment and compliance scoring

### 💰 **Revenue Optimization**
- Identifies missed billing opportunities
- Suggests higher-value codes when appropriate
- Time-based billing optimization
- Specialty-specific recommendations

### 📊 **Comprehensive Analytics**
- Revenue impact analysis
- Risk level assessment (LOW/MEDIUM/HIGH)
- Documentation requirements
- Compliance scoring

## Architecture

### Backend Components

#### 1. BillingCodeService (`backend/src/services/billingCodeService.ts`)
- Loads and indexes billing codes from CSV
- Provides search and filtering capabilities
- Calculates revenue impact and risk assessment
- Handles code categorization and time-based billing

#### 2. RAGBillingAgent (`backend/src/services/ragBillingAgent.ts`)
- Main RAG agent for intelligent code suggestions
- Integrates with OpenAI for clinical text analysis
- Provides comprehensive billing recommendations
- Generates explanations and documentation requirements

#### 3. Billing API Routes (`backend/src/routes/billing.ts`)
- RESTful API endpoints for billing operations
- Search, analysis, and optimization endpoints
- Revenue tracking and analytics
- Quick search and recent codes functionality

### Frontend Components

#### BillingAssistant Page (`frontend/src/pages/BillingAssistant.tsx`)
- Modern, responsive UI for billing code lookup
- Clinical text analysis interface
- Real-time search and filtering
- Revenue impact visualization
- Risk assessment display

## API Endpoints

### Core Analysis
- `POST /api/billing/analyze` - Analyze clinical text for optimal codes
- `GET /api/billing/search` - Search billing codes with filters
- `GET /api/billing/code/:code` - Get specific code details

### Analytics & Optimization
- `GET /api/billing/revenue-optimization` - Get revenue optimization suggestions
- `GET /api/billing/categories` - Get all code categories
- `GET /api/billing/codes/category/:category` - Get codes by category

### Quick Access
- `GET /api/billing/quick-searches` - Get quick search suggestions
- `GET /api/billing/recent-codes` - Get recently used codes

## Usage Examples

### 1. Clinical Text Analysis
```typescript
const analysis = await fetch('/api/billing/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicalText: "Patient presents with chest pain, shortness of breath. Emergency assessment performed.",
    encounterType: "Emergency",
    specialty: "Emergency Medicine",
    timeOfDay: "Evening"
  })
});
```

### 2. Code Search
```typescript
const results = await fetch('/api/billing/search?q=assessment&category=Emergency&minAmount=50');
```

### 3. Revenue Optimization
```typescript
const optimization = await fetch('/api/billing/revenue-optimization?startDate=2024-01-01&endDate=2024-01-31');
```

## Billing Code Categories

The system includes codes from the following categories:

- **Assessment** (A-codes) - General and specific assessments
- **Emergency** (H-codes) - Emergency department specific codes
- **Procedure** (G-codes) - Medical procedures and interventions
- **Consultation** (K-codes) - Consultations and counseling
- **Premium** (E-codes) - After-hours and premium billing
- **Surgery** (Z-codes) - Surgical procedures
- **Repair** (R-codes) - Laceration and wound repair
- **Fracture** (F-codes) - Fracture management
- **Dislocation** (D-codes) - Joint dislocation reduction
- **Telemedicine** (B-codes) - Telehealth services

## Time-Based Billing

The system automatically applies time-based multipliers:

- **Day** (8AM-5PM): Base rate
- **Evening** (5PM-12AM): 1.2x multiplier
- **Weekend**: 1.5x multiplier
- **Night** (12AM-8AM): 1.8x multiplier

## Risk Assessment

The system evaluates risk levels based on:

- **Code Value**: Higher-value codes have higher risk
- **Time-Based Billing**: Premium time codes increase risk
- **Documentation Requirements**: Complex documentation increases risk
- **Code Combinations**: Multiple high-risk codes increase audit probability

## Compliance Features

- **HIPAA Compliant**: All data processing follows HIPAA guidelines
- **Audit Trail**: Comprehensive logging of all billing decisions
- **Documentation Requirements**: Clear guidance on required documentation
- **Bundling Rules**: NCCI bundling rule validation
- **Modifier Validation**: Appropriate modifier suggestions

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Billing Assistant
Navigate to `/billing` in the application to access the Billing Assistant interface.

## Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### CSV Data Source
The billing codes are loaded from `Codes by class.csv` in the project root. The CSV format includes:
- Code: Billing code identifier
- Description: Code description
- How to Use: Usage guidelines
- Amount: Reimbursement amount in CAD

## Future Enhancements

- **Machine Learning Models**: Custom models trained on billing data
- **Real-time Updates**: Live updates from billing systems
- **Integration**: Direct integration with EHR systems
- **Advanced Analytics**: Predictive analytics for revenue optimization
- **Mobile App**: Mobile interface for point-of-care billing

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
