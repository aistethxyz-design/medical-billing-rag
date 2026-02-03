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
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ShoppingCart
} from 'lucide-react';
import BillingCodeExtractor from '@/components/BillingCodeExtractor';

interface BillingCode {
  code: string;
  description: string;
  amount: number;
  category: string;
  timeOfDay?: string;
  howToUse: string;
}

interface SelectedCode extends BillingCode {
  id: string;
  isEditing?: boolean;
  editedCode?: string;
  editedDescription?: string;
  editedAmount?: number;
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
  const [activeTab, setActiveTab] = useState<'search' | 'extract'>('search');
  
  // Selected billing codes state (for total calculation)
  const [selectedCodes, setSelectedCodes] = useState<SelectedCode[]>([]);
  const [showCart, setShowCart] = useState(true);

  // Mock billing codes database
  const MOCK_BILLING_CODES: BillingCode[] = [
    { code: 'H152', description: 'Comprehensive assessment - Weekend/Holiday', amount: 63.30, category: 'Emergency', timeOfDay: 'Weekend', howToUse: 'Default for most ER patients requiring moderate evaluation on weekends and holidays' },
    { code: 'H102', description: 'Comprehensive assessment - Weekday', amount: 37.20, category: 'Emergency', timeOfDay: 'Day', howToUse: 'Mon-Fri 0800-1700 for moderate evaluation' },
    { code: 'H132', description: 'Comprehensive assessment - Evening', amount: 46.30, category: 'Emergency', timeOfDay: 'Evening', howToUse: 'Mon-Fri 1700-0000 for moderate evaluation' },
    { code: 'H101', description: 'Minor assessment', amount: 15.00, category: 'Emergency', timeOfDay: 'Day', howToUse: 'Mon-Fri 0800-1700 for brief encounters' },
    { code: 'H103', description: 'Multiple systems assessment - High-acuity', amount: 35.65, category: 'Emergency', timeOfDay: 'Day', howToUse: 'High-acuity patients requiring extensive work-up' },
    { code: 'G521', description: 'Life Threatening Critical Care – First 15 min', amount: 110.55, category: 'Critical Care', howToUse: 'Up to 3 MDs can bill. Includes IVs, arterial lines, intubations, catheters, defibrillations' },
    { code: 'G523', description: 'Life Threatening Critical Care – 2nd 15 min', amount: 55.20, category: 'Critical Care', howToUse: 'Additional critical care time after first 15 min' },
    { code: 'H100', description: 'Bedside Ultrasound (POCUS)', amount: 19.65, category: 'Procedures', howToUse: 'For suspected pericardial tamponade, cardiac standstill, free abdominal fluid, ruptured AAA, ectopic pregnancy. Max 2 scans per patient per day' },
    { code: 'K623', description: 'Form 1', amount: 104.80, category: 'Forms', howToUse: 'Add if Form 1 completed or performed during visit/encounter' },
    { code: 'K734', description: 'ED MD to NON CritiCALL consultation', amount: 31.35, category: 'Consultation', howToUse: 'Requires minimum 10 minutes discussion between referring and consulted MD' },
    { code: 'A888', description: 'Special visit premium – Emergency Department', amount: 20.65, category: 'Premium', howToUse: 'Billed in addition to an assessment when called in to ER' },
    { code: 'E412', description: 'After Hours Procedures bonus', amount: 0, category: 'Premium', howToUse: '20% bonus to billings MON-FRI 1700-0000' },
    { code: 'B100A', description: 'First Telemedicine Patient Encounter premium', amount: 35.00, category: 'Telemedicine', howToUse: 'Bill for the first telemedicine patient encounter' },
    { code: 'A003', description: 'General assessment', amount: 77.20, category: 'Assessment', howToUse: 'Used for full assessments when time and complexity justify' },
    { code: 'A004', description: 'Medical specific assessment', amount: 43.10, category: 'Assessment', howToUse: 'For focused systems assessments (e.g., cardiovascular)' },
  ];

  useEffect(() => {
    loadQuickSearches();
    loadRecentCodes();
  }, []);

