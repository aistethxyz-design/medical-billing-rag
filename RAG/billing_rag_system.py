import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from sentence_transformers import SentenceTransformer
import faiss
import re
from typing import List, Dict, Tuple, Optional
import json
from datetime import datetime, time
import os

class BillingRAGSystem:
    def __init__(self, csv_path: str):
        """Initialize the RAG system with billing codes data."""
        self.csv_path = csv_path
        self.df = None
        self.model = None
        self.index = None
        self.code_embeddings = None
        self.load_data()
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
            self.df['Code'] + ' - ' + 
            self.df['Description'] + ' - ' + 
            self.df['How to Use'].fillna('') + ' - ' +
            self.df['Amount ($CAD)'].fillna('')
        )
        
        # Categorize codes by type
        self.df['Code_Type'] = self.df['Code'].apply(self._categorize_code)
        
    def _categorize_code(self, code: str) -> str:
        """Categorize billing codes by their prefix."""
        if code.startswith('A'):
            return 'Assessment'
        elif code.startswith('H'):
            return 'Emergency Department'
        elif code.startswith('G'):
            return 'Critical Care/Procedures'
        elif code.startswith('K'):
            return 'Consultation/Forms'
        elif code.startswith('E'):
            return 'Anesthesia/Premiums'
        elif code.startswith('B'):
            return 'Telemedicine'
        elif code.startswith('Z'):
            return 'Procedures'
        elif code.startswith('F'):
            return 'Fractures'
        elif code.startswith('D'):
            return 'Dislocations'
        elif code.startswith('R'):
            return 'Specialized Procedures'
        elif code.startswith('M'):
            return 'Major Procedures'
        elif code.startswith('P'):
            return 'Obstetrics'
        else:
            return 'Other'
    
    def setup_embeddings(self):
        """Set up sentence transformer model and create embeddings."""
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create embeddings for all descriptions
        descriptions = self.df['Enhanced_Description'].tolist()
        self.code_embeddings = self.model.encode(descriptions)
        
        # Create FAISS index for fast similarity search
        dimension = self.code_embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        faiss.normalize_L2(self.code_embeddings)
        self.index.add(self.code_embeddings)
    
    def search_codes(self, query: str) -> Dict:
        """Search for relevant billing codes and categorize them."""
        # Expand the query with NLP understanding
        expanded_query = self._expand_query_with_nlp(query)
        
        # Use both original and expanded query for better results
        combined_query = f"{query} {expanded_query}"
        
        query_embedding = self.model.encode([combined_query])
        faiss.normalize_L2(query_embedding)
        
        # Search through all codes to find all relevant ones
        scores, indices = self.index.search(query_embedding, len(self.df))
        
        # Categorize results
        primary_codes = []  # 100% relevant codes
        add_on_codes = []   # Additional codes that can contribute to revenue
        seen_codes = set()  # Track seen codes to avoid duplicates
        
        # Dynamic relevance threshold based on query length and specificity
        if len(query.split()) <= 2:
            min_relevance_threshold = 0.2  # Lower threshold for short queries
        elif len(query.split()) <= 4:
            min_relevance_threshold = 0.15  # Lower threshold for medium queries
        else:
            min_relevance_threshold = 0.1  # Lower threshold for detailed queries
        
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.df):
                row = self.df.iloc[idx]
                code = row['Code']
                
                # Skip if we've already seen this code
                if code in seen_codes:
                    continue
                
                # Skip if similarity score is too low
                if score < min_relevance_threshold:
                    continue
                    
                seen_codes.add(code)
                
                # Get all variations of this code to show time-based pricing
                code_variations = self.df[self.df['Code'] == code]
                time_variations = []
                max_amount = 0
                
                for _, var_row in code_variations.iterrows():
                    if var_row['Amount_Numeric'] > max_amount:
                        max_amount = var_row['Amount_Numeric']
                    
                    # Extract time period from description or amount field
                    time_period = "Regular hours"
                    if "Weekend" in str(var_row['Description']) or "Holiday" in str(var_row['Description']):
                        time_period = "Weekend/Holiday"
                    elif "Night" in str(var_row['Description']):
                        time_period = "Night"
                    elif "evening" in str(var_row['Description']).lower() or "1700" in str(var_row['Description']):
                        time_period = "Evening"
                    
                    time_variations.append({
                        'time': time_period,
                        'amount': var_row['Amount ($CAD)'],
                        'amount_numeric': var_row['Amount_Numeric']
                    })
                
                # Generate relevance explanation
                relevance_explanation = self._generate_relevance_explanation(query, code, row, float(score))
                
                code_info = {
                    'code': code,
                    'description': row['Description'],
                    'how_to_use': row['How to Use'],
                    'amount': row['Amount ($CAD)'],
                    'amount_numeric': max_amount,  # Use highest amount for total calculation
                    'code_type': row['Code_Type'],
                    'similarity_score': float(score),
                    'time_variations': time_variations,
                    'has_time_variations': len(time_variations) > 1,
                    'relevance_explanation': relevance_explanation
                }
                
                # Categorize based on relevance and code type
                if float(score) > 0.6 or code.startswith(('H', 'A')):  # High relevance or assessment codes
                    primary_codes.append(code_info)
                else:
                    add_on_codes.append(code_info)
        
        # Sort by relevance within each category
        primary_codes.sort(key=lambda x: x['similarity_score'], reverse=True)
        add_on_codes.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return {
            'primary_codes': primary_codes,
            'add_on_codes': add_on_codes,
            'total_primary': len(primary_codes),
            'total_add_ons': len(add_on_codes),
            'expanded_query': expanded_query
        }
    
    def _generate_relevance_explanation(self, query: str, code: str, row: pd.Series, similarity_score: float) -> str:
        """Generate an explanation for why this code is relevant to the search query."""
        
        # Extract key terms from query
        query_lower = query.lower()
        query_terms = set(query_lower.split())
        
        # Extract key terms from code description
        description_lower = row['Description'].lower()
        how_to_use_lower = str(row['How to Use']).lower()
        
        # Find matching terms
        matching_terms = []
        medical_terms = {
            'chest': ['chest', 'thoracic', 'cardiac', 'heart', 'lung'],
            'pain': ['pain', 'ache', 'discomfort', 'sore'],
            'assessment': ['assessment', 'evaluation', 'examination', 'consultation'],
            'fracture': ['fracture', 'break', 'bone', 'injury'],
            'laceration': ['laceration', 'cut', 'wound', 'repair'],
            'emergency': ['emergency', 'urgent', 'acute', 'critical'],
            'anesthesia': ['anesthesia', 'sedation', 'numbing'],
            'procedure': ['procedure', 'surgery', 'operation', 'intervention']
        }
        
        # Check for medical term matches
        for category, terms in medical_terms.items():
            if any(term in query_lower for term in terms):
                if any(term in description_lower or term in how_to_use_lower for term in terms):
                    matching_terms.append(category)
        
        # Generate explanation based on matches and similarity
        explanations = []
        
        # High similarity explanation
        if similarity_score > 0.7:
            explanations.append("🎯 **High Relevance**: This code closely matches your search terms")
        elif similarity_score > 0.5:
            explanations.append("✅ **Good Match**: This code is relevant to your search")
        else:
            explanations.append("📋 **Related**: This code is somewhat related to your search")
        
        # Specific term matches
        if matching_terms:
            explanations.append(f"🔍 **Key Matches**: Found relevant terms: {', '.join(matching_terms)}")
        
        # Code type relevance
        code_type_explanations = {
            'Assessment': "📊 **Assessment Code**: Used for patient evaluations and examinations",
            'Emergency Department': "🚨 **ER Code**: Specifically for emergency department visits",
            'Critical Care/Procedures': "⚡ **Critical Care**: For life-threatening conditions requiring immediate intervention",
            'Procedures': "🔧 **Procedure Code**: For surgical or medical procedures",
            'Fractures': "🦴 **Fracture Management**: For bone injury treatment",
            'Dislocations': "🦾 **Joint Care**: For joint dislocation treatments",
            'Anesthesia/Premiums': "💉 **Anesthesia**: For sedation and pain management",
            'Consultation/Forms': "📋 **Documentation**: For consultations and administrative tasks"
        }
        
        if row['Code_Type'] in code_type_explanations:
            explanations.append(code_type_explanations[row['Code_Type']])
        
        # Time-based relevance
        if row['Code_Type'] == 'Emergency Department':
            explanations.append("⏰ **Time-Sensitive**: ER codes have different rates based on time of day")
        
        # Revenue potential
        if row['Amount_Numeric'] > 100:
            explanations.append("💰 **High Value**: This code has significant revenue potential")
        elif row['Amount_Numeric'] > 50:
            explanations.append("💵 **Good Value**: This code offers decent revenue")
        
        # Usage context
        if 'emergency' in query_lower and 'H' in code:
            explanations.append("🏥 **ER Context**: Perfect for emergency department billing")
        elif 'procedure' in query_lower and code.startswith('Z'):
            explanations.append("🔬 **Procedure Context**: Ideal for surgical or medical procedures")
        elif 'assessment' in query_lower and code.startswith('A'):
            explanations.append("📝 **Assessment Context**: Suitable for patient assessments")
        
        return " | ".join(explanations)
    
    def get_revenue_optimization_suggestions(self, 
                                           patient_type: str = "adult",
                                           time_of_day: str = "regular",
                                           complexity: str = "moderate",
                                           procedures: List[str] = None) -> Dict:
        """Generate revenue optimization suggestions based on patient context."""
        
        suggestions = {
            'primary_codes': [],
            'add_on_codes': [],
            'premium_codes': [],
            'total_estimated_revenue': 0,
            'optimization_tips': []
        }
        
        # Base assessment codes based on time and complexity
        if time_of_day == "weekend" or time_of_day == "holiday":
            if complexity == "minor":
                base_code = "H151"
            elif complexity == "moderate":
                base_code = "H152"
            else:
                base_code = "H153"
        elif time_of_day == "evening":
            if complexity == "minor":
                base_code = "H131"
            elif complexity == "moderate":
                base_code = "H132"
            else:
                base_code = "H133"
        else:  # regular hours
            if complexity == "minor":
                base_code = "H101"
            elif complexity == "moderate":
                base_code = "H102"
            else:
                base_code = "H103"
        
        # Add base assessment
        base_row = self.df[self.df['Code'] == base_code]
        if not base_row.empty:
            suggestions['primary_codes'].append({
                'code': base_code,
                'description': base_row.iloc[0]['Description'],
                'amount': base_row.iloc[0]['Amount ($CAD)'],
                'reason': f"Base assessment for {complexity} complexity during {time_of_day}"
            })
            suggestions['total_estimated_revenue'] += base_row.iloc[0]['Amount_Numeric']
        
        # Add time-based premiums
        if time_of_day in ["evening", "weekend", "holiday"]:
            premium_codes = self.df[self.df['Code'].str.contains('E412|E413', na=False)]
            for _, row in premium_codes.iterrows():
                suggestions['premium_codes'].append({
                    'code': row['Code'],
                    'description': row['Description'],
                    'amount': row['Amount ($CAD)'],
                    'reason': f"After hours premium for {time_of_day}"
                })
        
        # Add procedure-specific codes
        if procedures:
            for procedure in procedures:
                proc_codes = self.search_codes(procedure, top_k=3)
                for code_info in proc_codes:
                    if code_info['amount_numeric'] > 0:
                        suggestions['add_on_codes'].append({
                            'code': code_info['code'],
                            'description': code_info['description'],
                            'amount': code_info['amount'],
                            'reason': f"Procedure: {procedure}"
                        })
                        suggestions['total_estimated_revenue'] += code_info['amount_numeric']
        
        # Add optimization tips
        suggestions['optimization_tips'] = [
            "Always bill the highest appropriate assessment level",
            "Include all applicable add-on procedures",
            "Use time-based premiums when applicable",
            "Consider special visit premiums for after-hours calls",
            "Document thoroughly to support higher-level codes"
        ]
        
        return suggestions
    
    def get_code_combinations(self, base_code: str) -> List[Dict]:
        """Get compatible add-on codes for a base code."""
        base_row = self.df[self.df['Code'] == base_code]
        if base_row.empty:
            return []
        
        # Find compatible add-on codes
        compatible_codes = []
        
        # Look for add-on codes that can be billed with the base code
        add_on_codes = self.df[
            (self.df['Code_Type'].isin(['Procedures', 'Critical Care/Procedures'])) &
            (self.df['Amount_Numeric'] > 0)
        ]
        
        for _, row in add_on_codes.head(10).iterrows():
            compatible_codes.append({
                'code': row['Code'],
                'description': row['Description'],
                'amount': row['Amount ($CAD)'],
                'compatibility': 'High' if row['Code_Type'] == 'Procedures' else 'Medium'
            })
        
        return compatible_codes
    
    def analyze_revenue_patterns(self) -> Dict:
        """Analyze revenue patterns across different code types."""
        analysis = {}
        
        # Revenue by code type
        type_revenue = self.df.groupby('Code_Type')['Amount_Numeric'].agg(['sum', 'mean', 'count']).round(2)
        analysis['revenue_by_type'] = type_revenue.to_dict('index')
        
        # Top revenue codes
        top_codes = self.df.nlargest(10, 'Amount_Numeric')[['Code', 'Description', 'Amount_Numeric']]
        analysis['top_revenue_codes'] = top_codes.to_dict('records')
        
        # Code frequency analysis
        code_counts = self.df['Code_Type'].value_counts()
        analysis['code_frequency'] = code_counts.to_dict()
        
        return analysis
    
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
            'sprain': 'sprain treatment dislocation',
            'dislocation': 'dislocation reduction',
            
            # General terms to specific procedures
            'surgery': 'surgical procedure operation',
            'operation': 'surgical procedure operation',
            'procedure': 'medical procedure intervention',
            'treatment': 'medical treatment intervention',
            'examination': 'assessment evaluation examination',
            'checkup': 'assessment evaluation examination',
            'consultation': 'consultation assessment evaluation',
            
            # Emergency terms
            'emergency': 'emergency department urgent critical',
            'urgent': 'emergency department urgent critical',
            'critical': 'critical care emergency urgent',
            'trauma': 'trauma critical care emergency',
            'accident': 'trauma emergency critical care',
            
            # Anesthesia terms
            'anesthesia': 'anesthesia sedation pain management',
            'sedation': 'anesthesia sedation pain management',
            'numbing': 'anesthesia local anesthesia',
            
            # Time-based terms
            'night': 'night shift after hours',
            'weekend': 'weekend holiday after hours',
            'after hours': 'after hours evening night weekend',
            'evening': 'evening after hours',
            
            # Patient types
            'child': 'pediatric child infant',
            'baby': 'pediatric infant newborn',
            'elderly': 'geriatric elderly senior',
            'adult': 'adult patient',
            
            # Body parts
            'heart': 'cardiac heart cardiovascular',
            'lung': 'pulmonary lung respiratory',
            'brain': 'neurological brain head',
            'spine': 'spinal vertebral back',
            'knee': 'knee joint orthopedic',
            'shoulder': 'shoulder joint orthopedic',
            'wrist': 'wrist joint orthopedic',
            'ankle': 'ankle joint orthopedic',
            
            # Medical abbreviations
            'mi': 'myocardial infarction heart attack cardiac',
            'cva': 'cerebrovascular accident stroke neurological',
            'copd': 'chronic obstructive pulmonary disease lung respiratory',
            'chf': 'congestive heart failure cardiac heart',
            'dm': 'diabetes mellitus diabetic',
            'htn': 'hypertension blood pressure cardiac',
            
            # Common medical terms
            'heart attack': 'myocardial infarction cardiac emergency',
            'stroke': 'cerebrovascular accident neurological emergency',
            'seizure': 'seizure neurological emergency',
            'allergic reaction': 'allergic reaction anaphylaxis emergency',
            'shock': 'shock critical care emergency',
            'bleeding': 'hemorrhage bleeding emergency',
            'unconscious': 'unconscious emergency critical care',
            'respiratory distress': 'respiratory distress breathing emergency'
        }
        
        # Expand the query - check for multi-word phrases first
        expanded_terms = []
        remaining_query = query_lower
        
        # Check for multi-word phrases first (longer phrases take priority)
        for phrase, expansion in sorted(medical_expansions.items(), key=lambda x: len(x[0]), reverse=True):
            if phrase in remaining_query:
                expanded_terms.append(expansion)
                remaining_query = remaining_query.replace(phrase, '').strip()
        
        # Then check individual terms
        for term in remaining_query.split():
            if term in medical_expansions:
                expanded_terms.append(medical_expansions[term])
            else:
                # Check for partial matches
                for key, expansion in medical_expansions.items():
                    if term in key or key in term:
                        expanded_terms.append(expansion)
                        break
                else:
                    # Keep original term if no expansion found
                    expanded_terms.append(term)
        
        # Combine all terms and remove duplicates
        expanded_query = ' '.join(expanded_terms)
        # Remove duplicate words while preserving order
        words = expanded_query.split()
        seen = set()
        unique_words = []
        for word in words:
            if word not in seen:
                seen.add(word)
                unique_words.append(word)
        expanded_query = ' '.join(unique_words)
        
        # Add common medical procedure suffixes if not present
        if not any(suffix in expanded_query for suffix in ['assessment', 'evaluation', 'examination', 'procedure', 'treatment']):
            if any(symptom in expanded_query for symptom in ['pain', 'ache', 'discomfort']):
                expanded_query += ' assessment evaluation examination'
            elif any(injury in expanded_query for injury in ['fracture', 'break', 'cut', 'wound', 'laceration']):
                expanded_query += ' repair treatment procedure'
        
        return expanded_query

