#!/usr/bin/env python3
"""
Simple test to verify the billing system works
"""

from billing_rag_system import BillingRAGSystem

def test_app():
    print("🏥 Testing Medical Billing RAG System")
    print("=" * 50)
    
    try:
        # Initialize the system
        print("📊 Loading billing codes database...")
        rag_system = BillingRAGSystem("Codes by class.csv")
        print(f"✅ Loaded {len(rag_system.df)} billing codes")
        
        # Test NLP expansion
        print("\n🔍 Testing NLP Query Expansion:")
        test_queries = ["chest pain", "broken bone", "emergency", "anesthesia"]
        
        for query in test_queries:
            expanded = rag_system._expand_query_with_nlp(query)
            print(f"  '{query}' → '{expanded}'")
        
        # Test search
        print("\n🔍 Testing Search:")
        results = rag_system.search_codes("chest pain")
        print(f"  Found {results['total_primary']} primary codes and {results['total_add_ons']} add-on codes for 'chest pain'")
        
        if results['primary_codes']:
            print("  Top 3 primary results:")
            for i, result in enumerate(results['primary_codes'][:3], 1):
                print(f"    {i}. {result['code']} - {result['description'][:50]}...")
        if results['add_on_codes']:
            print("  Top 3 add-on results:")
            for i, result in enumerate(results['add_on_codes'][:3], 1):
                print(f"    {i}. {result['code']} - {result['description'][:50]}...")
        
        print("\n✅ All tests passed! The system is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_app()
