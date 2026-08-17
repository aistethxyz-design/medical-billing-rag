import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "YOUR_PINECONE_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "YOUR_OPENROUTER_API_KEY")

# Pinecone Configuration
PINECONE_ENVIRONMENT = "us-east-1"
PINECONE_INDEX_NAME = "medical-billing-codes"

# OpenRouter Configuration
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "meta-llama/llama-3.2-3b-instruct:free"  # Free model

# Model Configuration
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384

# Search Configuration
DEFAULT_TOP_K = 20
SIMILARITY_THRESHOLD = 0.3
