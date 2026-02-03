"""
Hybrid RAG Agent
- PDFs: Vectorized and stored in Pinecone for semantic search
- Excel/CSV: Direct query using pandas (no vectorization - data is already structured)
"""

import os
import time
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Union
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
import anthropic
from dotenv import load_dotenv
import fitz  # PyMuPDF for PDF reading
import re

# Load environment variables
load_dotenv()
load_dotenv("rag_secrets.env")


class HybridBillingRagAgent:
    """
    Hybrid RAG Agent that:
    - Vectorizes PDFs for semantic search (unstructured data)
    - Queries Excel/CSV directly using pandas (structured data, no vectorization needed)
    """
    
    def __init__(self, 
                 pinecone_api_key: Optional[str] = None, 
                 anthropic_api_key: Optional[str] = None,
                 index_name: str = "medical-billing-rag",
                 dimension: int = 384):
        
        self.pinecone_api_key = pinecone_api_key or os.getenv("PINECONE_API_KEY")
        self.anthropic_api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        
        if not self.pinecone_api_key:
            raise ValueError("Pinecone API key is required. Set PINECONE_API_KEY env var or pass it to constructor.")
            
        # Initialize Pinecone for PDF vectors
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index_name = index_name
        self.dimension = dimension
        
        # Initialize Embedding Model
        print("Loading embedding model...")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize Anthropic
        if self.anthropic_api_key:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            self.has_llm = True
        else:
            print("Warning: No ANTHROPIC_API_KEY found. Generation capabilities will be disabled.")
            self.has_llm = False

        self._ensure_index_exists()
        self.index = self.pc.Index(self.index_name)
        
        # Store CSV/Excel dataframes in memory for direct querying
        self.structured_data: Dict[str, pd.DataFrame] = {}
        
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
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
                while not self.pc.describe_index(self.index_name).status['ready']:
                    time.sleep(1)
                print(f"Index '{self.index_name}' created successfully.")
            except Exception as e:
                print(f"Error creating index: {e}")
        else:
            print(f"Index '{self.index_name}' already exists.")

    # ============================================
    # PDF HANDLING - VECTORIZE FOR SEMANTIC SEARCH
    # ============================================
    
    def ingest_pdf(self, pdf_path: str, chunk_size: int = 500, chunk_overlap: int = 50):
        """
        Ingest PDF by:
        1. Extracting text
        2. Chunking into manageable pieces
        3. Creating embeddings
        4. Storing in Pinecone vector DB
        """
        print(f"Ingesting PDF: {pdf_path}")
        
        try:
            # Extract text from PDF using PyMuPDF
            doc = fitz.open(pdf_path)
            full_text = ""
            page_texts = []
            
            for page_num, page in enumerate(doc):
                page_text = page.get_text()
                full_text += page_text + "\n"
                page_texts.append({
                    "page": page_num + 1,
                    "text": page_text
                })
            
            doc.close()
            
            # Chunk the text
            chunks = self._chunk_text(full_text, chunk_size, chunk_overlap)
            print(f"Created {len(chunks)} chunks from PDF")
            
            # Create embeddings and upsert to Pinecone
            vectors = []
            batch_size = 100
            pdf_name = os.path.basename(pdf_path)
            
            for i, chunk in enumerate(chunks):
                if not chunk.strip():
                    continue
                    
                vector_id = f"pdf_{pdf_name}_{i}"
                # Clean ID
                vector_id = "".join(x for x in vector_id if x.isalnum() or x in "_-.")
                
                embedding = self.embedder.encode(chunk).tolist()
                
                metadata = {
                    "source": "pdf",
                    "filename": pdf_name,
                    "chunk_index": i,
                    "text": chunk[:4000]  # Limit metadata size
                }
                
                vectors.append((vector_id, embedding, metadata))
                
                if len(vectors) >= batch_size:
                    self.index.upsert(vectors=vectors)
                    vectors = []
                    print(f"Processed {i+1} chunks...")
            
            if vectors:
                self.index.upsert(vectors=vectors)
            
            print(f"PDF ingestion complete: {len(chunks)} chunks indexed.")
            return True
            
        except Exception as e:
            print(f"Error ingesting PDF: {e}")
            return False
    
    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks for better context preservation."""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks

    # ============================================
    # EXCEL/CSV HANDLING - DIRECT QUERY (NO VECTORIZATION)
    # ============================================
    
    def load_structured_data(self, file_path: str, name: Optional[str] = None):
        """
        Load Excel or CSV file into memory for direct querying.
        NO vectorization - data is already properly formatted.
        """
        file_name = name or os.path.basename(file_path)
        
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Store in memory
            self.structured_data[file_name] = df
            print(f"Loaded structured data: {file_name} ({len(df)} rows, {len(df.columns)} columns)")
            print(f"Columns: {list(df.columns)}")
            
            return True
            
        except Exception as e:
            print(f"Error loading structured data: {e}")
            return False
    
    def query_structured_data(self, query: str, data_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Query Excel/CSV data directly using pandas.
        Uses AI to understand the query and generate appropriate pandas operations.
        """
        if not self.structured_data:
            return {"error": "No structured data loaded", "results": []}
        
        # Use specified data source or search all
        data_sources = [data_name] if data_name else list(self.structured_data.keys())
        
        all_results = []
        
        for source in data_sources:
            if source not in self.structured_data:
                continue
                
            df = self.structured_data[source]
            
            # Extract search terms from query
            search_results = self._search_dataframe(df, query)
            
            if not search_results.empty:
                all_results.append({
                    "source": source,
                    "data": search_results.to_dict('records'),
                    "count": len(search_results)
                })
        
        return {
            "query": query,
            "results": all_results,
            "total_matches": sum(r["count"] for r in all_results)
        }
    
    def _search_dataframe(self, df: pd.DataFrame, query: str, max_results: int = 20) -> pd.DataFrame:
        """
        Smart search across a DataFrame.
        Handles billing codes, descriptions, and amounts.
        """
        query_lower = query.lower()
        
        # Build a mask for matching rows
        mask = pd.Series([False] * len(df))
        
        for col in df.columns:
            try:
                # Convert column to string and search
                col_str = df[col].astype(str).str.lower()
                
                # Check for exact code match (e.g., "H152", "A003")
                code_pattern = r'\b[A-Z]\d{3}\b'
                codes_in_query = re.findall(code_pattern, query.upper())
                
                if codes_in_query:
                    for code in codes_in_query:
                        mask |= df[col].astype(str).str.upper().str.contains(code, na=False)
                
                # Check for keyword matches
                keywords = re.findall(r'\b\w{3,}\b', query_lower)
                for keyword in keywords:
                    if keyword not in ['the', 'and', 'for', 'what', 'how', 'code', 'billing']:
                        mask |= col_str.str.contains(keyword, na=False)
                        
            except Exception:
                continue
        
        results = df[mask].head(max_results)
        return results

    # ============================================
    # HYBRID RETRIEVAL - COMBINE BOTH SOURCES
    # ============================================
    
    def retrieve(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Hybrid retrieval:
        1. Search Pinecone for PDF content (semantic search)
        2. Query structured data directly (exact/keyword search)
        """
        results = {
            "pdf_results": [],
            "structured_results": [],
            "query": query
        }
        
        # 1. Search PDFs in Pinecone (semantic search)
        try:
            query_embedding = self.embedder.encode(query).tolist()
            pinecone_results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter={"source": "pdf"}  # Only get PDF results from vectors
            )
            
            for match in pinecone_results['matches']:
                results["pdf_results"].append({
                    'score': match['score'],
                    'metadata': match['metadata']
                })
        except Exception as e:
            print(f"Pinecone search error: {e}")
        
        # 2. Query structured data directly (no vectors)
        if self.structured_data:
            structured = self.query_structured_data(query)
            results["structured_results"] = structured.get("results", [])
        
        return results

    def generate_response(self, query: str, retrieval_results: Dict[str, Any], 
                          chat_history: List[Dict] = None) -> str:
        """Generate a response using both PDF and structured data context."""
        if not self.has_llm:
            return "Anthropic API key not set. Returning context only."

        # Build context from PDF results
        pdf_context = ""
        for i, match in enumerate(retrieval_results.get("pdf_results", [])):
            pdf_context += f"\n--- PDF Source {i+1} (Score: {match['score']:.3f}) ---\n"
            pdf_context += f"File: {match['metadata'].get('filename', 'Unknown')}\n"
            pdf_context += f"Content: {match['metadata'].get('text', '')}\n"
        
        # Build context from structured data (Excel/CSV)
        structured_context = ""
        for result in retrieval_results.get("structured_results", []):
            structured_context += f"\n--- Billing Codes from {result['source']} ({result['count']} matches) ---\n"
            for row in result.get("data", [])[:10]:  # Limit to 10 per source
                code = row.get('Code', '')
                desc = row.get('Description', '')
                amount = row.get('Amount ($CAD)', '')
                how_to_use = row.get('How to Use', '')
                structured_context += f"• Code: {code} | {desc} | Amount: {amount}\n"
                if how_to_use:
                    structured_context += f"  Usage: {how_to_use}\n"

        # Build history string
        history_str = ""
        if chat_history:
            for msg in chat_history[-10:]:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                history_str += f"{role.upper()}: {content}\n"

        system_prompt = """You are an expert AI Medical Billing Assistant for Ontario (OHIP).
        
You have access to TWO types of data:
1. PDF DOCUMENTS: Unstructured guides and use cases (semantic search results)
2. BILLING CODES TABLE: Structured CSV/Excel data with exact billing codes, descriptions, and amounts

IMPORTANT RULES:
- For billing code questions, PRIORITIZE the structured billing codes data (it's authoritative)
- Use PDF content for understanding use cases, guidelines, and context
- Always cite the source of information

FORMATTING RULES:
1. Use :blue[text] for Billing Codes (e.g., :blue[H102])
2. Use :green[text] for Money Amounts (e.g., :green[$43.05])
3. Use **bold** for key terms and important warnings
4. Organize complex answers with bullet points or numbered lists
5. Be professional, concise, and accurate"""

        user_prompt = f"""STRUCTURED BILLING DATA (from Excel/CSV - authoritative for codes):
{structured_context if structured_context else "No matching billing codes found."}

PDF DOCUMENT CONTEXT (for guidelines and use cases):
{pdf_context if pdf_context else "No relevant PDF content found."}

CONVERSATION HISTORY:
{history_str if history_str else "No previous messages."}

USER QUERY: {query}

Please provide a helpful answer using the available information. Prioritize structured billing data for code lookups."""

        models_to_try = [
            "claude-3-5-sonnet-20241022",
            "claude-3-sonnet-20240229", 
            "claude-3-haiku-20240307"
        ]
        
        for model_name in models_to_try:
            try:
                response = self.anthropic_client.messages.create(
                    model=model_name,
                    max_tokens=2000,
                    temperature=0.3,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}]
                )
                return response.content[0].text
            except Exception as e:
                continue
        
        return "Error: Unable to generate response. Please check API keys."

    def run_rag_pipeline(self, query: str, chat_history: List[Dict] = None) -> str:
        """Full hybrid RAG pipeline."""
        print(f"\nProcessing Query: {query}")
        print("-" * 50)
        
        # 1. Hybrid retrieval
        results = self.retrieve(query)
        print(f"Found {len(results['pdf_results'])} PDF matches")
        print(f"Found {len(results['structured_results'])} structured data sources")
        
        # 2. Generate response
        if self.has_llm:
            answer = self.generate_response(query, results, chat_history)
            return answer
        else:
            return str(results)


# Example usage
if __name__ == "__main__":
    agent = HybridBillingRagAgent()
    
    # Load structured data (CSV/Excel) - NO vectorization
    agent.load_structured_data("Codes_by_class.csv")
    
    # Ingest PDF - VECTORIZE for semantic search
    # agent.ingest_pdf("usecases_billing.pdf")
    
    # Test query
    response = agent.run_rag_pipeline("What is the billing code for chest pain?")
    print(response)
