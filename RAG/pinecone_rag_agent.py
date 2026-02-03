import os
import time
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv("rag_secrets.env") # Fallback or override

class PineconeBillingRagAgent:
    def __init__(self, 
                 pinecone_api_key: Optional[str] = None, 
                 anthropic_api_key: Optional[str] = None,
                 index_name: str = "medical-billing-rag",
                 dimension: int = 384): # Default to 384 for all-MiniLM-L6-v2
        
        self.pinecone_api_key = pinecone_api_key or os.getenv("PINECONE_API_KEY")
        self.anthropic_api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        
        if not self.pinecone_api_key:
            raise ValueError("Pinecone API key is required. Set PINECONE_API_KEY env var or pass it to constructor.")
            
        # Initialize Pinecone
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index_name = index_name
        self.dimension = dimension
        
        # Initialize Embedding Model (using SentenceTransformers for local/free embeddings)
        # Using all-MiniLM-L6-v2 which maps sentences to a 384 dimensional dense vector space
        print("Loading embedding model...")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize Anthropic if key is available
        if self.anthropic_api_key:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            self.has_llm = True
        else:
            print("Warning: No ANTHROPIC_API_KEY found. Generation capabilities will be disabled (Retrieval only).")
            self.has_llm = False

        self._ensure_index_exists()
        self.index = self.pc.Index(self.index_name)

    def _ensure_index_exists(self):
        """Check if index exists, create if not."""
        existing_indexes = [i.name for i in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            print(f"Creating Pinecone index '{self.index_name}'...")
            try:
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                # Wait for index to be ready
                while not self.pc.describe_index(self.index_name).status['ready']:
                    time.sleep(1)
                print(f"Index '{self.index_name}' created successfully.")
            except Exception as e:
                print(f"Error creating index: {e}")
                # Fallback to checking if it exists but maybe we don't have create permissions or using different spec
                pass
        else:
            print(f"Index '{self.index_name}' already exists.")

    def ingest_csv_data(self, csv_path: str):
        """Ingest billing codes from CSV."""
        print(f"Ingesting data from {csv_path}...")
        try:
            df = pd.read_csv(csv_path)
            
            # Prepare vectors
            vectors = []
            batch_size = 100
            
            for i, row in df.iterrows():
                # Construct text for embedding
                # Combine relevant fields to create a rich semantic representation
                code = str(row.get('Code', '')).strip()
                description = str(row.get('Description', '')).strip()
                how_to_use = str(row.get('How to Use', '')).strip()
                amount = str(row.get('Amount ($CAD)', '')).strip()
                
                if not code or pd.isna(code):
                    continue
                    
                text_to_embed = f"Code: {code}. Description: {description}. Usage: {how_to_use}. Amount: {amount}"
                metadata = {
                    "source": "csv",
                    "code": code,
                    "description": description,
                    "how_to_use": how_to_use,
                    "amount": amount,
                    "text": text_to_embed
                }
                
                # Create ID
                vector_id = f"csv_{code}"
                
                # Get embedding
                embedding = self.embedder.encode(text_to_embed).tolist()
                
                vectors.append((vector_id, embedding, metadata))
                
                # Upsert in batches
                if len(vectors) >= batch_size:
                    self.index.upsert(vectors=vectors)
                    vectors = []
                    print(f"Processed {i+1} records...")
            
            # Upsert remaining
            if vectors:
                self.index.upsert(vectors=vectors)
                
            print("CSV ingestion complete.")
            
        except Exception as e:
            print(f"Error ingesting CSV: {e}")

    def ingest_knowledge_base(self, file_path: str):
        """Ingest unstructured knowledge base (Markdown/Text)."""
        print(f"Ingesting knowledge base from {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Simple chunking by sections (headers)
            # This is a basic strategy; for production, use a more robust text splitter
            sections = content.split('\n#')
            
            vectors = []
            
            for i, section in enumerate(sections):
                if not section.strip():
                    continue
                
                # Add back the # if it wasn't the first element
                section_text = section if i == 0 else '#' + section
                
                # Create a descriptive title/id
                lines = section_text.strip().split('\n')
                title = lines[0].strip().replace('#', '').strip()[:50]
                vector_id = f"kb_section_{i}_{title.replace(' ', '_')}"
                
                # clean id
                vector_id = "".join(x for x in vector_id if x.isalnum() or x in "_-")
                
                # Embed
                embedding = self.embedder.encode(section_text).tolist()
                
                metadata = {
                    "source": "knowledge_base",
                    "title": title,
                    "text": section_text[:4000] # Limit metadata size just in case
                }
                
                vectors.append((vector_id, embedding, metadata))
            
            if vectors:
                self.index.upsert(vectors=vectors)
                print(f"Ingested {len(vectors)} knowledge base sections.")
                
        except Exception as e:
            print(f"Error ingesting knowledge base: {e}")

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search Pinecone for relevant documents."""
        query_embedding = self.embedder.encode(query).tolist()
        
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        matches = []
        for match in results['matches']:
            matches.append({
                'score': match['score'],
                'metadata': match['metadata']
            })
            
        return matches

    def generate_response(self, query: str, context_matches: List[Dict], chat_history: List[Dict] = None) -> str:
        """Generate a response using Anthropic and the retrieved context."""
        if not self.has_llm:
            return "Anthropic API key not set. Returning context only."

        # meaningful context construction
        context_str = ""
        for i, match in enumerate(context_matches):
            data = match['metadata']
            context_str += f"\n--- Source {i+1} ({data.get('source', 'unknown')}) ---\n"
            if data.get('source') == 'csv':
                context_str += f"Code: {data.get('code')}\nDescription: {data.get('description')}\nUsage: {data.get('how_to_use')}\nAmount: {data.get('amount')}\n"
            else:
                context_str += f"{data.get('text')}\n"

        # Build history string
        history_str = ""
        if chat_history:
            # Take last 10 messages for context window management
            recent_history = chat_history[-10:] 
            for msg in recent_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                history_str += f"{role.upper()}: {content}\n"

        system_prompt = """You are an expert AI Medical Billing Assistant for Ontario (OHIP). 
        Use the provided context to answer the user's question accurately.
        If the answer is not in the context, say so.
        
        FORMATTING RULES:
        1. Use :blue[text] for Billing Codes (e.g., :blue[H102]).
        2. Use :green[text] for Money Amounts (e.g., :green[$43.05]).
        3. Use **bold** for key terms and important warnings.
        4. Organize complex answers with bullet points or numbered lists.
        5. Be professional, concise, and futuristic in tone.

        Prioritize 'Primary Codes' and 'Add-on Codes' in your explanation."""

        user_prompt = f"""Context information is below.
        ---------------------
        {context_str}
        ---------------------
        
        Previous Conversation History:
        ---------------------
        {history_str}
        ---------------------

        Given the context information, history, and not prior knowledge, answer the query.
        
        Query: {query}
        """

        # Try multiple models in order of preference
        models_to_try = [
            "claude-3-5-sonnet-20241022",
            "claude-3-sonnet-20240229", 
            "claude-3-haiku-20240307"  # Most widely available fallback
        ]
        
        last_error = None
        for model_name in models_to_try:
            try:
                response = self.anthropic_client.messages.create(
                    model=model_name,
                    max_tokens=2000,
                    temperature=0.3,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_prompt}
                    ]
                )
                return response.content[0].text
            except Exception as e:
                last_error = e
                continue  # Try next model
        
        # If all models failed, return error with helpful message
        return f"Error: Unable to connect to any Claude model. Last error: {last_error}. Please check your ANTHROPIC_API_KEY and model access."

    def classify_thread_content(self, content: str) -> dict:
        """Classify thread content and return emoji + color."""
        content_lower = content.lower()
        
        # Expanded medical category classification with more emojis
        categories = {
            'heart': {'emoji': '❤️', 'color': '#ef4444', 'keywords': ['heart', 'cardiac', 'chest pain', 'mi', 'myocardial', 'ecg', 'cardioversion', 'arrhythmia', 'cardiac arrest', 'code blue', 'angina', 'coronary']},
            'brain': {'emoji': '🧠', 'color': '#8b5cf6', 'keywords': ['brain', 'neurological', 'stroke', 'cva', 'seizure', 'headache', 'migraine', 'neurology', 'cns', 'concussion', 'tbi']},
            'lung': {'emoji': '🫁', 'color': '#06b6d4', 'keywords': ['lung', 'respiratory', 'breathing', 'asthma', 'copd', 'pneumonia', 'respiratory distress', 'bipap', 'ventilator']},
            'bone': {'emoji': '🦴', 'color': '#f59e0b', 'keywords': ['fracture', 'bone', 'wrist', 'ankle', 'radius', 'ulna', 'reduction', 'cast', 'splint', 'dislocation', 'carpus', 'metacarpal']},
            'wound': {'emoji': '🩹', 'color': '#ec4899', 'keywords': ['laceration', 'wound', 'cut', 'suture', 'repair', 'debridement', 'stitch']},
            'mental': {'emoji': '🧘', 'color': '#6366f1', 'keywords': ['mental health', 'psychiatric', 'depression', 'anxiety', 'form 1', 'suicide', 'psych', 'mental']},
            'trauma': {'emoji': '🚑', 'color': '#dc2626', 'keywords': ['trauma', 'polytrauma', 'iss', 'injury', 'accident', 'multiple injury', 'crash', 'car crash', 'automotive']},
            'anesthesia': {'emoji': '💉', 'color': '#14b8a6', 'keywords': ['anesthesia', 'sedation', 'anesthetic', 'intubation', 'nerve block']},
            'pediatric': {'emoji': '👶', 'color': '#f97316', 'keywords': ['pediatric', 'child', 'infant', 'baby', 'pediatric', 'pediatric']},
            'emergency': {'emoji': '⚡', 'color': '#fbbf24', 'keywords': ['emergency', 'er', 'emergency room', 'urgent', 'critical', 'code']},
            'surgery': {'emoji': '🔪', 'color': '#dc2626', 'keywords': ['surgery', 'surgical', 'operation', 'procedure', 'surgical']},
            'eye': {'emoji': '👁️', 'color': '#a855f7', 'keywords': ['eye', 'ocular', 'vision', 'retina', 'cornea', 'ophthalmology']},
            'ear': {'emoji': '👂', 'color': '#ec4899', 'keywords': ['ear', 'hearing', 'auditory', 'otolaryngology', 'ent']},
            'skin': {'emoji': '🫱', 'color': '#f59e0b', 'keywords': ['skin', 'dermatology', 'rash', 'burn', 'dermatitis']},
            'gastro': {'emoji': '🫀', 'color': '#10b981', 'keywords': ['stomach', 'gastro', 'gi', 'digestive', 'abdomen', 'nausea', 'vomit']},
            'general': {'emoji': '🏥', 'color': '#64748b', 'keywords': []}  # Default
        }
        
        # Check for matches (order matters - more specific first)
        # Check trauma/accident first (before bone/wound)
        for keyword in categories['trauma']['keywords']:
            if keyword in content_lower:
                return categories['trauma']
        
        # Then check other categories
        for category, info in categories.items():
            if category in ['general', 'trauma']:
                continue
            for keyword in info['keywords']:
                if keyword in content_lower:
                    return info
        
        # Default
        return categories['general']
    
    def generate_chat_title(self, first_message: str) -> str:
        """Generate a short, unique title for a chat based on the first message."""
        if not self.has_llm:
            return f"Chat: {first_message[:20]}..."
            
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-haiku-20240307", 
                max_tokens=20,
                temperature=0.7,
                system="You are a title generator. Create a short (3-5 words), professional, unique title for a medical billing chat based on the user's first query. Do not use quotes.",
                messages=[
                    {"role": "user", "content": f"Generate a title for this query: {first_message}"}
                ]
            )
            return response.content[0].text.strip()
        except:
            return f"Chat: {first_message[:20]}..."

    def run_rag_pipeline(self, query: str):
        """Full RAG pipeline: Retrieve -> Generate"""
        print(f"\nProcessing Query: {query}")
        print("-" * 50)
        
        # 1. Retrieve
        matches = self.retrieve(query)
        print(f"Found {len(matches)} relevant documents.")
        
        # 2. Generate
        if self.has_llm:
            answer = self.generate_response(query, matches)
            print("\nAnswer:")
            try:
                print(answer)
            except UnicodeEncodeError:
                # Fallback for Windows consoles that might not handle utf-8 properly
                print(answer.encode('ascii', 'ignore').decode('ascii'))
            return answer
        else:
            print("\nTop Matches:")
            for m in matches:
                print(f"- Score: {m['score']:.4f} | Source: {m['metadata'].get('source')} | Content: {str(m['metadata'])[:100]}...")
            return matches

# Example Usage
if __name__ == "__main__":
    # Check for keys (placeholder check)
    if not os.getenv("PINECONE_API_KEY"):
        print("Please set PINECONE_API_KEY environment variable to run this script.")
        exit(1)
        
    agent = PineconeBillingRagAgent()
    
    # Ingest data (uncomment to run ingestion - usually done once)
    # agent.ingest_csv_data("Codes_by_class.csv")
    # agent.ingest_knowledge_base("usecases_billing.md")
    
    # Test Query
    test_query = "What is the billing code for chest pain assessment?"
    agent.run_rag_pipeline(test_query)
