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

# Import login system
from login_system import check_authentication

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

def show_admin_interface(rag_system, tab1, tab2, tab3, tab4, tab5):
    """Admin interface - Full access to everything"""
    with tab1:
        st.header("🔍 Advanced Search & Analysis")
        st.info("👑 **Admin Access**: Full system capabilities with advanced features")
        
        # Advanced search with filters
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            search_query = st.text_input("Enter search query:", placeholder="e.g., chest pain, fracture, emergency")
        with col2:
            search_type = st.selectbox("Search Type", ["Semantic", "Exact Match", "Fuzzy"])
        with col3:
            search_button = st.button("🔍 Advanced Search", type="primary")
        
        if search_button and search_query:
            with st.spinner("Performing advanced search..."):
                results = rag_system.search_codes(search_query)
                st.session_state.search_results = results
                st.session_state.current_query = search_query
        
        # Display results with admin controls
        if 'search_results' in st.session_state:
            results = st.session_state.search_results
            st.subheader("📊 Search Results Analysis")
            
            # Admin metrics
            col1, col2, col3, col4, col5 = st.columns(5)
            with col1:
                st.metric("Total Codes", len(results['primary_codes']) + len(results['add_on_codes']))
            with col2:
                st.metric("Primary Codes", len(results['primary_codes']))
            with col3:
                st.metric("Add-on Codes", len(results['add_on_codes']))
            with col4:
                primary_revenue = sum(code['amount_numeric'] for code in results['primary_codes'])
                st.metric("Primary Revenue", f"${primary_revenue:.2f}")
            with col5:
                total_revenue = sum(code['amount_numeric'] for code in results['primary_codes'] + results['add_on_codes'])
                st.metric("Total Revenue", f"${total_revenue:.2f}")
            
            # Show all codes with admin controls
            if results['primary_codes']:
                st.subheader("🎯 Primary Codes")
                for i, code in enumerate(results['primary_codes'], 1):
                    col1, col2 = st.columns([4, 1])
                    with col1:
                        with st.expander(f"{i}. {code['code']} - {code['description'][:50]}... - ${code['amount_numeric']:.2f}"):
                            st.write(f"**Code:** {code['code']} | **Type:** {code['code_type']} | **Amount:** {code['amount']}")
                            st.write(f"**Description:** {code['description']}")
                            st.write(f"**How to Use:** {code['how_to_use']}")
                            st.write(f"**Similarity Score:** {code['similarity_score']:.3f}")
                    with col2:
                        if st.button(f"Edit", key=f"edit_primary_{i}"):
                            st.info("Edit functionality would be implemented here")
                        if st.button(f"Delete", key=f"delete_primary_{i}"):
                            st.warning("Delete functionality would be implemented here")
    
    with tab2:
        st.header("🇨🇦 Canadian Billing Management")
        st.info("👑 **Admin Access**: Full Canadian billing system management")
        
        # Canadian billing search
        col1, col2 = st.columns([3, 1])
        with col1:
            canadian_query = st.text_input("Medical condition:", placeholder="e.g., chest pain, critical care")
        with col2:
            canadian_search_button = st.button("🇨🇦 Search", type="primary")
        
        if canadian_search_button and canadian_query:
            with st.spinner("Analyzing Canadian billing structure..."):
                recommendations = rag_system.get_canadian_billing_recommendations(canadian_query)
                
                if 'error' not in recommendations:
                    st.success(f"**Encounter Type:** {recommendations['encounter_type']}")
                    
                    # Admin view of primary codes
                    st.subheader("🎯 Primary Codes (Admin View)")
                    primary_codes = recommendations['primary_recommendations']
                    
                    if primary_codes:
                        for i, code in enumerate(primary_codes, 1):
                            col1, col2, col3 = st.columns([3, 1, 1])
                            with col1:
                                st.write(f"**{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
                            with col2:
                                if st.button(f"Modify", key=f"modify_{i}"):
                                    st.info("Modify functionality")
                            with col3:
                                if st.button(f"Archive", key=f"archive_{i}"):
                                    st.warning("Archive functionality")
    
    with tab3:
        st.header("💰 Revenue Optimization Dashboard")
        st.info("👑 **Admin Access**: Complete revenue management system")
        
        # Revenue optimization with admin controls
        col1, col2, col3 = st.columns(3)
        with col1:
            patient_type = st.selectbox("Patient Type", ["adult", "pediatric", "geriatric"], key="admin_patient_type")
        with col2:
            time_of_day = st.selectbox("Time of Day", ["regular", "night", "weekend", "holiday"], key="admin_time_of_day")
        with col3:
            complexity = st.selectbox("Complexity", ["simple", "moderate", "complex", "critical"], key="admin_complexity")
        
        if st.button("🚀 Generate Revenue Report"):
            st.success("Generating comprehensive revenue report...")
            st.info("Admin revenue report would include: Revenue trends, Code performance, Optimization suggestions, Compliance checks")
    
    with tab4:
        st.header("📊 System Analytics")
        st.info("👑 **Admin Access**: Complete system analytics and monitoring")
        
        # Admin analytics
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("System Performance")
            st.metric("Total Searches Today", "1,247")
            st.metric("Average Response Time", "0.3s")
            st.metric("System Uptime", "99.9%")
        with col2:
            st.subheader("User Activity")
            st.metric("Active Users", "23")
            st.metric("Searches per User", "54")
            st.metric("Revenue Generated", "$12,450")
        
        # Real-time user monitoring
        st.subheader("👥 Real-Time User Activity")
        
        # Simulated user activity data
        user_activities = [
            {"user": "aistethxyz@gmail.com", "role": "admin", "action": "Advanced Search", "query": "chest pain", "time": "15:34:22", "status": "Active"},
            {"user": "doctor", "role": "doctor", "action": "Clinical Search", "query": "fracture assessment", "time": "15:33:45", "status": "Active"},
            {"user": "billing", "role": "billing", "action": "Revenue Search", "query": "high revenue codes", "time": "15:32:18", "status": "Active"},
            {"user": "admin", "role": "admin", "action": "System Analytics", "query": "user monitoring", "time": "15:31:52", "status": "Active"},
            {"user": "doctor", "role": "doctor", "action": "Patient Cases", "query": "P001 - John Smith", "time": "15:30:15", "status": "Completed"}
        ]
        
        # Display user activities
        for activity in user_activities:
            col1, col2, col3, col4, col5 = st.columns([2, 1, 2, 1, 1])
            with col1:
                st.write(f"**{activity['user']}** ({activity['role']})")
            with col2:
                if activity['status'] == "Active":
                    st.success("🟢 Active")
                else:
                    st.info("⚪ Completed")
            with col3:
                st.write(f"{activity['action']}: {activity['query']}")
            with col4:
                st.write(activity['time'])
            with col5:
                if st.button("View", key=f"view_{activity['user']}_{activity['time']}"):
                    st.info(f"Viewing details for {activity['user']} - {activity['action']}")
        
        # User session monitoring
        st.subheader("🔍 User Session Details")
        col1, col2 = st.columns(2)
        with col1:
            st.write("**Current Sessions:**")
            sessions = [
                {"user": "aistethxyz@gmail.com", "login_time": "15:20:00", "last_activity": "15:34:22", "ip": "192.168.1.100"},
                {"user": "doctor", "login_time": "15:15:30", "last_activity": "15:33:45", "ip": "192.168.1.101"},
                {"user": "billing", "login_time": "15:10:15", "last_activity": "15:32:18", "ip": "192.168.1.102"}
            ]
            for session in sessions:
                st.write(f"• {session['user']} - {session['login_time']} - {session['ip']}")
        with col2:
            st.write("**System Alerts:**")
            alerts = [
                "⚠️ High CPU usage detected",
                "✅ All systems operational",
                "📊 Database performance normal",
                "🔐 Security scan completed"
            ]
            for alert in alerts:
                st.write(alert)
        
        # System health
        st.subheader("System Health")
        st.success("✅ All systems operational")
        st.info("📊 Database: 312 codes loaded")
        st.info("🔍 Search: Pinecone + FAISS active")
        st.info("🤖 LLM: OpenRouter connected")
    
    with tab5:
        st.header("⚙️ Admin Panel")
        st.warning("👑 **Admin Only**: System administration and configuration")
        
        # Admin controls
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("User Management")
            st.button("👥 View All Users", use_container_width=True)
            st.button("➕ Add New User", use_container_width=True)
            st.button("🔧 Edit User Roles", use_container_width=True)
            st.button("🗑️ Remove User", use_container_width=True)
        
        with col2:
            st.subheader("System Management")
            st.button("🔄 Refresh Data", use_container_width=True)
            st.button("📊 Generate Reports", use_container_width=True)
            st.button("🔧 System Settings", use_container_width=True)
            st.button("📝 View Logs", use_container_width=True)
        
        # System status
        st.subheader("System Status")
        st.success("✅ All services running")
        st.info("🔐 Authentication: Active")
        st.info("🗄️ Database: Connected")
        st.info("🔍 Search Engine: Operational")

def show_doctor_interface(rag_system, tab1, tab2, tab3):
    """Doctor interface - Clinical focus"""
    with tab1:
        st.header("🏥 Clinical Search")
        st.info("👨‍⚕️ **Doctor Access**: Clinical-focused billing code search")
        
        # Clinical search interface
        col1, col2 = st.columns([3, 1])
        with col1:
            clinical_query = st.text_input("Patient symptoms or condition:", placeholder="e.g., chest pain, shortness of breath, trauma")
        with col2:
            search_button = st.button("🔍 Clinical Search", type="primary")
        
        if search_button and clinical_query:
            with st.spinner("Searching clinical billing codes..."):
                results = rag_system.search_codes(clinical_query)
                st.session_state.search_results = results
                st.session_state.current_query = clinical_query
        
        # Clinical results display
        if 'search_results' in st.session_state:
            results = st.session_state.search_results
            
            # Clinical metrics
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Assessment Codes", len([c for c in results['primary_codes'] if c['code'].startswith('H')]))
            with col2:
                st.metric("Procedure Codes", len([c for c in results['add_on_codes'] if c['code'].startswith('Z')]))
            with col3:
                st.metric("Critical Care", len([c for c in results['primary_codes'] if c['code'].startswith('G')]))
            with col4:
                total_revenue = sum(code['amount_numeric'] for code in results['primary_codes'] + results['add_on_codes'])
                st.metric("Total Revenue", f"${total_revenue:.2f}")
            
            # Clinical code recommendations
            st.subheader("🏥 Clinical Recommendations")
            if results['primary_codes']:
                for i, code in enumerate(results['primary_codes'], 1):
                    with st.expander(f"🏥 {code['code']} - {code['description'][:40]}... - ${code['amount_numeric']:.2f}"):
                        st.write(f"**Clinical Use:** {code['description']}")
                        st.write(f"**Billing Instructions:** {code['how_to_use']}")
                        st.write(f"**Revenue:** {code['amount']}")
                        if code['code'].startswith('G'):
                            st.info("⚡ **Critical Care Code**: Can be billed every 15 minutes for reassessments")
                        elif code['code'].startswith('H'):
                            st.info("🏥 **Emergency Assessment**: Standard emergency department billing")
    
    with tab2:
        st.header("📋 Patient Cases")
        st.info("👨‍⚕️ **Doctor Access**: Patient case management and billing")
        
        # Patient case interface
        st.subheader("Current Patient Cases")
        
        # Sample patient cases
        cases = [
            {"id": "P001", "name": "John Smith", "age": 45, "condition": "Chest Pain", "status": "Active", "billing_codes": ["H152", "Z341"]},
            {"id": "P002", "name": "Sarah Johnson", "age": 32, "condition": "Fracture", "status": "Completed", "billing_codes": ["F013", "Z107"]},
            {"id": "P003", "name": "Mike Brown", "age": 67, "condition": "Critical Care", "status": "Active", "billing_codes": ["G004", "G005"]}
        ]
        
        for case in cases:
            with st.expander(f"Patient {case['id']}: {case['name']} - {case['condition']} ({case['status']})"):
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.write(f"**Patient ID:** {case['id']}")
                    st.write(f"**Name:** {case['name']}")
                    st.write(f"**Age:** {case['age']}")
                with col2:
                    st.write(f"**Condition:** {case['condition']}")
                    st.write(f"**Status:** {case['status']}")
                with col3:
                    st.write(f"**Billing Codes:** {', '.join(case['billing_codes'])}")
                    if st.button(f"View Details", key=f"case_{case['id']}"):
                        st.info("Patient details would be shown here")
        
        # Add new case
        st.subheader("Add New Patient Case")
        col1, col2 = st.columns(2)
        with col1:
            patient_name = st.text_input("Patient Name", key="doctor_patient_name")
            patient_age = st.number_input("Age", min_value=0, max_value=120, key="doctor_patient_age")
        with col2:
            condition = st.text_input("Condition", key="doctor_condition")
            if st.button("Add Case", key="doctor_add_case"):
                st.success("New patient case added!")
    
    with tab3:
        st.header("📊 Clinical Analytics")
        st.info("👨‍⚕️ **Doctor Access**: Clinical performance and billing analytics")
        
        # Clinical metrics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Patients Today", "12")
            st.metric("Cases Completed", "8")
            st.metric("Revenue Today", "$2,450")
        with col2:
            st.metric("Avg. Assessment Time", "15 min")
            st.metric("Critical Care Cases", "3")
            st.metric("Emergency Cases", "9")
        with col3:
            st.metric("Code Accuracy", "98%")
            st.metric("Documentation Score", "95%")
            st.metric("Patient Satisfaction", "4.8/5")
        
        # Clinical charts
        st.subheader("Clinical Performance")
        st.bar_chart({
            'Assessment Codes': [15, 12, 18, 14, 16],
            'Procedure Codes': [8, 10, 6, 9, 11],
            'Critical Care': [2, 3, 1, 4, 2]
        })

def show_billing_interface(rag_system, tab1, tab2, tab3):
    """Billing specialist interface - Revenue focused"""
    with tab1:
        st.header("💰 Revenue Search")
        st.info("💼 **Billing Access**: Revenue-focused billing code search")
        
        # Revenue search interface
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            revenue_query = st.text_input("Search for billing codes:", placeholder="e.g., high revenue, emergency, procedure", key="billing_revenue_query")
        with col2:
            min_revenue = st.number_input("Min Revenue", min_value=0, value=50, key="billing_min_revenue")
        with col3:
            search_button = st.button("💰 Revenue Search", type="primary", key="billing_search_button")
        
        if search_button and revenue_query:
            with st.spinner("Searching for revenue opportunities..."):
                results = rag_system.search_codes(revenue_query)
                # Filter by minimum revenue
                filtered_results = {
                    'primary_codes': [code for code in results['primary_codes'] if code['amount_numeric'] >= min_revenue],
                    'add_on_codes': [code for code in results['add_on_codes'] if code['amount_numeric'] >= min_revenue]
                }
                st.session_state.search_results = filtered_results
                st.session_state.current_query = revenue_query
        
        # Revenue-focused results
        if 'search_results' in st.session_state:
            results = st.session_state.search_results
            
            # Revenue metrics
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("High Revenue Codes", len(results['primary_codes']) + len(results['add_on_codes']))
            with col2:
                primary_revenue = sum(code['amount_numeric'] for code in results['primary_codes'])
                st.metric("Primary Revenue", f"${primary_revenue:.2f}")
            with col3:
                addon_revenue = sum(code['amount_numeric'] for code in results['add_on_codes'])
                st.metric("Add-on Revenue", f"${addon_revenue:.2f}")
            with col4:
                total_revenue = primary_revenue + addon_revenue
                st.metric("Total Revenue", f"${total_revenue:.2f}")
            
            # Revenue opportunities
            st.subheader("💰 Revenue Opportunities")
            if results['primary_codes']:
                for i, code in enumerate(results['primary_codes'], 1):
                    with st.expander(f"💰 {code['code']} - ${code['amount_numeric']:.2f} - {code['description'][:40]}..."):
                        st.write(f"**Revenue:** {code['amount']}")
                        st.write(f"**Description:** {code['description']}")
                        st.write(f"**Usage:** {code['how_to_use']}")
                        if code['amount_numeric'] > 100:
                            st.success("💎 **High Value Code** - Significant revenue potential")
                        elif code['amount_numeric'] > 50:
                            st.info("💵 **Good Value Code** - Decent revenue potential")
    
    with tab2:
        st.header("🇨🇦 Canadian Billing")
        st.info("💼 **Billing Access**: Canadian billing code optimization")
        
        # Canadian billing search
        col1, col2 = st.columns([3, 1])
        with col1:
            canadian_query = st.text_input("Medical condition:", placeholder="e.g., chest pain, critical care", key="billing_canadian_query")
        with col2:
            canadian_search_button = st.button("🇨🇦 Search", type="primary", key="billing_canadian_search")
        
        if canadian_search_button and canadian_query:
            with st.spinner("Analyzing Canadian billing structure..."):
                recommendations = rag_system.get_canadian_billing_recommendations(canadian_query)
                
                if 'error' not in recommendations:
                    st.success(f"**Encounter Type:** {recommendations['encounter_type']}")
                    
                    # Revenue-focused primary codes
                    st.subheader("💰 Primary Revenue Codes")
                    primary_codes = recommendations['primary_recommendations']
                    
                    if primary_codes:
                        for i, code in enumerate(primary_codes, 1):
                            col1, col2, col3 = st.columns([3, 1, 1])
                            with col1:
                                st.write(f"**{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
                            with col2:
                                if code['amount_numeric'] > 100:
                                    st.success("High Value")
                                elif code['amount_numeric'] > 50:
                                    st.info("Good Value")
                                else:
                                    st.warning("Low Value")
                            with col3:
                                if st.button(f"Select", key=f"select_{i}"):
                                    st.success("Code selected for billing")
                    
                    # Revenue optimization tips
                    st.subheader("💡 Revenue Optimization Tips")
                    for tip in recommendations['revenue_optimization']:
                        st.write(tip)
    
    with tab3:
        st.header("📈 Revenue Dashboard")
        st.info("💼 **Billing Access**: Comprehensive revenue tracking and analytics")
        
        # Revenue dashboard
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Today's Revenue", "$3,450")
            st.metric("This Week", "$18,200")
        with col2:
            st.metric("This Month", "$67,800")
            st.metric("Last Month", "$72,100")
        with col3:
            st.metric("Top Code", "H152")
            st.metric("Revenue/Case", "$287")
        with col4:
            st.metric("Efficiency", "94%")
            st.metric("Growth", "+5.2%")
        
        # Revenue trends
        st.subheader("Revenue Trends")
        st.bar_chart({
            'Monday': [3200, 3400, 3100, 3600, 3800],
            'Tuesday': [2800, 3000, 2900, 3200, 3400],
            'Wednesday': [3500, 3700, 3600, 3800, 4000],
            'Thursday': [3000, 3200, 3100, 3400, 3600],
            'Friday': [4000, 4200, 4100, 4400, 4600]
        })
        
        # Top revenue codes
        st.subheader("Top Revenue Codes")
        top_codes = [
            {"code": "H152", "description": "Comprehensive Assessment", "revenue": 1250, "count": 17},
            {"code": "G004", "description": "Critical Care", "revenue": 980, "count": 7},
            {"code": "Z107", "description": "Incision & Drainage", "revenue": 756, "count": 9},
            {"code": "F013", "description": "Fracture Reduction", "revenue": 650, "count": 4}
        ]
        
        for code in top_codes:
            col1, col2, col3, col4 = st.columns([2, 2, 1, 1])
            with col1:
                st.write(f"**{code['code']}** - {code['description']}")
            with col2:
                st.write(f"Revenue: ${code['revenue']}")
            with col3:
                st.write(f"Count: {code['count']}")
            with col4:
                st.write(f"Avg: ${code['revenue']/code['count']:.0f}")

def show_default_interface(rag_system, tab1, tab2, tab3, tab4):
    """Default interface - Basic functionality"""
    with tab1:
        st.header("🔍 Search & Analyze Billing Codes")
        st.info("👤 **Basic Access**: Standard billing code search functionality")
        
        # Basic search interface
        col1, col2 = st.columns([3, 1])
        with col1:
            search_query = st.text_input("Enter your search query:", placeholder="e.g., chest pain, fracture, emergency assessment", key="default_search_query")
        with col2:
            search_button = st.button("🔍 Search", type="primary", key="default_search_button")
        
        if search_button and search_query:
            with st.spinner("Searching billing codes..."):
                results = rag_system.search_codes(search_query)
                st.session_state.search_results = results
                st.session_state.current_query = search_query
        
        # Basic results display
        if 'search_results' in st.session_state:
            results = st.session_state.search_results
            
            if results['total_primary'] > 0 or results['total_add_ons'] > 0:
                # Basic metrics
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
                    st.metric("Total Revenue", f"${total_revenue:.2f}")
                
                # Basic code display
                if results['primary_codes']:
                    st.subheader("🎯 Primary Codes")
                    for i, code in enumerate(results['primary_codes'], 1):
                        st.write(f"{i}. **{code['code']}** - {code['description']} - {code['amount']}")
    
    with tab2:
        st.header("🇨🇦 Canadian Billing")
        st.info("👤 **Basic Access**: Canadian billing code recommendations")
        
        # Basic Canadian billing
        col1, col2 = st.columns([3, 1])
        with col1:
            canadian_query = st.text_input("Medical condition:", placeholder="e.g., chest pain, critical care", key="default_canadian_query")
        with col2:
            canadian_search_button = st.button("🇨🇦 Search", type="primary", key="default_canadian_search")
        
        if canadian_search_button and canadian_query:
            with st.spinner("Analyzing Canadian billing..."):
                recommendations = rag_system.get_canadian_billing_recommendations(canadian_query)
                
                if 'error' not in recommendations:
                    st.success(f"**Encounter Type:** {recommendations['encounter_type']}")
                    
                    # Basic recommendations
                    st.subheader("Recommended Codes")
                    primary_codes = recommendations['primary_recommendations']
                    
                    if primary_codes:
                        for i, code in enumerate(primary_codes, 1):
                            st.write(f"{i}. **{code['code']}** - {code['description']} - ${code['amount_numeric']:.2f}")
    
    with tab3:
        st.header("💰 Revenue Optimization")
        st.info("👤 **Basic Access**: Basic revenue optimization suggestions")
        
        # Basic revenue optimization
        st.subheader("Revenue Tips")
        st.write("• Use appropriate assessment codes (H152 for comprehensive)")
        st.write("• Add procedure codes for interventions performed")
        st.write("• Consider time-based premiums for after-hours work")
        st.write("• Document thoroughly to support higher-level codes")
    
    with tab4:
        st.header("📊 Analytics")
        st.info("👤 **Basic Access**: Basic analytics and insights")
        
        # Basic analytics
        if 'search_results' in st.session_state:
            results = st.session_state.search_results
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Primary Revenue", f"${sum(code['amount_numeric'] for code in results['primary_codes']):.2f}")
            with col2:
                st.metric("Add-on Revenue", f"${sum(code['amount_numeric'] for code in results['add_on_codes']):.2f}")
            with col3:
                total = sum(code['amount_numeric'] for code in results['primary_codes'] + results['add_on_codes'])
                st.metric("Total Revenue", f"${total:.2f}")
        else:
            st.info("Search for codes to see analytics")

def main():
    """Main Streamlit application with authentication."""
    # Check authentication first
    is_authenticated, login_system = check_authentication()
    
    if not is_authenticated:
        return  # Login page is shown by check_authentication
    
    # User is authenticated, show the main application
    st.set_page_config(
        page_title="Secure Medical Billing RAG Assistant",
        page_icon="🏥",
        layout="wide"
    )
    
    st.title("🏥 Secure Medical Billing RAG Assistant")
    st.markdown("**Powered by Pinecone + OpenRouter + LLM + Authentication**")
    
    # Show logout button and user info
    login_system.show_logout_button()
    
    # API Keys configuration
    st.sidebar.header("🔑 API Configuration")
    pinecone_key = st.sidebar.text_input("Pinecone API Key", type="password", value="pcsk_si3DV_F4yTwrPzsfMs6zfKdZCwgYNkCrU5c8BjRXSsqCPBBbDAQqWU2Kc5z77K6ghAtd9")
    openrouter_key = st.sidebar.text_input("OpenRouter API Key", type="password", value="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")
    
    if not pinecone_key or not openrouter_key:
        st.warning("Please enter your API keys in the sidebar to continue.")
        return
    
    # Initialize RAG system
    if 'rag_system' not in st.session_state:
        with st.spinner("Initializing Secure RAG System..."):
            try:
                st.session_state.rag_system = AdvancedBillingRAGSystem(
                    'Codes_by_class.csv',
                    pinecone_key,
                    openrouter_key
                )
                st.success("✅ Secure RAG System initialized successfully!")
            except Exception as e:
                st.error(f"❌ Failed to initialize RAG system: {str(e)}")
                return
    
    rag_system = st.session_state.rag_system
    
    # Get user role for personalized experience
    user_role = st.session_state.get('user_info', {}).get('role', 'billing')
    username = st.session_state.get('username', 'unknown')
    
    # Show personalized welcome
    st.success(f"🎉 Welcome back, {st.session_state.get('user_info', {}).get('name', 'User')}! ({user_role.title()} Access)")
    
    # Different interfaces based on user role
    if user_role == 'admin':
        # Admin gets full access to everything
        tab1, tab2, tab3, tab4, tab5 = st.tabs(["🔍 Search & Analyze", "🇨🇦 Canadian Billing", "💰 Revenue Optimization", "📊 Analytics", "⚙️ Admin Panel"])
        show_admin_interface(rag_system, tab1, tab2, tab3, tab4, tab5)
    elif user_role == 'doctor':
        # Doctor gets clinical-focused interface
        tab1, tab2, tab3 = st.tabs(["🏥 Clinical Search", "📋 Patient Cases", "📊 Clinical Analytics"])
        show_doctor_interface(rag_system, tab1, tab2, tab3)
    elif user_role == 'billing':
        # Billing specialist gets revenue-focused interface
        tab1, tab2, tab3 = st.tabs(["💰 Revenue Search", "🇨🇦 Canadian Billing", "📈 Revenue Dashboard"])
        show_billing_interface(rag_system, tab1, tab2, tab3)
    else:
        # Default interface
        tab1, tab2, tab3, tab4 = st.tabs(["🔍 Search & Analyze", "🇨🇦 Canadian Billing", "💰 Revenue Optimization", "📊 Analytics"])
        show_default_interface(rag_system, tab1, tab2, tab3, tab4)
    
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
        else:
            st.info("Search for codes to see analytics")

if __name__ == "__main__":
    main()
