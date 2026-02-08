import React, { useState, useEffect } from 'react';
import { 
  Search, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  FileText,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ShoppingCart,
  Zap,
  Shield,
  Sun,
  Moon,
  Sunset,
  Calendar
} from 'lucide-react';
import BillingCodeExtractor from '@/components/BillingCodeExtractor';
import {
  analyzeClinicalText,
  searchBillingCodes,
  type BillingCode,
  type BillingAnalysis,
  type OptimizationSuggestion,
} from '@/services/billingApi';

interface SelectedCode extends BillingCode {
  id: string;
  isEditing?: boolean;
  editedCode?: string;
  editedDescription?: string;
  editedAmount?: number;
}

interface QuickSearch {
  title: string;
  description: string;
  searchQuery: string;
  category?: string;
}

const BillingAssistant: React.FC = () => {
  const [clinicalText, setClinicalText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BillingCode[]>([]);
  const [analysis, setAnalysis] = useState<BillingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'extract'>('search');
  const [error, setError] = useState<string | null>(null);
  
  // Selected billing codes state (for total calculation)
  const [selectedCodes, setSelectedCodes] = useState<SelectedCode[]>([]);
  const [showCart, setShowCart] = useState(true);

  // Auto-detected time slot
  const [autoTimeSlot, setAutoTimeSlot] = useState('');

  // Quick searches
  const quickSearches: QuickSearch[] = [
    { title: 'ER Assessments', description: 'H-codes for ER', searchQuery: 'assessment emergency', category: 'Emergency' },
    { title: 'Critical Care', description: 'G-codes', searchQuery: 'critical care life threatening', category: 'Critical Care / Procedure' },
    { title: 'Procedures', description: 'Z-codes', searchQuery: 'procedure surgery', category: 'Procedure / Surgery' },
    { title: 'Premiums', description: 'E-codes & bonuses', searchQuery: 'premium bonus after hours', category: 'Premium' },
    { title: 'Fractures', description: 'F-codes', searchQuery: 'fracture reduction', category: 'Fracture' },
    { title: 'Consultations', description: 'K-codes', searchQuery: 'consultation form counseling', category: 'Consultation / Forms' },
    { title: 'Lacerations', description: 'Z-codes repair', searchQuery: 'laceration repair suture', category: 'Procedure / Surgery' },
    { title: 'Dislocations', description: 'D-codes', searchQuery: 'dislocation reduction', category: 'Dislocation' },
  ];

  useEffect(() => {
    detectTimeSlot();
    const interval = setInterval(detectTimeSlot, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const detectTimeSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    let slot: string;
    if (day === 0 || day === 6) {
      slot = 'Weekend';
    } else if (hour >= 0 && hour < 8) {
      slot = 'Night';
    } else if (hour >= 8 && hour < 17) {
      slot = 'Day';
    } else {
      slot = 'Evening';
    }
    setAutoTimeSlot(slot);
  };

  const getTimeIcon = (slot: string) => {
    switch (slot) {
      case 'Day': return <Sun className="h-4 w-4" />;
      case 'Evening': return <Sunset className="h-4 w-4" />;
      case 'Night': return <Moon className="h-4 w-4" />;
      case 'Weekend': return <Calendar className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTimeColor = (slot: string) => {
    switch (slot) {
      case 'Day': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Evening': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Night': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'Weekend': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // ── Analyze clinical text via backend API ──
  const handleAnalyze = async () => {
    if (!clinicalText.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeClinicalText({
        clinicalText,
        encounterType: 'Emergency',
        timeOfDay: timeOfDay || autoTimeSlot || undefined,
        specialty: 'Emergency Medicine',
        maxSuggestions: 10,
      });
      setAnalysis(result);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze clinical text. Make sure the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Search via backend API ──
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchBillingCodes({
        q: searchQuery,
        category: selectedCategory || undefined,
        timeOfDay: timeOfDay || undefined,
      });
      setSearchResults(results);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || 'Search failed. Make sure the backend is running.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickSearch = (qs: QuickSearch) => {
    setSearchQuery(qs.searchQuery);
    if (qs.category) setSelectedCategory(qs.category);
    // Trigger search after state update
    setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchBillingCodes({
          q: qs.searchQuery,
          category: qs.category,
        });
        setSearchResults(results);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSearching(false);
      }
    }, 100);
  };

  // ── Cart / Selected codes ──
  const addCodeToSelected = (code: BillingCode) => {
    const newCode: SelectedCode = {
      ...code,
      id: `${code.code}-${Date.now()}`,
      isEditing: false
    };
    setSelectedCodes(prev => [...prev, newCode]);
    setShowCart(true);
  };

  const removeCodeFromSelected = (id: string) => {
    setSelectedCodes(prev => prev.filter(c => c.id !== id));
  };

  const startEditingCode = (id: string) => {
    setSelectedCodes(prev => prev.map(code =>
      code.id === id
        ? { ...code, isEditing: true, editedCode: code.code, editedDescription: code.description, editedAmount: code.amount }
        : code
    ));
  };

  const saveEditedCode = (id: string) => {
    setSelectedCodes(prev => prev.map(code =>
      code.id === id
        ? { ...code, code: code.editedCode || code.code, description: code.editedDescription || code.description, amount: code.editedAmount ?? code.amount, isEditing: false }
        : code
    ));
  };

  const cancelEditingCode = (id: string) => {
    setSelectedCodes(prev => prev.map(code =>
      code.id === id ? { ...code, isEditing: false } : code
    ));
  };

  const updateEditedValue = (id: string, field: 'editedCode' | 'editedDescription' | 'editedAmount', value: string | number) => {
    setSelectedCodes(prev => prev.map(code =>
      code.id === id ? { ...code, [field]: value } : code
    ));
  };

  const handleExtractedCodes = (codes: any[]) => {
    codes.forEach(code => {
      addCodeToSelected({
        code: code.code,
        description: code.description,
        amount: code.amount,
        category: code.category,
        howToUse: code.reason || ''
      });
    });
  };

  const totalAmount = selectedCodes.reduce((sum, code) => sum + code.amount, 0);

  const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PRIMARY': return 'bg-blue-600 text-white';
      case 'ADD_ON': return 'bg-green-600 text-white';
      case 'PREMIUM': return 'bg-purple-600 text-white';
      default: return 'bg-gray-600 text-white';
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
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">OHIP Billing Assistant</h1>
              {/* Auto-detected time slot badge */}
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getTimeColor(autoTimeSlot)}`}>
                {getTimeIcon(autoTimeSlot)}
                <span>{autoTimeSlot}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600" title="Dismiss error">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-1 flex">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'search' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🔍 Search & Analyze
              </button>
              <button
                onClick={() => setActiveTab('extract')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'extract' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                ✨ Extract from Notes
              </button>
            </div>

            {activeTab === 'extract' ? (
              <BillingCodeExtractor onCodesExtracted={handleExtractedCodes} />
            ) : (
              <>
                {/* Clinical Text Analysis */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mr-4">
                      <DollarSign className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">AI Billing Analysis</h2>
                      <p className="text-gray-600">Paste clinical notes to get OHIP code suggestions with semantic search</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clinical Text
                    </label>
                    <textarea
                      value={clinicalText}
                      onChange={(e) => setClinicalText(e.target.value)}
                      placeholder="Enter clinical notes, assessment, or procedure details...

Example: 45-year-old male presents to ED at 18:30 on a Saturday with chest pain and shortness of breath. POCUS performed showing no pericardial effusion. ECG normal. Troponin pending. Patient given aspirin. Consulted cardiology by phone (12 min discussion). Form 1 completed for psychiatric hold of a second patient."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={5}
                    />
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !clinicalText.trim()}
                      className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isAnalyzing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {isAnalyzing ? 'Analyzing with AI...' : 'Analyze for Optimal OHIP Codes'}
                    </button>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search OHIP Codes
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by code, description, or procedure..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <button
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Analysis Results ── */}
                {analysis && (
                  <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTimeColor(analysis.timeSlot)}`}>
                          {getTimeIcon(analysis.timeSlot)}
                          <span>{analysis.timeSlot} billing</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {Math.round(analysis.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    
                    {/* Revenue Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Potential Revenue</div>
                        <div className="text-2xl font-bold text-green-700">
                          {formatCurrency(analysis.revenueAnalysis.potentialRevenue)}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Compliance Score
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                          {analysis.riskAssessment.complianceScore}%
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${getRiskColor(analysis.riskAssessment.overallRisk)}`}>
                        <div className="text-sm font-medium">Overall Risk</div>
                        <div className="text-2xl font-bold">{analysis.riskAssessment.overallRisk}</div>
                      </div>
                    </div>

                    {/* Risk factors */}
                    {analysis.riskAssessment.riskFactors.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center text-yellow-700 text-sm font-medium mb-1">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Risk Factors
                        </div>
                        <ul className="text-sm text-yellow-600 list-disc list-inside">
                          {analysis.riskAssessment.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Suggested Codes with role badges */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Suggested Codes</h4>
                      <div className="space-y-3">
                        {analysis.optimizations.map((opt: OptimizationSuggestion, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-bold">
                                    {opt.suggestedCode.code}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(opt.codeRole)}`}>
                                    {opt.codeRole}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(opt.riskLevel)}`}>
                                    {opt.riskLevel}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {Math.round(opt.confidence * 100)}%
                                  </span>
                                </div>
                                <p className="text-gray-900 font-medium mb-1">{opt.suggestedCode.description}</p>
                                <p className="text-sm text-gray-600 mb-2">{opt.reason}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-green-600 font-medium">
                                    {formatCurrency(opt.revenueImpact)}
                                  </span>
                                  {opt.suggestedCode.timeOfDay && (
                                    <span className="text-gray-500 flex items-center">
                                      {getTimeIcon(opt.suggestedCode.timeOfDay)}
                                      <span className="ml-1">{opt.suggestedCode.timeOfDay}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
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

                    {/* Documentation */}
                    {analysis.documentation.required.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Required Documentation</h4>
                        <div className="space-y-2">
                          {analysis.documentation.required.map((doc, i) => (
                            <div key={i} className="flex items-center text-sm text-gray-700">
                              <FileText className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                              {doc}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Explanation */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-2">AI Explanation</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{analysis.explanation}</p>
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
                      {searchResults.map((code: BillingCode, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-bold">{code.code}</span>
                                <span className="text-sm text-gray-500">{code.category}</span>
                                {code.timeOfDay && (
                                  <span className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full ${getTimeColor(code.timeOfDay)}`}>
                                    {getTimeIcon(code.timeOfDay)}
                                    <span>{code.timeOfDay}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-900 font-medium mb-1">{code.description}</p>
                              <p className="text-sm text-gray-600 mb-2">{code.howToUse}</p>
                              <div className="text-green-600 font-medium">{formatCurrency(code.amount)}</div>
                            </div>
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
            {/* Cart */}
            {showCart && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Selected Codes
                  </h3>
                  <button onClick={() => setShowCart(false)} className="text-white/80 hover:text-white" title="Close cart">
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
                              <div className="space-y-2">
                                <input type="text" value={code.editedCode || ''} onChange={(e) => updateEditedValue(code.id, 'editedCode', e.target.value)} className="w-full px-2 py-1 border rounded text-sm font-mono" placeholder="Code" />
                                <input type="text" value={code.editedDescription || ''} onChange={(e) => updateEditedValue(code.id, 'editedDescription', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Description" />
                                <input type="number" value={code.editedAmount ?? 0} onChange={(e) => updateEditedValue(code.id, 'editedAmount', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-sm" step="0.01" placeholder="Amount" />
                                <div className="flex justify-end space-x-2">
                                  <button onClick={() => cancelEditingCode(code.id)} className="p-1 text-gray-500 hover:text-gray-700" title="Cancel"><X className="h-4 w-4" /></button>
                                  <button onClick={() => saveEditedCode(code.id)} className="p-1 text-green-600 hover:text-green-700" title="Save"><Save className="h-4 w-4" /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-mono text-sm font-semibold text-gray-900">{code.code}</div>
                                  <div className="text-xs text-gray-500 mt-1">{code.description}</div>
                                  <div className="text-sm text-green-600 font-medium mt-1">{formatCurrency(code.amount)}</div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button onClick={() => startEditingCode(code.id)} className="p-1 text-blue-500 hover:text-blue-700" title="Edit"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={() => removeCodeFromSelected(code.id)} className="p-1 text-red-500 hover:text-red-700" title="Remove"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{selectedCodes.length} code{selectedCodes.length !== 1 ? 's' : ''} selected</p>
                      </div>
                      <button onClick={() => setSelectedCodes([])} className="mt-3 w-full text-sm text-red-600 hover:text-red-700 py-2">Clear All</button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Quick Searches */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Searches</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickSearches.map((qs, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(qs)}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900">{qs.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{qs.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      title="Select category"
                    >
                      <option value="">All Categories</option>
                      <option value="Assessment">Assessment (A-codes)</option>
                      <option value="Emergency">Emergency (H-codes)</option>
                      <option value="Critical Care / Procedure">Critical Care (G-codes)</option>
                      <option value="Procedure / Surgery">Procedures (Z-codes)</option>
                      <option value="Consultation / Forms">Consultations (K-codes)</option>
                      <option value="Premium">Premiums (E-codes)</option>
                      <option value="Fracture">Fractures (F-codes)</option>
                      <option value="Dislocation">Dislocations (D-codes)</option>
                      <option value="Repair">Repairs (R-codes)</option>
                      <option value="Telemedicine">Telemedicine (B-codes)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
                    <select
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      title="Select time of day"
                    >
                      <option value="">Auto ({autoTimeSlot})</option>
                      <option value="Day">Day (0800-1700)</option>
                      <option value="Evening">Evening (1700-0000)</option>
                      <option value="Night">Night (0000-0800)</option>
                      <option value="Weekend">Weekend/Holiday</option>
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
