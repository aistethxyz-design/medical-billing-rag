import React, { useState, useEffect } from 'react';
import { Search, Filter, Code, DollarSign, BookOpen, ChevronDown, ChevronUp, Users, Activity, TrendingUp } from 'lucide-react';
import { BillingCode, SearchResult, SearchParams } from '../types';
import { BillingCodesService } from '../services/billingCodesService';
import { useAuthStore } from '../stores/authStore';

const RAGSearchPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allCodes, setAllCodes] = useState<BillingCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<any>(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCodeType, setSelectedCodeType] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [codeTypes, setCodeTypes] = useState<string[]>([]);

  useEffect(() => {
    loadAllCodes();
    loadFilters();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statistics = await BillingCodesService.getStats();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const [cats, types] = await Promise.all([
        BillingCodesService.getCategories(),
        BillingCodesService.getCodeTypes()
      ]);
      setCategories(cats);
      setCodeTypes(types);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const loadAllCodes = async () => {
    try {
      const codes = await BillingCodesService.getAllCodes();
      setAllCodes(codes);
    } catch (error) {
      console.error('Failed to load billing codes:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params: SearchParams = {
        query: searchQuery,
        filters: {
          category: selectedCategory || undefined,
          codeType: selectedCodeType || undefined,
          minAmount: minAmount ? parseFloat(minAmount) : undefined,
          maxAmount: maxAmount ? parseFloat(maxAmount) : undefined
        }
      };

      const results = await BillingCodesService.searchCodes(params);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCodeType('');
    setMinAmount('');
    setMaxAmount('');
  };

  const toggleCodeExpansion = (code: string) => {
    const newExpanded = new Set(expandedCodes);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedCodes(newExpanded);
  };

  const extractAmount = (amountStr: string): string => {
    const match = amountStr.match(/\$(\d+(?:\.\d{2})?)/);
    return match ? `$${match[1]}` : amountStr;
  };

  const displayResults = searchQuery.trim() ? searchResults : allCodes.map(code => ({ code, highlightedText: undefined, relevanceScore: 0 } as SearchResult));

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500';
      case 'provider': return 'bg-blue-500';
      case 'coder': return 'bg-green-500';
      case 'biller': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleStats = () => {
    if (!user) return null;
    
    const role = user.role?.toLowerCase();
    if (role === 'admin') {
      return [
        { label: 'Total Codes', value: stats?.totalCodes || 0, icon: Code },
        { label: 'Categories', value: stats?.totalCategories || 0, icon: Filter },
        { label: 'System Status', value: 'Online', icon: Activity }
      ];
    } else if (role === 'provider') {
      return [
        { label: 'Patients Today', value: '12', icon: Users },
        { label: 'Cases Completed', value: '8', icon: Activity },
        { label: 'Revenue Today', value: '$2,450', icon: DollarSign }
      ];
    } else if (role === 'biller' || role === 'coder') {
      return [
        { label: 'Today\'s Revenue', value: '$3,450', icon: DollarSign },
        { label: 'This Week', value: '$18,200', icon: TrendingUp },
        { label: 'Growth', value: '+5.2%', icon: TrendingUp }
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🏥 Medical Billing RAG Assistant
              </h1>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getRoleColor(user.role)}`}></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Dashboard Stats */}
          {getRoleStats() && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getRoleStats()?.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-500">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Interface */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Search className="h-6 w-6 mr-2 text-blue-600" />
              Search Billing Codes
            </h2>
            
            {/* Search Input */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by code, description, or category..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-4 top-4" />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </>
                )}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Select category filter"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code Type</label>
                    <select
                      value={selectedCodeType}
                      onChange={(e) => setSelectedCodeType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Select code type filter"
                    >
                      <option value="">All Types</option>
                      {codeTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount ($)</label>
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount ($)</label>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              {searchQuery.trim() ? (
                `Found ${searchResults.length} results for "${searchQuery}"`
              ) : (
                `Showing all ${allCodes.length} billing codes`
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {displayResults.slice(0, 50).map((result, index) => {
              const { code } = result;
              const isExpanded = expandedCodes.has(code.code);
              
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCodeExpansion(code.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Code className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="font-bold text-lg text-gray-900">{code.code}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                            <span className="font-semibold text-green-700">
                              {extractAmount(code.amount)}
                            </span>
                          </div>
                          
                          {code.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {code.category}
                            </span>
                          )}
                          
                          {code.codeType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {code.codeType}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <h3 
                            className="text-gray-900 font-medium"
                            dangerouslySetInnerHTML={{ 
                              __html: result.highlightedText || code.description
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && code.howToUse && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3 flex items-start">
                        <BookOpen className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">How to Use:</h4>
                          <p className="text-sm text-gray-600">{code.howToUse}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {displayResults.length === 0 && searchQuery.trim() && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No results found</div>
                <p className="text-gray-500">Try adjusting your search terms or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RAGSearchPage;
