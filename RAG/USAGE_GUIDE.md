# Medical Billing RAG Assistant - Usage Guide

## Quick Start

1. **Run the application:**
   ```bash
   # Windows
   run_app.bat
   
   # Or manually
   py -m streamlit run billing_rag_system.py
   ```

2. **Open your browser** to `http://localhost:8501`

## Features Overview

### 🔍 Code Search
- **Natural Language Queries**: Search using medical terms like "chest pain assessment", "fracture reduction"
- **Semantic Search**: Finds relevant codes even with different terminology
- **Detailed Results**: Shows code, description, amount, and usage guidelines
- **Similarity Scores**: Results ranked by relevance

**Example Searches:**
- "chest pain assessment" → H102, H152, A004
- "fracture reduction" → F013, F046, F032
- "laceration repair" → Z175, Z179, Z783
- "anesthesia" → E400C, E401C, A903

### 💰 Revenue Optimizer

**Step 1: Set Patient Context**
- **Patient Type**: adult, pediatric, geriatric
- **Time of Day**: regular, evening, weekend, holiday, night
- **Case Complexity**: minor, moderate, high

**Step 2: Add Procedures**
- Select from common procedures
- System suggests relevant billing codes
- Calculates total estimated revenue

**Step 3: Review Suggestions**
- **Primary Codes**: Base assessment codes
- **Add-on Codes**: Procedure-specific codes
- **Premium Codes**: Time-based bonuses
- **Optimization Tips**: Revenue maximization advice

### 📊 Analytics Dashboard

**Revenue Analysis:**
- Total revenue by code type
- Average revenue per code
- Code frequency distribution
- Top-performing codes

**Key Insights:**
- Fractures generate highest average revenue ($111.98)
- Emergency Department codes most frequently used
- Time-based premiums can increase revenue by 20-40%

## Revenue Optimization Strategies

### 1. **Assessment Level Optimization**
- Always bill the highest appropriate level
- Document thoroughly to support higher codes
- Use H102/H152 for moderate complexity (most common)

### 2. **Time-Based Premiums**
- Evening (1700-0000): +20% bonus
- Weekend/Holiday: +20% bonus  
- Night (0000-0800): +40% bonus
- Use E412/E413 codes for procedures

### 3. **Add-on Procedures**
- Include all applicable procedures
- Use Z-codes for surgical procedures
- Add procedural tray fees (K200/K201)

### 4. **Special Circumstances**
- **Trauma Premium**: 50% bonus on G-codes (ISS > 15)
- **Pediatric Emergency**: H105 for children < 2 years
- **Critical Care**: G521/G523 for life-threatening conditions
- **Consultations**: H055/H065 for complex cases

## Code Categories Reference

| Prefix | Category | Best Use Cases | Avg Revenue |
|--------|----------|----------------|-------------|
| H | Emergency Department | ER visits, time-based | $50.30 |
| F | Fractures | Orthopedic injuries | $111.98 |
| Z | Procedures | Surgical procedures | $53.00 |
| G | Critical Care | Life-threatening | $36.06 |
| K | Consultation/Forms | Documentation | $49.14 |
| E | Anesthesia | Surgical procedures | $21.93 |
| D | Dislocations | Joint injuries | $96.66 |

## Common Revenue Scenarios

### Scenario 1: Weekend ER Visit
- **Patient**: Adult with moderate chest pain
- **Time**: Saturday evening
- **Procedures**: EKG, chest X-ray
- **Optimal Codes**:
  - H152 (Comprehensive assessment) - $63.30
  - E412 (Weekend premium) - +20%
  - **Total**: ~$76 + premiums

### Scenario 2: Fracture Reduction
- **Patient**: Adult with wrist fracture
- **Time**: Regular hours
- **Procedures**: X-ray, reduction, casting
- **Optimal Codes**:
  - H102 (Base assessment) - $37.20
  - F046 (Fracture reduction) - $149.35
  - Z203 (Cast application) - $24.10
  - **Total**: ~$210.65

### Scenario 3: Night Trauma
- **Patient**: High-acuity trauma
- **Time**: Night shift
- **Procedures**: Critical care, procedures
- **Optimal Codes**:
  - H153 (High-acuity assessment) - $73.90
  - G521 (Critical care) - $110.55
  - E420 (Trauma premium) - +50%
  - E413 (Night premium) - +40%
  - **Total**: ~$300+ with premiums

## Tips for Maximum Revenue

1. **Documentation is Key**: Thorough documentation supports higher-level codes
2. **Time Matters**: Use appropriate time-based premiums
3. **Bundle Procedures**: Include all applicable add-on codes
4. **Know Your Codes**: Familiarize yourself with high-value codes
5. **Regular Updates**: Keep up with billing code changes

## Troubleshooting

**Common Issues:**
- **No Results**: Try different search terms or broader queries
- **Low Revenue**: Check for missed add-on codes or premiums
- **Code Conflicts**: Some codes cannot be billed together

**Getting Help:**
- Use the Help page in the application
- Check code descriptions for usage guidelines
- Review optimization tips for best practices

## Advanced Features

### Custom Searches
- Use specific medical terminology
- Search by procedure type
- Filter by code category

### Revenue Analysis
- Compare different scenarios
- Identify high-value opportunities
- Track revenue patterns

### Code Combinations
- Find compatible add-on codes
- Avoid conflicting codes
- Maximize revenue per visit
