import React, { useState, useEffect } from 'react';
import { 
  Search, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  FileText,
  Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface BillingCode {
  code: string;
  description: string;
  amount: number;
  category: string;
  timeOfDay?: string;
  howToUse: string;
}

interface OptimizationSuggestion {
  suggestedCode: BillingCode;
  reason: string;
  revenueImpact: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  documentation: string[];
}

interface BillingAnalysis {
  suggestedCodes: BillingCode[];
  optimizations: OptimizationSuggestion[];
  revenueAnalysis: {
    currentRevenue: number;
    potentialRevenue: number;
    revenueIncrease: number;
    percentageIncrease: number;
  };
  riskAssessment: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    complianceScore: number;
  };
  documentation: {
    required: string[];
    recommended: string[];
    missing: string[];
  };
  explanation: string;
  confidence: number;
}

interface QuickSearch {
  title: string;
  description: string;
  searchQuery: string;
  category?: string;
  minAmount?: number;
}

const BillingAssistant: React.FC = () => {
  const [clinicalText, setClinicalText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BillingCode[]>([]);
  const [analysis, setAnalysis] = useState<BillingAnalysis | null>(null);
  const [quickSearches, setQuickSearches] = useState<QuickSearch[]>([]);
  const [recentCodes, setRecentCodes] = useState<BillingCode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadQuickSearches();
    loadRecentCodes();
  }, []);

  const loadQuickSearches = async () => {
    try {
      const response = await fetch('/api/billing/quick-searches');
      const data = await response.json();
      if (data.success) {
        setQuickSearches(data.quickSearches);
      }
    } catch (error) {
      console.error('Failed to load quick searches:', error);
    }
  };

  const loadRecentCodes = async () => {
    try {
      const response = await fetch('/api/billing/recent-codes?limit=5');
      const data = await response.json();
      if (data.success) {
        setRecentCodes(data.recentCodes);
      }
    } catch (error) {
      console.error('Failed to load recent codes:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!clinicalText.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/billing/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicalText,
          encounterType: 'Emergency',
          specialty: 'Emergency Medicine',
          timeOfDay: timeOfDay || undefined,
          maxSuggestions: 10
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        console.error('Analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(selectedCategory && { category: selectedCategory }),
        ...(timeOfDay && { timeOfDay })
      });

      const response = await fetch(`/api/billing/search?${params}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.codes);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickSearch = (quickSearch: QuickSearch) => {
    setSearchQuery(quickSearch.searchQuery);
    if (quickSearch.category) {
      setSelectedCategory(quickSearch.category);
    }
    if (quickSearch.minAmount) {
      // Handle min amount filter
    }
    handleSearch();
  };

  const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Billing Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Codes Card */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mr-4">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Billing Codes</h2>
                  <p className="text-gray-600">Lookup and suggest appropriate billing codes</p>
                </div>
              </div>

              {/* Clinical Text Analysis */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinical Text Analysis
                </label>
                <textarea
                  value={clinicalText}
                  onChange={(e) => setClinicalText(e.target.value)}
                  placeholder="Enter clinical notes, assessment, or procedure details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !clinicalText.trim()}
                  className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze for Optimal Codes'}
                </button>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Billing Codes
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code, description, or keywords..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
                
                {/* Revenue Impact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Current Revenue</div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(analysis.revenueAnalysis.currentRevenue)}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Potential Revenue</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(analysis.revenueAnalysis.potentialRevenue)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Revenue Increase</div>
                    <div className="text-2xl font-bold text-purple-700">
                      +{formatCurrency(analysis.revenueAnalysis.revenueIncrease)}
                    </div>
                  </div>
                </div>

                {/* Suggested Codes */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Suggested Codes</h4>
                  <div className="space-y-3">
                    {analysis.optimizations.map((opt, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {opt.suggestedCode.code}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(opt.riskLevel)}`}>
                                {opt.riskLevel} RISK
                              </span>
                              <span className="text-sm text-gray-500">
                                {Math.round(opt.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-gray-900 font-medium mb-1">
                              {opt.suggestedCode.description}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">{opt.reason}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-green-600 font-medium">
                                +{formatCurrency(opt.revenueImpact)}
                              </span>
                              {opt.suggestedCode.timeOfDay && (
                                <span className="text-gray-500">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  {opt.suggestedCode.timeOfDay}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documentation Requirements */}
                {analysis.documentation.required.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Required Documentation</h4>
                    <div className="space-y-2">
                      {analysis.documentation.required.map((doc, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Explanation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">AI Explanation</h4>
                  <p className="text-sm text-gray-700">{analysis.explanation}</p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Search Results ({searchResults.length})
                </h3>
                <div className="space-y-3">
                  {searchResults.map((code, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {code.code}
                            </span>
                            <span className="text-sm text-gray-500">{code.category}</span>
                            {code.timeOfDay && (
                              <span className="text-sm text-gray-500">
                                <Clock className="h-4 w-4 inline mr-1" />
                                {code.timeOfDay}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium mb-1">{code.description}</p>
                          <p className="text-sm text-gray-600 mb-2">{code.howToUse}</p>
                          <div className="text-green-600 font-medium">
                            {formatCurrency(code.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Searches */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Searches</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(search)}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900">{search.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{search.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Codes */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Codes</h3>
              <div className="space-y-3">
                {recentCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-mono text-sm text-gray-900">{code.code}</div>
                      <div className="text-xs text-gray-500">{code.description}</div>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      {formatCurrency(code.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      <option value="Assessment">Assessment</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Procedure">Procedure</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Premium">Premium</option>
                      <option value="Surgery">Surgery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time of Day
                    </label>
                    <select
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Any Time</option>
                      <option value="Day">Day (8AM-5PM)</option>
                      <option value="Evening">Evening (5PM-12AM)</option>
                      <option value="Night">Night (12AM-8AM)</option>
                      <option value="Weekend">Weekend</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingAssistant;