def main():
    st.set_page_config(
        page_title="Medical Billing RAG Assistant",
        page_icon="💰",
        layout="wide"
    )
    
    st.title("💰 Medical Billing Revenue Optimization Assistant")
    st.markdown("**AI-powered billing code search and revenue optimization for medical professionals**")
    
    # Initialize the RAG system
    if 'rag_system' not in st.session_state:
        with st.spinner("Loading billing codes database..."):
            st.session_state.rag_system = BillingRAGSystem("Codes by class.csv")
    
    rag_system = st.session_state.rag_system
    
    # Sidebar for navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.selectbox(
        "Choose a page",
        ["🔍 Code Search", "💰 Revenue Optimizer", "📊 Analytics", "❓ Help"]
    )
    
    if page == "🔍 Code Search":
        st.header("🔍 Billing Code Search")
        
        # Search interface
        col1, col2 = st.columns([4, 1])
        
        with col1:
            search_query = st.text_input(
                "Search for billing codes",
                placeholder="e.g., 'chest pain assessment', 'fracture reduction', 'anesthesia'",
                key="search_input"
            )
        
        with col2:
            search_button = st.button("🔍 Search", type="primary", use_container_width=True)
        
        if not search_button and not search_query:
            st.info("💡 **Enter a search term and click 'Search' to find relevant billing codes**")
            st.markdown("""
            **Example searches (NLP-powered):**
            - "chest pain" → automatically expands to "chest pain assessment evaluation"
            - "broken bone" → expands to "fracture reduction repair"
            - "cut" → expands to "laceration repair suture"
            - "emergency" → expands to "emergency department urgent critical"
            - "heart attack" → expands to "myocardial infarction cardiac emergency"
            - "anesthesia" → expands to "anesthesia sedation pain management"
            """)
        
        if search_button and search_query:
            with st.spinner("Searching billing codes..."):
                results = rag_system.search_codes(search_query)
                # Store results in session state to prevent rerun on checkbox changes
                st.session_state.search_results = results
                st.session_state.current_query = search_query
        
        # Use stored results if available
        if 'search_results' in st.session_state and st.session_state.search_results:
            results = st.session_state.search_results
            
            # Add a "New Search" button
            col1, col2, col3 = st.columns([1, 1, 4])
            with col1:
                if st.button("🔄 New Search"):
                    # Clear stored results to start fresh
                    if 'search_results' in st.session_state:
                        del st.session_state.search_results
                    if 'addon_selections' in st.session_state:
                        del st.session_state.addon_selections
                    st.rerun()
            
            if results['total_primary'] > 0 or results['total_add_ons'] > 0:
                # Show query expansion
                current_query = st.session_state.get('current_query', search_query)
                if results['expanded_query'] != current_query.lower():
                    st.info(f"🔍 **Query Expanded:** '{current_query}' → '{results['expanded_query']}'")
                
                # Calculate revenue for primary codes
                primary_revenue = sum(code['amount_numeric'] for code in results['primary_codes'] if code['amount_numeric'] > 0)
                addon_revenue = sum(code['amount_numeric'] for code in results['add_on_codes'] if code['amount_numeric'] > 0)
                total_potential_revenue = primary_revenue + addon_revenue
                
                # Summary metrics
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Primary Codes", results['total_primary'])
                with col2:
                    st.metric("Add-on Codes", results['total_add_ons'])
                with col3:
                    st.metric("Primary Revenue", f"${primary_revenue:.2f}")
                with col4:
                    st.metric("Total Potential", f"${total_potential_revenue:.2f}")
                
                # Initialize session state for selected add-ons
                if 'selected_addons' not in st.session_state:
                    st.session_state.selected_addons = []
                
                # 1. PRIMARY CODES (100% Relevant)
                if results['primary_codes']:
                    st.subheader("🎯 Primary Codes (100% Relevant)")
                    st.info("These are the most relevant codes for your search. These should be your main billing codes.")
                    
                    for i, code in enumerate(results['primary_codes'], 1):
                        with st.expander(f"{i}. {code['code']} - {code['description'][:50]}... - ${code['amount_numeric']:.2f} 🎯"):
                            col1, col2, col3 = st.columns(3)
                            
                            with col1:
                                st.write(f"**Code:** {code['code']}")
                                st.write(f"**Type:** {code['code_type']}")
                                st.write(f"**Amount:** {code['amount']}")
                                if code['amount_numeric'] > 0:
                                    st.success(f"**Revenue:** ${code['amount_numeric']:.2f}")
                                else:
                                    st.warning("**Revenue:** Complex pricing")
                            
                            with col2:
                                st.write(f"**Description:** {code['description']}")
                                if code['has_time_variations']:
                                    st.write("**Time-based Pricing:**")
                                    for var in code['time_variations']:
                                        if var['amount_numeric'] > 0:
                                            st.write(f"• {var['time']}: {var['amount']}")
                            
                            with col3:
                                st.write(f"**How to Use:** {code['how_to_use']}")
                                st.write(f"**Similarity:** {code['similarity_score']:.2f}")
                                st.info(code['relevance_explanation'])
                
                # 2. ADD-ON CODES (Revenue Boosters)
                if results['add_on_codes']:
                    st.subheader("💰 Add-on Codes (Revenue Boosters)")
                    st.info("These codes can be added to increase your total revenue. Select the ones that apply to your case.")
                    
                    # Add-on selection interface
                    selected_addons = []
                    total_addon_revenue = 0
                    
                    # Initialize session state for add-on selections
                    if 'addon_selections' not in st.session_state:
                        st.session_state.addon_selections = {}
                    
                    for i, code in enumerate(results['add_on_codes'], 1):
                        col1, col2 = st.columns([1, 4])
                        
                        with col1:
                            # Use session state to track selections
                            checkbox_key = f"addon_{code['code']}"
                            is_selected = st.checkbox(
                                f"${code['amount_numeric']:.2f}",
                                key=checkbox_key,
                                help=f"Add {code['code']} to your billing",
                                value=st.session_state.addon_selections.get(checkbox_key, False)
                            )
                            
                            # Update session state
                            st.session_state.addon_selections[checkbox_key] = is_selected
                            
                            if is_selected:
                                selected_addons.append(code)
                                total_addon_revenue += code['amount_numeric']
                        
                        with col2:
                            with st.expander(f"{i}. {code['code']} - {code['description'][:60]}... - {code['amount']}"):
                                col_a, col_b, col_c = st.columns(3)
                                
                                with col_a:
                                    st.write(f"**Code:** {code['code']}")
                                    st.write(f"**Type:** {code['code_type']}")
                                    st.write(f"**Amount:** {code['amount']}")
                                    if code['amount_numeric'] > 0:
                                        st.success(f"**Revenue:** ${code['amount_numeric']:.2f}")
                                    else:
                                        st.warning("**Revenue:** Complex pricing")
                                
                                with col_b:
                                    st.write(f"**Description:** {code['description']}")
                                    if code['has_time_variations']:
                                        st.write("**Time-based Pricing:**")
                                        for var in code['time_variations']:
                                            if var['amount_numeric'] > 0:
                                                st.write(f"• {var['time']}: {var['amount']}")
                                
                                with col_c:
                                    st.write(f"**How to Use:** {code['how_to_use']}")
                                    st.write(f"**Similarity:** {code['similarity_score']:.2f}")
                                    st.info(code['relevance_explanation'])
                    
                    # Add clear selections button
                    col1, col2, col3 = st.columns([1, 1, 2])
                    with col1:
                        if st.button("🗑️ Clear All Selections"):
                            st.session_state.addon_selections = {}
                    with col2:
                        if st.button("✅ Select All"):
                            for code in results['add_on_codes']:
                                checkbox_key = f"addon_{code['code']}"
                                st.session_state.addon_selections[checkbox_key] = True
                    
                    # Revenue calculation with selected add-ons
                    st.subheader("💵 Revenue Calculation")
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.metric("Primary Revenue", f"${primary_revenue:.2f}")
                    with col2:
                        st.metric("Selected Add-ons", f"${total_addon_revenue:.2f}")
                    with col3:
                        st.metric("Total Revenue", f"${primary_revenue + total_addon_revenue:.2f}")
                    
                    if selected_addons:
                        # Show selected add-ons summary
                        st.success(f"✅ **Selected {len(selected_addons)} add-on codes** contributing ${total_addon_revenue:.2f} to your total revenue")
                        
                        # Show selected codes
                        with st.expander("📋 Selected Add-on Codes"):
                            for code in selected_addons:
                                st.write(f"• **{code['code']}** - {code['description']} - {code['amount']}")
                    else:
                        st.info("💡 Select add-on codes above to see your total revenue calculation")
                
                # 3. REVENUE OPTIMIZATION TIPS
                st.subheader("💡 Revenue Optimization Tips")
                tips = [
                    "Always bill the highest appropriate assessment level (H102, H152, H153)",
                    "Include all applicable add-on procedures to maximize revenue",
                    "Use time-based premiums for after-hours work (E412, E413)",
                    "Consider special visit premiums for call-ins (H960-H989)",
                    "Document thoroughly to support higher-level codes",
                    "Check for trauma premiums on G-codes when ISS > 15"
                ]
                
                for tip in tips:
                    st.write(f"• {tip}")
            else:
                st.warning("No codes found matching your search.")
                st.info("💡 **Try these tips to get better results:**")
                st.markdown("""
                - Use more specific medical terms (e.g., "chest pain assessment" instead of "pain")
                - Try different keywords (e.g., "fracture reduction" instead of "broken bone")
                - Use procedure names (e.g., "laceration repair" instead of "cut")
                - Try broader terms if too specific (e.g., "emergency" instead of "cardiac emergency")
                """)
    
    elif page == "💰 Revenue Optimizer":
        st.header("💰 Revenue Optimization Assistant")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Patient Context")
            patient_type = st.selectbox("Patient Type", ["adult", "pediatric", "geriatric"])
            time_of_day = st.selectbox("Time of Day", ["regular", "evening", "weekend", "holiday", "night"])
            complexity = st.selectbox("Case Complexity", ["minor", "moderate", "high"])
            
            procedures = st.multiselect(
                "Procedures Performed",
                options=[
                    "fracture reduction", "laceration repair", "intubation", 
                    "chest tube", "cardioversion", "nerve block", "ultrasound",
                    "foreign body removal", "incision drainage"
                ]
            )
        
        with col2:
            st.subheader("Optimization Settings")
            include_premiums = st.checkbox("Include Time-based Premiums", value=True)
            max_add_ons = st.slider("Maximum Add-on Codes", 1, 10, 5)
        
        if st.button("Generate Revenue Optimization", type="primary"):
            with st.spinner("Analyzing optimal billing strategy..."):
                suggestions = rag_system.get_revenue_optimization_suggestions(
                    patient_type=patient_type,
                    time_of_day=time_of_day,
                    complexity=complexity,
                    procedures=procedures
                )
            
            # Display results
            st.subheader("🎯 Revenue Optimization Strategy")
            
            # Calculate detailed revenue breakdown
            primary_revenue = sum(code.get('amount_numeric', 0) for code in suggestions['primary_codes'])
            addon_revenue = sum(code.get('amount_numeric', 0) for code in suggestions['add_on_codes'])
            premium_revenue = sum(code.get('amount_numeric', 0) for code in suggestions['premium_codes'])
            
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Primary Codes", len(suggestions['primary_codes']))
                st.caption(f"Revenue: ${primary_revenue:.2f}")
            with col2:
                st.metric("Add-on Codes", len(suggestions['add_on_codes']))
                st.caption(f"Revenue: ${addon_revenue:.2f}")
            with col3:
                st.metric("Premium Codes", len(suggestions['premium_codes']))
                st.caption(f"Revenue: ${premium_revenue:.2f}")
            with col4:
                st.metric("Total Revenue", f"${suggestions['total_estimated_revenue']:.2f}")
                st.caption("All codes combined")
            
            # Revenue breakdown chart
            if suggestions['total_estimated_revenue'] > 0:
                st.subheader("📊 Revenue Breakdown")
                revenue_data = {
                    'Primary Codes': primary_revenue,
                    'Add-on Codes': addon_revenue,
                    'Premium Codes': premium_revenue
                }
                
                fig = px.pie(
                    values=list(revenue_data.values()),
                    names=list(revenue_data.keys()),
                    title="Revenue Distribution",
                    color_discrete_sequence=px.colors.qualitative.Set2
                )
                st.plotly_chart(fig, use_container_width=True)
            
            # Primary codes
            if suggestions['primary_codes']:
                st.subheader("📋 Primary Assessment Codes")
                for code in suggestions['primary_codes']:
                    st.info(f"**{code['code']}** - {code['description']} - {code['amount']} - *{code['reason']}*")
            
            # Add-on codes
            if suggestions['add_on_codes']:
                st.subheader("🔧 Add-on Procedure Codes")
                for code in suggestions['add_on_codes'][:max_add_ons]:
                    st.success(f"**{code['code']}** - {code['description']} - {code['amount']} - *{code['reason']}*")
            
            # Premium codes
            if suggestions['premium_codes']:
                st.subheader("⭐ Premium Codes")
                for code in suggestions['premium_codes']:
                    st.warning(f"**{code['code']}** - {code['description']} - {code['amount']} - *{code['reason']}*")
            
            # Optimization tips
            st.subheader("💡 Optimization Tips")
            for tip in suggestions['optimization_tips']:
                st.write(f"• {tip}")
    
    elif page == "📊 Analytics":
        st.header("📊 Revenue Analytics & Cost Analysis")
        
        with st.spinner("Analyzing billing patterns..."):
            analysis = rag_system.analyze_revenue_patterns()
        
        # Summary metrics
        st.subheader("📈 Revenue Overview")
        col1, col2, col3, col4 = st.columns(4)
        
        total_revenue = sum(data['sum'] for data in analysis['revenue_by_type'].values())
        avg_revenue = sum(data['mean'] for data in analysis['revenue_by_type'].values()) / len(analysis['revenue_by_type'])
        total_codes = sum(data['count'] for data in analysis['revenue_by_type'].values())
        high_value_codes = len([code for code in analysis['top_revenue_codes'] if code['Amount_Numeric'] > 100])
        
        with col1:
            st.metric("Total Revenue Potential", f"${total_revenue:,.2f}")
        with col2:
            st.metric("Average Revenue per Code", f"${avg_revenue:.2f}")
        with col3:
            st.metric("Total Codes Available", f"{total_codes:,}")
        with col4:
            st.metric("High-Value Codes (>$100)", f"{high_value_codes}")
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("💰 Revenue by Code Type")
            type_data = analysis['revenue_by_type']
            
            # Create bar chart with better formatting
            fig = px.bar(
                x=list(type_data.keys()),
                y=[data['sum'] for data in type_data.values()],
                title="Total Revenue by Code Type",
                labels={'x': 'Code Type', 'y': 'Total Revenue ($CAD)'},
                color=[data['sum'] for data in type_data.values()],
                color_continuous_scale='Viridis'
            )
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.subheader("📊 Code Distribution")
            freq_data = analysis['code_frequency']
            
            fig = px.pie(
                values=list(freq_data.values()),
                names=list(freq_data.keys()),
                title="Distribution of Code Types",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Revenue analysis by code type
        st.subheader("💵 Detailed Revenue Analysis")
        type_analysis = []
        for code_type, data in analysis['revenue_by_type'].items():
            type_analysis.append({
                'Code Type': code_type,
                'Total Revenue': f"${data['sum']:,.2f}",
                'Average Revenue': f"${data['mean']:.2f}",
                'Code Count': data['count'],
                'Revenue per Code': f"${data['sum']/data['count']:.2f}" if data['count'] > 0 else "$0.00"
            })
        
        df_analysis = pd.DataFrame(type_analysis)
        st.dataframe(df_analysis, use_container_width=True)
        
        # Top revenue codes with better formatting
        st.subheader("🏆 Top Revenue Codes")
        top_codes = analysis['top_revenue_codes']
        
        if top_codes:
            df_top = pd.DataFrame(top_codes)
            df_top['Amount_Numeric'] = df_top['Amount_Numeric'].round(2)
            df_top = df_top.rename(columns={
                'Code': 'Billing Code',
                'Description': 'Description',
                'Amount_Numeric': 'Revenue ($CAD)'
            })
            
            # Add ranking
            df_top['Rank'] = range(1, len(df_top) + 1)
            df_top = df_top[['Rank', 'Billing Code', 'Description', 'Revenue ($CAD)']]
            
            st.dataframe(df_top, use_container_width=True)
            
            # Create a bar chart of top codes
            fig = px.bar(
                df_top.head(10),
                x='Billing Code',
                y='Revenue ($CAD)',
                title="Top 10 Highest Revenue Codes",
                color='Revenue ($CAD)',
                color_continuous_scale='Blues'
            )
            fig.update_layout(xaxis_tickangle=-45)
            st.plotly_chart(fig, use_container_width=True)
        
        # Revenue optimization insights
        st.subheader("💡 Revenue Optimization Insights")
        
        insights = []
        for code_type, data in analysis['revenue_by_type'].items():
            if data['count'] > 0:
                avg_rev = data['sum'] / data['count']
                if avg_rev > 100:
                    insights.append(f"🎯 **{code_type}** codes have high average revenue (${avg_rev:.2f}) - focus on these!")
                elif avg_rev > 50:
                    insights.append(f"✅ **{code_type}** codes have good average revenue (${avg_rev:.2f})")
                else:
                    insights.append(f"⚠️ **{code_type}** codes have lower average revenue (${avg_rev:.2f}) - consider add-ons")
        
        for insight in insights:
            st.write(insight)
    
    elif page == "❓ Help":
        st.header("❓ Help & Documentation")
        
        st.subheader("How to Use This Tool")
        
        st.markdown("""
        ### 🔍 Code Search
        - Enter descriptive terms to find relevant billing codes
        - Use medical terminology for better results
        - Results are ranked by relevance to your query
        
        ### 💰 Revenue Optimizer
        - Select patient context and case complexity
        - Add procedures performed during the visit
        - Get AI-powered suggestions for maximum revenue
        
        ### 📊 Analytics
        - View revenue patterns across different code types
        - Identify high-value billing opportunities
        - Understand code distribution and frequency
        
        ### Tips for Maximum Revenue
        1. **Always bill the highest appropriate assessment level**
        2. **Include all applicable add-on procedures**
        3. **Use time-based premiums when applicable**
        4. **Document thoroughly to support higher-level codes**
        5. **Consider special visit premiums for after-hours calls**
        """)
        
        st.subheader("💰 Revenue Calculation Methodology")
        
        st.markdown("""
        **How Revenue is Calculated:**
        
        1. **Base Amounts**: Each billing code has a base amount in Canadian dollars (CAD)
        2. **Time Variations**: Some codes have different rates for different times:
           - Regular hours (Mon-Fri 8AM-5PM)
           - Evening (Mon-Fri 5PM-12AM) 
           - Weekend/Holiday (Sat-Sun, holidays)
           - Night (12AM-8AM)
        
        3. **Total Revenue Calculation**: 
           - For codes with time variations, we use the **highest amount** to show maximum earning potential
           - This prevents double-counting while showing the best-case scenario
           - Example: H152 shows $73.90 (night rate) instead of counting both $63.30 (weekend) and $73.90 (night)
        
        4. **Complex Pricing**: Some codes have percentage bonuses or per-unit pricing:
           - These show as "Complex pricing" and aren't included in totals
           - Examples: E412 (20% bonus), K101 (per quarter hour)
        """)
        
        st.subheader("Code Categories")
        
        categories = {
            "A": "General Assessments",
            "H": "Emergency Department Codes",
            "G": "Critical Care & Procedures",
            "K": "Consultations & Forms",
            "E": "Anesthesia & Premiums",
            "B": "Telemedicine",
            "Z": "Procedures",
            "F": "Fractures",
            "D": "Dislocations",
            "R": "Specialized Procedures"
        }
        
        for prefix, description in categories.items():
            st.write(f"**{prefix}**: {description}")

if __name__ == "__main__":
    main()
