import pandas as pd
import numpy as np
import streamlit as st
from sentence_transformers import SentenceTransformer

# Try to import plotly, fallback to basic charts if not available
try:
    import plotly.express as px
    import plotly.graph_objects as go
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    print("⚠️ Plotly not available, using basic charts")
import json
import re
from typing import List, Dict, Tuple, Optional
from datetime import datetime, time
import os
from openai import OpenAI

# Try to import pinecone, fallback to FAISS if not available
try:
    import pinecone
    PINECONE_AVAILABLE = True
except (ImportError, Exception) as e:
    print(f"⚠️ Pinecone not available: {e}")
    PINECONE_AVAILABLE = False

# Always import faiss as fallback
import faiss

class AdvancedBillingRAGSystem:
    def __init__(self, csv_path: str, pinecone_api_key: str, openrouter_api_key: str):
        """Initialize the advanced RAG system with Pinecone and OpenRouter."""
        self.csv_path = csv_path
        self.pinecone_api_key = pinecone_api_key
        self.openrouter_api_key = openrouter_api_key
        self.df = None
        self.model = None
        self.index = None
        self.pinecone_index = None
        
        # Initialize OpenAI client for OpenRouter
        self.client = OpenAI(
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        
        self.load_data()
        self.setup_pinecone()
        self.setup_embeddings()
        
    def load_data(self):
        """Load and preprocess the billing codes CSV."""
        self.df = pd.read_csv(self.csv_path)
        
        # Clean and preprocess the data
        self.df = self.df.dropna(subset=['Code', 'Description'])
        self.df['Code'] = self.df['Code'].astype(str).str.strip()
        self.df['Description'] = self.df['Description'].astype(str).str.strip()
        
        # Extract and clean amounts
        self.df['Amount_Clean'] = self.df['Amount ($CAD)'].astype(str).str.replace('$', '').str.replace(',', '')
        
        # Parse different amount formats
        amounts = []
        for amount_str in self.df['Amount_Clean']:
            if pd.isna(amount_str) or amount_str.strip() == '':
                amounts.append(0)
            elif 'per' in amount_str.lower() or 'bonus' in amount_str.lower():
                # Handle complex pricing (bonuses, per-unit pricing)
                amounts.append(0)  # Will handle separately
            else:
                try:
                    # Extract first number found
                    numbers = re.findall(r'[\d.]+', amount_str)
                    if numbers:
                        amounts.append(float(numbers[0]))
                    else:
                        amounts.append(0)
                except:
                    amounts.append(0)
        
        self.df['Amount_Numeric'] = amounts
        
        # Create enhanced descriptions for better search
        self.df['Enhanced_Description'] = (
            self.df['Code'] + ' ' + 
            self.df['Description'] + ' ' + 
            self.df['How to Use'].fillna('')
        )
        
        # Extract code types
        self.df['Code_Type'] = self.df['Code'].apply(self._categorize_code_type)
        
        print(f"✅ Loaded {len(self.df)} billing codes")
    
    def _categorize_code_type(self, code: str) -> str:
        """Categorize codes based on their prefix."""
        if code.startswith('H'):
            return 'Emergency Department'
        elif code.startswith('A'):
            return 'Assessment'
        elif code.startswith('Z'):
            return 'Procedures'
        elif code.startswith('G'):
            return 'Critical Care/Procedures'
        elif code.startswith('E'):
            return 'Anesthesia/Premiums'
        elif code.startswith('M'):
            return 'Fractures'
        elif code.startswith('N'):
            return 'Dislocations'
        elif code.startswith('P'):
            return 'Consultation/Forms'
        else:
            return 'Other'
    
    def setup_pinecone(self):
        """Initialize Pinecone vector database."""
        if not PINECONE_AVAILABLE:
            print("⚠️ Pinecone not available, using local FAISS")
            self.pinecone_index = None
            return
            
        try:
            from pinecone import Pinecone, ServerlessSpec
            
            # Initialize Pinecone client
            pc = Pinecone(api_key=self.pinecone_api_key)
            
            # Create or get index
            index_name = "medical-billing-codes"
            
            # Check if index exists
            existing_indexes = pc.list_indexes()
            if index_name not in [idx.name for idx in existing_indexes]:
                print("Creating new Pinecone index...")
                pc.create_index(
                    name=index_name,
                    dimension=384,  # all-MiniLM-L6-v2 dimension
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud='aws',
                        region='us-east-1'
                    )
                )
            
            self.pinecone_index = pc.Index(index_name)
            print("✅ Pinecone index ready")
            
        except Exception as e:
            print(f"❌ Pinecone setup failed: {e}")
            # Fallback to local FAISS
            self.pinecone_index = None
    
    def setup_embeddings(self):
        """Setup embeddings model and create vector embeddings."""
        print("🔧 Setting up embeddings...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create embeddings for all descriptions
        descriptions = self.df['Enhanced_Description'].tolist()
        self.code_embeddings = self.model.encode(descriptions)
        
        if self.pinecone_index and PINECONE_AVAILABLE:
            # Upload to Pinecone
            print("📤 Uploading embeddings to Pinecone...")
            vectors_to_upsert = []
            for i, (_, row) in enumerate(self.df.iterrows()):
                # Clean metadata to handle NaN values
                metadata = {
                    'code': str(row['Code']),
                    'description': str(row['Description']),
                    'how_to_use': str(row['How to Use']) if pd.notna(row['How to Use']) else '',
                    'amount': str(row['Amount ($CAD)']) if pd.notna(row['Amount ($CAD)']) else '',
                    'amount_numeric': float(row['Amount_Numeric']) if pd.notna(row['Amount_Numeric']) else 0.0,
                    'code_type': str(row['Code_Type'])
                }
                
                vectors_to_upsert.append({
                    'id': str(i),
                    'values': self.code_embeddings[i].tolist(),
                    'metadata': metadata
                })
            
            # Batch upload
            batch_size = 100
            for i in range(0, len(vectors_to_upsert), batch_size):
                batch = vectors_to_upsert[i:i+batch_size]
                self.pinecone_index.upsert(vectors=batch)
            
            print("✅ Embeddings uploaded to Pinecone")
        else:
            # Fallback to local FAISS
            print("📦 Setting up local FAISS index...")
            dimension = self.code_embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)
            faiss.normalize_L2(self.code_embeddings)
            self.index.add(self.code_embeddings)
            print("✅ Local FAISS index ready")
    
    def search_codes(self, query: str, top_k: int = 20) -> Dict:
        """Search for relevant billing codes using Pinecone or FAISS."""
        # Expand the query with NLP understanding
        expanded_query = self._expand_query_with_nlp(query)
        combined_query = f"{query} {expanded_query}"
        
        query_embedding = self.model.encode([combined_query])
        
        if self.pinecone_index and PINECONE_AVAILABLE:
            # Search using Pinecone
            try:
                results = self.pinecone_index.query(
                    vector=query_embedding[0].tolist(),
                    top_k=top_k,
                    include_metadata=True
                )
                
                # Process Pinecone results
                codes = []
                for match in results['matches']:
                    metadata = match['metadata']
                    codes.append({
                        'code': metadata['code'],
                        'description': metadata['description'],
                        'how_to_use': metadata['how_to_use'],
                        'amount': metadata['amount'],
                        'amount_numeric': metadata['amount_numeric'],
                        'code_type': metadata['code_type'],
                        'similarity_score': match['score']
                    })
            except Exception as e:
                print(f"❌ Pinecone search failed: {e}, falling back to FAISS")
                # Fallback to FAISS
                faiss.normalize_L2(query_embedding)
                scores, indices = self.index.search(query_embedding, top_k)
                
                codes = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx < len(self.df):
                        row = self.df.iloc[idx]
                        codes.append({
                            'code': row['Code'],
                            'description': row['Description'],
                            'how_to_use': row['How to Use'],
                            'amount': row['Amount ($CAD)'],
                            'amount_numeric': row['Amount_Numeric'],
                            'code_type': row['Code_Type'],
                            'similarity_score': float(score)
                        })
        else:
            # Use FAISS
            faiss.normalize_L2(query_embedding)
            scores, indices = self.index.search(query_embedding, top_k)
            
            codes = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.df):
                    row = self.df.iloc[idx]
                    codes.append({
                        'code': row['Code'],
                        'description': row['Description'],
                        'how_to_use': row['How to Use'],
                        'amount': row['Amount ($CAD)'],
                        'amount_numeric': row['Amount_Numeric'],
                        'code_type': row['Code_Type'],
                        'similarity_score': float(score)
                    })
        
        # Categorize results based on Canadian billing hierarchy
        primary_codes = []
        add_on_codes = []
        
        # First, identify G codes (Critical Care) and H codes (Emergency Medicine) as primary
        g_codes = [code for code in codes if code['code'].startswith('G')]
        h_codes = [code for code in codes if code['code'].startswith('H')]
        
        # Sort G codes by similarity (for critical care)
        g_codes.sort(key=lambda x: x['similarity_score'], reverse=True)
        # Sort H codes by similarity (for emergency medicine)
        h_codes.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Select top 2 primary codes based on encounter type
        if g_codes:
            # Critical care encounter - prioritize G codes
            primary_codes = g_codes[:2]  # Top 2 G codes
            # Add remaining codes as add-ons
            add_on_codes = g_codes[2:] + h_codes + [code for code in codes if not code['code'].startswith(('G', 'H'))]
        elif h_codes:
            # Emergency medicine encounter - prioritize H codes
            primary_codes = h_codes[:2]  # Top 2 H codes
            # Add remaining codes as add-ons
            add_on_codes = h_codes[2:] + [code for code in codes if not code['code'].startswith(('G', 'H'))]
        else:
            # Fallback to similarity-based selection
            for code in codes:
                if code['similarity_score'] > 0.3:
                    primary_codes.append(code)
                else:
                    add_on_codes.append(code)
        
        return {
            'primary_codes': primary_codes,
            'add_on_codes': add_on_codes,
            'total_primary': len(primary_codes),
            'total_add_ons': len(add_on_codes),
            'expanded_query': expanded_query,
            'encounter_type': 'Critical Care' if g_codes else 'Emergency Medicine' if h_codes else 'General'
        }
    
    def _expand_query_with_nlp(self, query: str) -> str:
        """Expand natural language queries with medical terminology and synonyms."""
        query_lower = query.lower().strip()
        
        # Medical term expansions and synonyms
        medical_expansions = {
            # Symptoms to assessments
            'chest pain': 'chest pain assessment evaluation examination',
            'abdominal pain': 'abdominal pain assessment evaluation examination',
            'headache': 'headache assessment evaluation examination',
            'back pain': 'back pain assessment evaluation examination',
            'shortness of breath': 'shortness of breath assessment evaluation examination',
            'dizziness': 'dizziness assessment evaluation examination',
            'nausea': 'nausea assessment evaluation examination',
            'fever': 'fever assessment evaluation examination',
            
            # Injuries to procedures
            'broken bone': 'fracture reduction repair',
            'cut': 'laceration repair suture',
            'wound': 'laceration repair wound care',
            'burn': 'burn treatment debridement',
            'sprain': 'sprain treatment immobilization',
            'dislocation': 'dislocation reduction manipulation',
            
            # Medical conditions
            'heart attack': 'myocardial infarction cardiac emergency',
            'stroke': 'cerebrovascular accident stroke management',
            'diabetes': 'diabetes management glucose monitoring',
            'hypertension': 'hypertension blood pressure management',
            'asthma': 'asthma respiratory management',
            'pneumonia': 'pneumonia respiratory infection',
            
            # Procedures
            'surgery': 'surgical procedure operation',
            'suture': 'suture repair laceration',
            'injection': 'injection administration medication',
            'dressing': 'wound dressing bandage',
            'splint': 'splinting immobilization fracture',
            'cast': 'casting immobilization fracture',
            
            # Emergency terms
            'emergency': 'emergency department urgent critical',
            'trauma': 'trauma injury critical care',
            'accident': 'accident injury emergency',
            'urgent': 'urgent emergency critical',
            
            # Time-based
            'night': 'night shift after hours',
            'weekend': 'weekend holiday premium',
            'holiday': 'holiday weekend premium',
            
            # Abbreviations
            'mi': 'myocardial infarction heart attack cardiac',
            'cva': 'cerebrovascular accident stroke',
            'copd': 'chronic obstructive pulmonary disease',
            'chf': 'congestive heart failure',
            'uti': 'urinary tract infection',
            'er': 'emergency room department',
            'ed': 'emergency department',
            'icu': 'intensive care unit',
            'or': 'operating room surgery',
            'pt': 'physical therapy',
            'ot': 'occupational therapy'
        }
        
        expanded_terms = []
        remaining_query = query_lower
        
        # First, try to match multi-word phrases
        for phrase, expansion in sorted(medical_expansions.items(), key=lambda x: len(x[0]), reverse=True):
            if phrase in remaining_query:
                expanded_terms.append(expansion)
                remaining_query = remaining_query.replace(phrase, '').strip()
        
        # Then, try individual terms
        for term in remaining_query.split():
            if term in medical_expansions:
                expanded_terms.append(medical_expansions[term])
            else:
                # Try partial matches
                for key, expansion in medical_expansions.items():
                    if term in key or key in term:
                        expanded_terms.append(expansion)
                        break
                else:
                    expanded_terms.append(term)
        
        # Combine and remove duplicates
        expanded_query = ' '.join(expanded_terms)
        words = expanded_query.split()
        seen = set()
        unique_words = []
        for word in words:
            if word not in seen:
                seen.add(word)
                unique_words.append(word)
        
        expanded_query = ' '.join(unique_words)
        
        # Add context if no medical terms found
        if not any(suffix in expanded_query for suffix in ['assessment', 'evaluation', 'examination', 'procedure', 'treatment']):
            if any(symptom in expanded_query for symptom in ['pain', 'ache', 'discomfort']):
                expanded_query += ' assessment evaluation examination'
            elif any(injury in expanded_query for injury in ['fracture', 'break', 'cut', 'wound', 'laceration']):
                expanded_query += ' repair treatment procedure'
        
        return expanded_query
    
    def generate_llm_response(self, query: str, search_results: Dict) -> str:
        """Generate LLM-powered response using OpenRouter."""
        try:
            # Prepare context from search results
            primary_codes = search_results['primary_codes'][:5]  # Top 5 primary codes
            add_on_codes = search_results['add_on_codes'][:5]    # Top 5 add-on codes
            
            context = "Medical Billing Codes Search Results:\n\n"
            context += "PRIMARY CODES (Most Relevant):\n"
            for code in primary_codes:
                context += f"- {code['code']}: {code['description']} (${code['amount_numeric']:.2f})\n"
            
            context += "\nADD-ON CODES (Revenue Boosters):\n"
            for code in add_on_codes:
                context += f"- {code['code']}: {code['description']} (${code['amount_numeric']:.2f})\n"
            
            # Calculate total revenue
            total_primary = sum(code['amount_numeric'] for code in primary_codes)
            total_addons = sum(code['amount_numeric'] for code in add_on_codes)
            total_revenue = total_primary + total_addons
            
            context += f"\nREVENUE SUMMARY:\n"
            context += f"- Primary Codes Revenue: ${total_primary:.2f}\n"
            context += f"- Add-on Codes Revenue: ${total_addons:.2f}\n"
            context += f"- Total Potential Revenue: ${total_revenue:.2f}\n"
            
            # Create prompt for LLM
            prompt = f"""
You are a Canadian medical billing expert AI assistant. Based on the search results below, provide a comprehensive analysis following Canadian billing hierarchy.

SEARCH QUERY: "{query}"

{context}

CANADIAN BILLING STRUCTURE:
- PRIMARY CODES: Suggest exactly 2 primary codes
  * G codes for Critical Care encounters (can be added multiple times for 15-minute reassessments)
  * H codes for regular Emergency Medicine encounters
- ADD-ON CODES: Additional codes for procedures, mental health assessments, forms, or anesthesia
  * Z codes for procedures
  * A codes for assessments
  * E codes for anesthesia
  * P codes for forms/consultations

Please provide:
1. **Primary Code Recommendation**: Suggest exactly 2 primary codes (G or H codes)
2. **Add-on Code Suggestions**: Additional codes for procedures, assessments, forms, anesthesia
3. **Revenue Optimization**: How to maximize billing with proper code combinations
4. **Documentation Requirements**: What to document to support these codes
5. **Time-based Billing**: For G codes, explain 15-minute reassessment billing

Focus on Canadian healthcare billing practices and revenue optimization.
"""
            
            # Call OpenRouter API
            response = self.client.chat.completions.create(
                model="meta-llama/llama-3.2-3b-instruct:free",
                messages=[
                    {"role": "system", "content": "You are a medical billing expert AI assistant specializing in Canadian healthcare billing codes and revenue optimization."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"❌ Error generating LLM response: {str(e)}"
    
    def get_revenue_optimization_suggestions(self, 
                                           patient_type: str = "adult",
                                           time_of_day: str = "regular",
                                           complexity: str = "moderate",
                                           procedures: List[str] = None) -> Dict:
        """Generate revenue optimization suggestions using LLM."""
        try:
            # Prepare context
            context = f"""
Patient Type: {patient_type}
Time of Day: {time_of_day}
Complexity: {complexity}
Procedures: {procedures if procedures else 'Not specified'}
"""
            
            # Get relevant codes
            search_query = f"{patient_type} {complexity} {time_of_day}"
            if procedures:
                search_query += " " + " ".join(procedures)
            
            results = self.search_codes(search_query, top_k=15)
            
            # Generate LLM response
            prompt = f"""
Based on the following patient context and billing codes, provide revenue optimization suggestions:

CONTEXT:
{context}

BILLING CODES FOUND:
Primary Codes: {len(results['primary_codes'])}
Add-on Codes: {len(results['add_on_codes'])}

Please provide:
1. Recommended primary billing codes
2. Suggested add-on codes for revenue optimization
3. Time-based premium opportunities
4. Documentation requirements
5. Revenue maximization strategies

Focus on practical, actionable advice for medical billing optimization.
"""
            
            response = self.client.chat.completions.create(
                model="meta-llama/llama-3.2-3b-instruct:free",
                messages=[
                    {"role": "system", "content": "You are a medical billing expert specializing in revenue optimization for Canadian healthcare."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            return {
                'suggestions': response.choices[0].message.content,
                'search_results': results
            }
            
        except Exception as e:
            return {
                'suggestions': f"❌ Error generating suggestions: {str(e)}",
                'search_results': {'primary_codes': [], 'add_on_codes': []}
            }
    
    def get_canadian_billing_recommendations(self, query: str) -> Dict:
        """Get specialized Canadian billing recommendations following G/H code hierarchy."""
        try:
            # Search for relevant codes
            results = self.search_codes(query, top_k=15)
            
            # Analyze encounter type
            encounter_type = results.get('encounter_type', 'General')
            primary_codes = results['primary_codes']
            add_on_codes = results['add_on_codes']
            
            # Categorize add-on codes by type
            procedure_codes = [code for code in add_on_codes if code['code'].startswith('Z')]
            assessment_codes = [code for code in add_on_codes if code['code'].startswith('A')]
            anesthesia_codes = [code for code in add_on_codes if code['code'].startswith('E')]
            form_codes = [code for code in add_on_codes if code['code'].startswith('P')]
            
            # Generate recommendations
            recommendations = {
                'encounter_type': encounter_type,
                'primary_recommendations': primary_codes[:2],  # Exactly 2 primary codes
                'add_on_categories': {
                    'procedures': procedure_codes[:5],
                    'assessments': assessment_codes[:3],
                    'anesthesia': anesthesia_codes[:3],
                    'forms': form_codes[:3]
                },
                'revenue_optimization': self._generate_revenue_tips(encounter_type, primary_codes, add_on_codes),
                'documentation_requirements': self._generate_documentation_tips(encounter_type, primary_codes)
            }
            
            return recommendations
            
        except Exception as e:
            return {
                'error': f"❌ Error generating Canadian billing recommendations: {str(e)}",
                'encounter_type': 'Unknown',
                'primary_recommendations': [],
                'add_on_categories': {}
            }
    
    def _generate_revenue_tips(self, encounter_type: str, primary_codes: List, add_on_codes: List) -> List[str]:
        """Generate revenue optimization tips based on encounter type."""
        tips = []
        
        if encounter_type == 'Critical Care':
            tips.extend([
                "💰 G codes can be billed every 15 minutes for reassessments",
                "💡 Consider G004 (first 15 min) + G005 (additional 15 min blocks)",
                "⚡ Document continuous monitoring and interventions",
                "📊 Maximum revenue with proper time documentation"
            ])
        elif encounter_type == 'Emergency Medicine':
            tips.extend([
                "🏥 Use H152 for comprehensive assessments (highest value)",
                "⏰ Consider time-based premiums (night/weekend rates)",
                "📋 Add procedure codes for any interventions performed",
                "💵 Document complexity to support higher-level codes"
            ])
        
        # General tips
        tips.extend([
            "🔧 Add Z codes for all procedures performed",
            "🧠 Include A codes for mental health assessments if applicable",
            "💉 Add E codes for any anesthesia provided",
            "📝 Use P codes for forms and consultations"
        ])
        
        return tips
    
    def _generate_documentation_tips(self, encounter_type: str, primary_codes: List) -> List[str]:
        """Generate documentation requirements for billing codes."""
        tips = []
        
        if encounter_type == 'Critical Care':
            tips.extend([
                "📊 Document vital signs every 15 minutes",
                "⚡ Record all interventions and responses",
                "🕐 Note exact time spent in critical care",
                "📋 Document decision-making process"
            ])
        elif encounter_type == 'Emergency Medicine':
            tips.extend([
                "🏥 Document comprehensive assessment findings",
                "⏰ Record time of arrival and assessment",
                "📝 Note chief complaint and history",
                "🔍 Document physical examination findings"
            ])
        
        return tips

def main():
    """Main Streamlit application."""
    st.set_page_config(
        page_title="Advanced Medical Billing RAG Assistant",
        page_icon="🏥",
        layout="wide"
    )
    
    st.title("🏥 Advanced Medical Billing RAG Assistant")
    st.markdown("**Powered by Pinecone + OpenRouter + LLM**")
    
    # API Keys configuration
    st.sidebar.header("🔑 API Configuration")
    pinecone_key = st.sidebar.text_input("Pinecone API Key", type="password", value="pcsk_si3DV_F4yTwrPzsfMs6zfKdZCwgYNkCrU5c8BjRXSsqCPBBbDAQqWU2Kc5z77K6ghAtd9")
    openrouter_key = st.sidebar.text_input("OpenRouter API Key", type="password", value="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")
    
    if not pinecone_key or not openrouter_key:
        st.warning("Please enter your API keys in the sidebar to continue.")
        return
    
    # Initialize RAG system
    if 'rag_system' not in st.session_state:
        with st.spinner("Initializing Advanced RAG System..."):
            try:
                st.session_state.rag_system = AdvancedBillingRAGSystem(
                    'Codes by class.csv',
                    pinecone_key,
                    openrouter_key
                )
                st.success("✅ Advanced RAG System initialized successfully!")
            except Exception as e:
                st.error(f"❌ Failed to initialize RAG system: {str(e)}")
                return
    
    rag_system = st.session_state.rag_system
    
    # Main interface
    tab1, tab2, tab3, tab4 = st.tabs(["🔍 Search & Analyze", "🇨🇦 Canadian Billing", "💰 Revenue Optimization", "📊 Analytics"])
    
    with tab1:
        st.header("🔍 Search & Analyze Billing Codes")
        
        # Search interface
        col1, col2 = st.columns([3, 1])
        with col1:
            search_query = st.text_input(
                "Enter your search query:",
                placeholder="e.g., chest pain, fracture, emergency assessment",
                help="Use natural language - the system will expand your query with medical terminology"
            )
        with col2:
            search_button = st.button("🔍 Search", type="primary")
        
        if search_button and search_query:
            with st.spinner("Searching with Pinecone and generating LLM response..."):
                # Search for codes
                results = rag_system.search_codes(search_query)
                
                # Generate LLM response
                llm_response = rag_system.generate_llm_response(search_query, results)
                
                # Store results
                st.session_state.search_results = results
                st.session_state.llm_response = llm_response
                st.session_state.current_query = search_query
        
        # Display results
        if 'search_results' in st.session_state and st.session_state.search_results:
            results = st.session_state.search_results
            
            # Show LLM response
            if 'llm_response' in st.session_state:
                st.subheader("🤖 AI Analysis & Recommendations")
                st.markdown(st.session_state.llm_response)
                st.markdown("---")
            
            # Show search results
            if results['total_primary'] > 0 or results['total_add_ons'] > 0:
                # Summary metrics
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Primary Codes", results['total_primary'])
                with col2:
                    st.metric("Add-on Codes", results['total_add_ons'])
                with col3:
                    primary_revenue = sum(code['amount_numeric'] for code in results['primary_codes'])
                    st.metric("Primary Revenue", f"${primary_revenue:.2f}")
                with col4:
                    total_revenue = sum(code['amount_numeric'] for code in results['primary_codes'] + results['add_on_codes'])
                    st.metric("Total Potential", f"${total_revenue:.2f}")
                
                # Primary codes
                if results['primary_codes']:
                    st.subheader("🎯 Primary Codes (Most Relevant)")
                    for i, code in enumerate(results['primary_codes'], 1):
                        with st.expander(f"{i}. {code['code']} - {code['description'][:50]}... - ${code['amount_numeric']:.2f}"):
                            col1, col2, col3 = st.columns(3)
                            with col1:
                                st.write(f"**Code:** {code['code']}")
                                st.write(f"**Type:** {code['code_type']}")
                                st.write(f"**Amount:** {code['amount']}")
                            with col2:
                                st.write(f"**Description:** {code['description']}")
                            with col3:
                                st.write(f"**How to Use:** {code['how_to_use']}")
                                st.write(f"**Similarity:** {code['similarity_score']:.3f}")
                
                # Add-on codes
                if results['add_on_codes']:
                    st.subheader("💰 Add-on Codes (Revenue Boosters)")
                    for i, code in enumerate(results['add_on_codes'], 1):
                        with st.expander(f"{i}. {code['code']} - {code['description'][:50]}... - ${code['amount_numeric']:.2f}"):
                            col1, col2, col3 = st.columns(3)
                            with col1:
                                st.write(f"**Code:** {code['code']}")
                                st.write(f"**Type:** {code['code_type']}")
                                st.write(f"**Amount:** {code['amount']}")
                            with col2:
                                st.write(f"**Description:** {code['description']}")
                            with col3:
                                st.write(f"**How to Use:** {code['how_to_use']}")
                                st.write(f"**Similarity:** {code['similarity_score']:.3f}")
    
    with tab2:
        st.header("🇨🇦 Canadian Billing Recommendations")
        st.markdown("**Following Canadian Medical Billing Hierarchy: G codes (Critical Care) or H codes (Emergency Medicine)**")
        
        # Canadian billing search
        col1, col2 = st.columns([3, 1])
        with col1:
            canadian_query = st.text_input(
                "Enter your medical condition:",
                placeholder="e.g., chest pain, critical care, emergency assessment",
                help="System will suggest exactly 2 primary codes (G or H) plus add-on codes"
            )
        with col2:
            canadian_search_button = st.button("🇨🇦 Get Canadian Billing", type="primary")
        
        if canadian_search_button and canadian_query:
            with st.spinner("Analyzing for Canadian billing structure..."):
                recommendations = rag_system.get_canadian_billing_recommendations(canadian_query)
                
                if 'error' not in recommendations:
                    # Display encounter type
                    encounter_type = recommendations['encounter_type']
                    st.success(f"**Encounter Type:** {encounter_type}")
                    
                    # Primary recommendations (exactly 2)
                    st.subheader("🎯 Primary Codes (Required - Choose 2)")
                    primary_codes = recommendations['primary_recommendations']
                    
                    if primary_codes:
                        for i, code in enumerate(primary_codes, 1):
                            with st.expander(f"{i}. {code['code']} - {code['description'][:50]}... - ${code['amount_numeric']:.2f}"):
                                col1, col2, col3 = st.columns(3)
                                with col1:
                                    st.write(f"**Code:** {code['code']}")
                                    st.write(f"**Type:** {code['code_type']}")
                                    st.write(f"**Amount:** {code['amount']}")
                                with col2:
                                    st.write(f"**Description:** {code['description']}")
                                with col3:
                                    st.write(f"**How to Use:** {code['how_to_use']}")
                                    st.write(f"**Similarity:** {code['similarity_score']:.3f}")
                    else:
                        st.warning("No primary codes found. Try a different search term.")
                    
                    # Add-on codes by category
                    add_on_categories = recommendations['add_on_categories']
                    
                    if any(add_on_categories.values()):
                        st.subheader("💰 Add-on Codes (Optional Revenue Boosters)")
                        
                        # Procedures (Z codes)
                        if add_on_categories['procedures']:
                            st.markdown("#### 🔧 Procedures (Z codes)")
                            for code in add_on_categories['procedures']:
                                st.write(f"• **{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
                        
                        # Assessments (A codes)
                        if add_on_categories['assessments']:
                            st.markdown("#### 🧠 Mental Health Assessments (A codes)")
                            for code in add_on_categories['assessments']:
                                st.write(f"• **{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
                        
                        # Anesthesia (E codes)
                        if add_on_categories['anesthesia']:
                            st.markdown("#### 💉 Anesthesia (E codes)")
                            for code in add_on_categories['anesthesia']:
                                st.write(f"• **{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
                        
                        # Forms (P codes)
                        if add_on_categories['forms']:
                            st.markdown("#### 📝 Forms & Consultations (P codes)")
                            for code in add_on_categories['forms']:
                                st.write(f"• **{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
                    
                    # Revenue optimization tips
                    st.subheader("💡 Revenue Optimization Tips")
                    for tip in recommendations['revenue_optimization']:
                        st.write(tip)
                    
                    # Documentation requirements
                    st.subheader("📋 Documentation Requirements")
                    for tip in recommendations['documentation_requirements']:
                        st.write(tip)
                
                else:
                    st.error(recommendations['error'])
    
    with tab3:
        st.header("💰 Revenue Optimization")
        
        col1, col2 = st.columns(2)
        with col1:
            patient_type = st.selectbox("Patient Type", ["adult", "pediatric", "geriatric"])
            time_of_day = st.selectbox("Time of Day", ["regular", "night", "weekend", "holiday"])
        with col2:
            complexity = st.selectbox("Complexity", ["simple", "moderate", "complex", "critical"])
            procedures = st.multiselect("Procedures", ["surgery", "assessment", "emergency", "fracture", "laceration"])
        
        if st.button("🚀 Generate Optimization Suggestions"):
            with st.spinner("Generating revenue optimization suggestions..."):
                suggestions = rag_system.get_revenue_optimization_suggestions(
                    patient_type, time_of_day, complexity, procedures
                )
                
                st.subheader("💡 Revenue Optimization Suggestions")
                st.markdown(suggestions['suggestions'])
                
                if suggestions['search_results']['primary_codes']:
                    st.subheader("📋 Recommended Codes")
                    for code in suggestions['search_results']['primary_codes'][:5]:
                        st.write(f"• **{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
    
    with tab3:
        st.header("📊 Analytics Dashboard")
        
        # Revenue analysis
        if 'search_results' in st.session_state:
            results = st.session_state.search_results
            
            # Revenue breakdown
            primary_revenue = sum(code['amount_numeric'] for code in results['primary_codes'])
            addon_revenue = sum(code['amount_numeric'] for code in results['add_on_codes'])
            
            # Display revenue metrics
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Primary Revenue", f"${primary_revenue:.2f}")
            with col2:
                st.metric("Add-on Revenue", f"${addon_revenue:.2f}")
            with col3:
                st.metric("Total Revenue", f"${primary_revenue + addon_revenue:.2f}")
            
            if PLOTLY_AVAILABLE:
                # Create charts with Plotly
                fig = go.Figure(data=[
                    go.Bar(name='Primary Codes', x=['Revenue'], y=[primary_revenue]),
                    go.Bar(name='Add-on Codes', x=['Revenue'], y=[addon_revenue])
                ])
                fig.update_layout(title="Revenue Breakdown", barmode='stack')
                st.plotly_chart(fig, use_container_width=True)
                
                # Code type distribution
                code_types = {}
                for code in results['primary_codes'] + results['add_on_codes']:
                    code_type = code['code_type']
                    code_types[code_type] = code_types.get(code_type, 0) + 1
                
                if code_types:
                    fig2 = px.pie(values=list(code_types.values()), names=list(code_types.keys()), 
                                title="Code Type Distribution")
                    st.plotly_chart(fig2, use_container_width=True)
            else:
                # Basic charts without Plotly
                st.subheader("Revenue Breakdown")
                st.bar_chart({
                    'Primary Codes': [primary_revenue],
                    'Add-on Codes': [addon_revenue]
                })
                
                # Code type distribution
                code_types = {}
                for code in results['primary_codes'] + results['add_on_codes']:
                    code_type = code['code_type']
                    code_types[code_type] = code_types.get(code_type, 0) + 1
                
                if code_types:
                    st.subheader("Code Type Distribution")
                    st.bar_chart(code_types)

if __name__ == "__main__":
    main()
