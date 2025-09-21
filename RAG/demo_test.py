#!/usr/bin/env python3
"""
Demo script to test the Medical Billing RAG System
"""

from billing_rag_system import BillingRAGSystem
import json

def test_rag_system():
    """Test the RAG system functionality."""
    print("🏥 Testing Medical Billing RAG System")
    print("=" * 50)
    
    # Initialize the system
    print("📊 Loading billing codes database...")
    rag_system = BillingRAGSystem("Codes by class.csv")
    print(f"✅ Loaded {len(rag_system.df)} billing codes")
    
    # Test search functionality
    print("\n🔍 Testing Code Search:")
    test_queries = [
        "chest pain assessment",
        "fracture reduction",
        "anesthesia",
        "laceration repair",
        "emergency department"
    ]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        results = rag_system.search_codes(query, top_k=3)
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['code']} - {result['description'][:50]}... - {result['amount']}")
    
    # Test revenue optimization
    print("\n💰 Testing Revenue Optimization:")
    suggestions = rag_system.get_revenue_optimization_suggestions(
        patient_type="adult",
        time_of_day="weekend",
        complexity="moderate",
        procedures=["fracture reduction", "laceration repair"]
    )
    
    print(f"Primary Codes: {len(suggestions['primary_codes'])}")
    print(f"Add-on Codes: {len(suggestions['add_on_codes'])}")
    print(f"Premium Codes: {len(suggestions['premium_codes'])}")
    print(f"Total Estimated Revenue: ${suggestions['total_estimated_revenue']:.2f}")
    
    # Test analytics
    print("\n📊 Testing Analytics:")
    analysis = rag_system.analyze_revenue_patterns()
    print("Revenue by Code Type:")
    for code_type, data in analysis['revenue_by_type'].items():
        print(f"  {code_type}: ${data['sum']:.2f} (avg: ${data['mean']:.2f})")
    
    print("\n✅ All tests completed successfully!")
    print("🚀 Ready to run the full application with: streamlit run billing_rag_system.py")

if __name__ == "__main__":
    test_rag_system()
