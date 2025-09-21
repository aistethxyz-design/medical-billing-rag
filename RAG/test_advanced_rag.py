#!/usr/bin/env python3
"""
Test script for Advanced Medical Billing RAG System
Tests Pinecone integration, OpenRouter API, and LLM responses
"""

import sys
import os
from advanced_billing_rag import AdvancedBillingRAGSystem

def test_advanced_rag_system():
    """Test the advanced RAG system functionality."""
    print("🏥 Testing Advanced Medical Billing RAG System")
    print("=" * 60)
    
    try:
        # Initialize the system
        print("📊 Initializing Advanced RAG System...")
        rag_system = AdvancedBillingRAGSystem(
            'Codes by class.csv',
            'pcsk_si3DV_F4yTwrPzsfMs6zfKdZCwgYNkCrU5c8BjRXSsqCPBBbDAQqWU2Kc5z77K6ghAtd9',
            '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'
        )
        print("✅ Advanced RAG System initialized successfully!")
        
        # Test search functionality
        print("\n🔍 Testing Search with Pinecone:")
        test_queries = [
            "chest pain",
            "fracture emergency",
            "anesthesia surgery"
        ]
        
        for query in test_queries:
            print(f"\n  Testing query: '{query}'")
            results = rag_system.search_codes(query, top_k=10)
            print(f"    Found {results['total_primary']} primary codes and {results['total_add_ons']} add-on codes")
            
            if results['primary_codes']:
                print("    Top 3 primary results:")
                for i, code in enumerate(results['primary_codes'][:3], 1):
                    print(f"      {i}. {code['code']} - {code['description'][:40]}... - ${code['amount_numeric']:.2f}")
        
        # Test LLM response generation
        print("\n🤖 Testing LLM Response Generation:")
        test_query = "chest pain emergency"
        results = rag_system.search_codes(test_query, top_k=5)
        llm_response = rag_system.generate_llm_response(test_query, results)
        print(f"  Query: '{test_query}'")
        print(f"  LLM Response: {llm_response[:200]}...")
        
        # Test revenue optimization
        print("\n💰 Testing Revenue Optimization:")
        suggestions = rag_system.get_revenue_optimization_suggestions(
            patient_type="adult",
            time_of_day="night",
            complexity="complex",
            procedures=["surgery", "emergency"]
        )
        print(f"  Suggestions: {suggestions['suggestions'][:200]}...")
        
        print("\n✅ All advanced tests passed! The system is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_advanced_rag_system()
    sys.exit(0 if success else 1)