  const loadQuickSearches = async () => {
    // Mock data for quick searches
    setQuickSearches([
      { title: 'ER Assessments', description: 'Common ER codes', searchQuery: 'assessment', category: 'Emergency' },
      { title: 'Critical Care', description: 'Critical care codes', searchQuery: 'critical care', category: 'Critical Care' },
      { title: 'Procedures', description: 'Procedural codes', searchQuery: 'procedure', category: 'Procedures' },
      { title: 'Premiums', description: 'Premium add-ons', searchQuery: 'premium', category: 'Premium' },
    ]);
  };

  const loadRecentCodes = async () => {
    // Mock recent codes
    setRecentCodes([
      { code: 'H152', description: 'Comprehensive assessment - Weekend', amount: 63.30, category: 'Emergency', howToUse: 'Weekend and Holiday' },
      { code: 'G521', description: 'Critical Care - First 15 min', amount: 110.55, category: 'Critical Care', howToUse: 'Life threatening situations' },
      { code: 'H100', description: 'Bedside Ultrasound (POCUS)', amount: 19.65, category: 'Procedures', howToUse: 'Max 2 scans per patient per day' },
    ]);
  };

  const handleAnalyze = async () => {
    if (!clinicalText.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate AI analysis with mock data
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock analysis result
    const mockAnalysis: BillingAnalysis = {
      suggestedCodes: MOCK_BILLING_CODES.slice(0, 3),
      optimizations: [
        {
          suggestedCode: MOCK_BILLING_CODES[0],
          reason: 'Based on complexity and weekend timing',
          revenueImpact: 63.30,
          confidence: 0.92,
          riskLevel: 'LOW',
          documentation: ['Patient assessment documented', 'Time of service recorded']
        },
        {
          suggestedCode: MOCK_BILLING_CODES[7],
          reason: 'POCUS performed as documented',
          revenueImpact: 19.65,
          confidence: 0.88,
          riskLevel: 'LOW',
          documentation: ['Ultrasound findings documented']
        }
      ],
      revenueAnalysis: {
        currentRevenue: 0,
        potentialRevenue: 82.95,
        revenueIncrease: 82.95,
        percentageIncrease: 100
      },
      riskAssessment: {
        overallRisk: 'LOW',
        riskFactors: [],
        complianceScore: 95
      },
      documentation: {
        required: ['Assessment findings', 'Time of service'],
        recommended: ['Procedure notes'],
        missing: []
      },
      explanation: 'Based on the clinical documentation, recommended codes include comprehensive assessment for weekend hours and POCUS procedure.',
      confidence: 0.90
    };

    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Simulate search with mock data
    await new Promise(resolve => setTimeout(resolve, 500));

    const query = searchQuery.toLowerCase();
    const results = MOCK_BILLING_CODES.filter(code => 
      code.code.toLowerCase().includes(query) ||
      code.description.toLowerCase().includes(query) ||
      code.category.toLowerCase().includes(query) ||
      code.howToUse.toLowerCase().includes(query)
    );

    // Apply filters
    let filteredResults = results;
    if (selectedCategory) {
      filteredResults = filteredResults.filter(code => code.category === selectedCategory);
    }
    if (timeOfDay) {
      filteredResults = filteredResults.filter(code => code.timeOfDay === timeOfDay || !code.timeOfDay);
    }

    setSearchResults(filteredResults);
    setIsSearching(false);
  };

  const handleQuickSearch = (quickSearch: QuickSearch) => {
    setSearchQuery(quickSearch.searchQuery);
    if (quickSearch.category) {
      setSelectedCategory(quickSearch.category);
    }
    setTimeout(() => handleSearch(), 100);
  };

  // Add code to selected list
  const addCodeToSelected = (code: BillingCode) => {
    const newSelectedCode: SelectedCode = {
      ...code,
      id: `${code.code}-${Date.now()}`,
      isEditing: false
    };
    setSelectedCodes(prev => [...prev, newSelectedCode]);
    setShowCart(true);
  };

  // Remove code from selected list
  const removeCodeFromSelected = (id: string) => {
    setSelectedCodes(prev => prev.filter(code => code.id !== id));
  };

  // Start editing a code
  const startEditingCode = (id: string) => {
    setSelectedCodes(prev => prev.map(code => {
      if (code.id === id) {
        return {
          ...code,
          isEditing: true,
          editedCode: code.code,
          editedDescription: code.description,
          editedAmount: code.amount
        };
      }
      return code;
    }));
  };

  // Save edited code
  const saveEditedCode = (id: string) => {
    setSelectedCodes(prev => prev.map(code => {
      if (code.id === id) {
        return {
          ...code,
          code: code.editedCode || code.code,
          description: code.editedDescription || code.description,
          amount: code.editedAmount ?? code.amount,
          isEditing: false
        };
      }
      return code;
    }));
  };

  // Cancel editing
  const cancelEditingCode = (id: string) => {
    setSelectedCodes(prev => prev.map(code => {
      if (code.id === id) {
        return {
          ...code,
          isEditing: false,
          editedCode: undefined,
          editedDescription: undefined,
          editedAmount: undefined
        };
      }
      return code;
    }));
  };

  // Update edited values
  const updateEditedValue = (id: string, field: 'editedCode' | 'editedDescription' | 'editedAmount', value: string | number) => {
    setSelectedCodes(prev => prev.map(code => {
      if (code.id === id) {
        return { ...code, [field]: value };
      }
      return code;
    }));
  };

  // Calculate total
  const totalAmount = selectedCodes.reduce((sum, code) => sum + code.amount, 0);

  // Handle codes extracted from the extractor
  const handleExtractedCodes = (codes: any[]) => {
    codes.forEach(code => {
      addCodeToSelected({
        code: code.code,
        description: code.description,
        amount: code.amount,
        category: code.category,
        howToUse: code.reason
      });
    });
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
              <h1 className="text-2xl font-bold text-gray-900">Billing Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Cart/Total Button */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
                {selectedCodes.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {selectedCodes.length}
                  </span>
                )}
              </button>
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
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-1 flex">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'search' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🔍 Search & Analyze
              </button>
              <button
                onClick={() => setActiveTab('extract')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'extract' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                ✨ Extract from Notes
              </button>
            </div>

            {activeTab === 'extract' ? (
              <BillingCodeExtractor onCodesExtracted={handleExtractedCodes} />
            ) : (
              <>
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
                          {/* Add to Total Button */}
                          <button
                            onClick={() => addCodeToSelected(opt.suggestedCode)}
                            className="ml-4 flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </button>
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
                        {/* Add to Total Button */}
                        <button
                          onClick={() => addCodeToSelected(code)}
                          className="ml-4 flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Codes / Cart */}
            {showCart && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Selected Codes
                  </h3>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4">
                  {selectedCodes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No codes selected</p>
                      <p className="text-sm">Click "Add" on any code to add it here</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedCodes.map((code) => (
                          <div key={code.id} className="border border-gray-200 rounded-lg p-3">
                            {code.isEditing ? (
                              // Edit Mode
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={code.editedCode || ''}
                                  onChange={(e) => updateEditedValue(code.id, 'editedCode', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                  placeholder="Code"
                                />
                                <input
                                  type="text"
                                  value={code.editedDescription || ''}
                                  onChange={(e) => updateEditedValue(code.id, 'editedDescription', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Description"
                                />
                                <input
                                  type="number"
                                  value={code.editedAmount ?? 0}
                                  onChange={(e) => updateEditedValue(code.id, 'editedAmount', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Amount"
                                  step="0.01"
                                />
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => cancelEditingCode(code.id)}
                                    className="p-1 text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => saveEditedCode(code.id)}
                                    className="p-1 text-green-600 hover:text-green-700"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-mono text-sm font-semibold text-gray-900">
                                    {code.code}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {code.description}
                                  </div>
                                  <div className="text-sm text-green-600 font-medium mt-1">
                                    {formatCurrency(code.amount)}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => startEditingCode(code.id)}
                                    className="p-1 text-blue-500 hover:text-blue-700"
                                    title="Edit code"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => removeCodeFromSelected(code.id)}
                                    className="p-1 text-red-500 hover:text-red-700"
                                    title="Remove code"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Total */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedCodes.length} code{selectedCodes.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>

                      {/* Clear All */}
                      <button
                        onClick={() => setSelectedCodes([])}
                        className="mt-3 w-full text-sm text-red-600 hover:text-red-700 py-2"
                      >
                        Clear All
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

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
                    <div className="flex-1">
                      <div className="font-mono text-sm text-gray-900">{code.code}</div>
                      <div className="text-xs text-gray-500">{code.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">
                        {formatCurrency(code.amount)}
                      </span>
                      <button
                        onClick={() => addCodeToSelected(code)}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Add code"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
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
