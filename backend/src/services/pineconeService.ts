import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface VectorDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

export interface SimilarityResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

class PineconeService {
  private pinecone: Pinecone | null = null;
  private openai: OpenAI;
  private indexName: string;
  private isInitialized = false;
  private embeddingCache: Map<string, number[]> = new Map();
  private readonly CACHE_MAX_SIZE = 500;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
    this.indexName = process.env.PINECONE_INDEX || 'ohip-billing-codes';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = process.env.PINECONE_API_KEY;
      if (!apiKey) {
        logger.warn('PINECONE_API_KEY not set — falling back to local TF-IDF search');
        this.isInitialized = true;
        return;
      }

      this.pinecone = new Pinecone({ apiKey });

      // Check if index exists, create if not
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName);

      if (!indexExists) {
        logger.info(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: process.env.PINECONE_REGION || 'us-east-1',
            },
          },
        });
        // Wait for index to be ready
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      this.isInitialized = true;
      logger.info('PineconeService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PineconeService:', error);
      // Don't throw — allow fallback to local search
      this.isInitialized = true;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = text.substring(0, 200).toLowerCase().trim();
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      const embedding = response.data[0].embedding;

      // Cache with eviction
      if (this.embeddingCache.size >= this.CACHE_MAX_SIZE) {
        const firstKey = this.embeddingCache.keys().next().value;
        if (firstKey) this.embeddingCache.delete(firstKey);
      }
      this.embeddingCache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      logger.error('Embedding generation failed:', error);
      throw error;
    }
  }

  async upsertDocuments(documents: VectorDocument[]): Promise<void> {
    if (!this.pinecone) {
      logger.warn('Pinecone not available, skipping upsert');
      return;
    }

    try {
      const index = this.pinecone.index(this.indexName);
      const batchSize = 100;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const vectors = await Promise.all(
          batch.map(async (doc) => {
            const embedding = await this.getEmbedding(doc.text);
            return {
              id: doc.id,
              values: embedding,
              metadata: {
                ...doc.metadata,
                text: doc.text.substring(0, 1000), // Pinecone metadata limit
              },
            };
          })
        );

        await index.upsert(vectors.map(v => ({ id: v.id, values: v.values, metadata: v.metadata })) as any);
        logger.info(`Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
      }

      logger.info(`Successfully upserted ${documents.length} documents to Pinecone`);
    } catch (error) {
      logger.error('Failed to upsert documents:', error);
      throw error;
    }
  }

  async semanticSearch(query: string, topK: number = 10, filter?: Record<string, any>): Promise<SimilarityResult[]> {
    if (!this.pinecone) {
      return []; // Fall back handled by caller
    }

    try {
      const queryEmbedding = await this.getEmbedding(query);
      const index = this.pinecone.index(this.indexName);

      const queryOptions: any = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      };

      if (filter && Object.keys(filter).length > 0) {
        queryOptions.filter = filter;
      }

      const results = await index.query(queryOptions);

      return (results.matches || []).map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: (match.metadata as Record<string, any>) || {},
      }));
    } catch (error) {
      logger.error('Semantic search failed:', error);
      return [];
    }
  }

  async deleteAll(): Promise<void> {
    if (!this.pinecone) return;
    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteAll();
      logger.info('Deleted all vectors from Pinecone index');
    } catch (error) {
      logger.error('Failed to delete vectors:', error);
    }
  }

  isPineconeAvailable(): boolean {
    return this.pinecone !== null;
  }
}

export const pineconeService = new PineconeService();
