import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw
} from 'lucide-react';

interface ExtractedCode {
  code: string;
  description: string;
  amount: number;
  confidence: number;
  reason: string;
  category: string;
}

interface ExtractionResult {
  codes: ExtractedCode[];
  totalAmount: number;
  rawText: string;
  extractedProcedures: string[];
  extractedDiagnoses: string[];
}

interface BillingCodeExtractorProps {
  onCodesExtracted?: (codes: ExtractedCode[]) => void;
}

// Mock billing codes database for extraction
const BILLING_CODES_DB: Record<string, { description: string; amount: number; category: string; keywords: string[] }> = {
  'H152': { description: 'Comprehensive assessment - Default for most ER patients', amount: 63.30, category: 'Emergency', keywords: ['assessment', 'comprehensive', 'evaluation', 'examination', 'weekend', 'holiday'] },
  'H102': { description: 'Comprehensive assessment - Weekday hours', amount: 37.20, category: 'Emergency', keywords: ['assessment', 'comprehensive', 'evaluation', 'weekday'] },
  'H101': { description: 'Minor assessment', amount: 15.00, category: 'Emergency', keywords: ['minor', 'brief', 'simple', 'quick'] },
  'H103': { description: 'Multiple systems assessment - High-acuity', amount: 35.65, category: 'Emergency', keywords: ['multiple systems', 'high acuity', 'complex', 'extensive'] },
  'G521': { description: 'Life Threatening Critical Care – First 15 min', amount: 110.55, category: 'Critical Care', keywords: ['critical', 'life threatening', 'resuscitation', 'intubation', 'defibrillation', 'cardiac arrest'] },
  'G523': { description: 'Life Threatening Critical Care – 2nd 15 min', amount: 55.20, category: 'Critical Care', keywords: ['critical', 'life threatening', 'continued', 'additional'] },
  'H100': { description: 'Bedside Ultrasound (POCUS)', amount: 19.65, category: 'Procedures', keywords: ['ultrasound', 'pocus', 'echo', 'imaging', 'tamponade', 'aaa'] },
  'A888': { description: 'Special visit premium – Emergency Department', amount: 20.65, category: 'Premium', keywords: ['special visit', 'called in', 'on call'] },
  'E412': { description: 'After Hours Procedures bonus', amount: 0, category: 'Premium', keywords: ['after hours', 'evening', 'night', '17:00', '5pm'] },
  'K623': { description: 'Form 1', amount: 104.80, category: 'Forms', keywords: ['form 1', 'mental health', 'psychiatric', 'involuntary'] },
  'K734': { description: 'ED MD to NON CritiCALL consultation', amount: 31.35, category: 'Consultation', keywords: ['consult', 'consultation', 'specialist', 'referral'] },
  'A003': { description: 'General assessment', amount: 77.20, category: 'Assessment', keywords: ['general assessment', 'full assessment', 'complete'] },
  'A004': { description: 'Medical specific assessment', amount: 43.10, category: 'Assessment', keywords: ['focused', 'specific', 'cardiovascular', 'respiratory'] },
  'A901': { description: 'Certification of death', amount: 20.00, category: 'Certification', keywords: ['death', 'pronounce', 'deceased', 'expired'] },
  'B100A': { description: 'First Telemedicine Patient Encounter premium', amount: 35.00, category: 'Telemedicine', keywords: ['telemedicine', 'virtual', 'video', 'remote'] },
};

const BillingCodeExtractor: React.FC<BillingCodeExtractorProps> = ({ onCodesExtracted }) => {
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const extractCodesFromText = useCallback((text: string): ExtractionResult => {
    const normalizedText = text.toLowerCase();
    const extractedCodes: ExtractedCode[] = [];
    const extractedProcedures: string[] = [];
    const extractedDiagnoses: string[] = [];

    // Extract procedures and diagnoses mentioned
    const procedureKeywords = ['intubation', 'cpr', 'defibrillation', 'ultrasound', 'suture', 'laceration repair', 'chest tube', 'central line', 'iv access'];
    const diagnosisKeywords = ['chest pain', 'shortness of breath', 'abdominal pain', 'trauma', 'fracture', 'mi', 'stroke', 'sepsis', 'pneumonia'];

    procedureKeywords.forEach(proc => {
      if (normalizedText.includes(proc)) {
        extractedProcedures.push(proc);
      }
    });

    diagnosisKeywords.forEach(diag => {
      if (normalizedText.includes(diag)) {
        extractedDiagnoses.push(diag);
      }
    });

    // Match billing codes based on keywords
    Object.entries(BILLING_CODES_DB).forEach(([code, data]) => {
      const matchedKeywords = data.keywords.filter(kw => normalizedText.includes(kw));
      if (matchedKeywords.length > 0) {
        const confidence = Math.min(0.95, 0.5 + (matchedKeywords.length * 0.15));
        extractedCodes.push({
          code,
          description: data.description,
          amount: data.amount,
          confidence,
          reason: `Matched keywords: ${matchedKeywords.join(', ')}`,
          category: data.category
        });
      }
    });

    // Detect time of day for appropriate H-codes
    const isWeekend = normalizedText.includes('weekend') || normalizedText.includes('saturday') || normalizedText.includes('sunday') || normalizedText.includes('holiday');
    const isEvening = normalizedText.includes('evening') || normalizedText.includes('night') || normalizedText.includes('after hours') || normalizedText.includes('17:') || normalizedText.includes('18:') || normalizedText.includes('19:') || normalizedText.includes('20:') || normalizedText.includes('21:') || normalizedText.includes('22:') || normalizedText.includes('23:');

    // Adjust H-codes based on time
    const hasComprehensive = extractedCodes.some(c => c.code === 'H102' || c.code === 'H152' || c.code === 'H132');
    if (!hasComprehensive && (normalizedText.includes('assessment') || normalizedText.includes('examined') || normalizedText.includes('evaluated'))) {
      if (isWeekend) {
        extractedCodes.push({
          code: 'H152',
          description: 'Comprehensive assessment - Weekend/Holiday',
          amount: 63.30,
          confidence: 0.85,
          reason: 'Detected assessment on weekend/holiday',
          category: 'Emergency'
        });
      } else if (isEvening) {
        extractedCodes.push({
          code: 'H132',
          description: 'Comprehensive assessment - Evening hours',
          amount: 46.30,
          confidence: 0.85,
          reason: 'Detected assessment during evening hours',
          category: 'Emergency'
        });
      } else {
        extractedCodes.push({
          code: 'H102',
          description: 'Comprehensive assessment - Weekday hours',
          amount: 37.20,
          confidence: 0.80,
          reason: 'Detected assessment during regular hours',
          category: 'Emergency'
        });
      }
    }

    // Critical care detection
    if (normalizedText.includes('critical') || normalizedText.includes('resuscitation') || normalizedText.includes('code blue') || normalizedText.includes('cardiac arrest')) {
      if (!extractedCodes.some(c => c.code === 'G521')) {
        extractedCodes.push({
          code: 'G521',
          description: 'Life Threatening Critical Care – First 15 min',
          amount: 110.55,
          confidence: 0.90,
          reason: 'Critical care scenario detected',
          category: 'Critical Care'
        });
      }
    }

    // Remove duplicates
    const uniqueCodes = extractedCodes.filter((code, index, self) =>
      index === self.findIndex(c => c.code === code.code)
    );

    // Sort by confidence
    uniqueCodes.sort((a, b) => b.confidence - a.confidence);

    const totalAmount = uniqueCodes.reduce((sum, code) => sum + code.amount, 0);

    return {
      codes: uniqueCodes,
      totalAmount,
      rawText: text,
      extractedProcedures,
      extractedDiagnoses
    };
  }, []);

  const handleExtract = async () => {
    if (!inputText.trim()) {
      setError('Please enter clinical text to analyze');
      return;
    }

    setIsExtracting(true);
    setError(null);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const extractionResult = extractCodesFromText(inputText);
      setResult(extractionResult);
      
      if (onCodesExtracted) {
        onCodesExtracted(extractionResult.codes);
      }
    } catch (err) {
      setError('Failed to extract billing codes. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      const text = await file.text();
      setInputText(text);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      setInputText(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Billing Code Extractor</h2>
            <p className="text-purple-100 text-sm">Extract billing codes from clinical notes automatically</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Input Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doctor's Notes / Clinical Report
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste clinical notes, doctor's report, or drag and drop a text file...

Example:
Patient presented to ED at 18:30 on Saturday with chest pain. Comprehensive assessment performed. POCUS showed no pericardial effusion. ECG and troponin ordered. Patient monitored for 4 hours. Discharged with cardiology follow-up."
              className="w-full h-48 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-transparent"
              rows={8}
            />
            
            {/* Upload hint */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <label className="flex items-center space-x-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="text-xs">Upload</span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Extract Button */}
        <button
          onClick={handleExtract}
          disabled={isExtracting || !inputText.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Clinical Notes...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Extract Billing Codes</span>
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Codes Found</div>
                <div className="text-2xl font-bold text-blue-700">{result.codes.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Total Amount</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(result.totalAmount)}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Procedures Detected</div>
                <div className="text-2xl font-bold text-purple-700">{result.extractedProcedures.length}</div>
              </div>
            </div>

            {/* Detected Info */}
            {(result.extractedProcedures.length > 0 || result.extractedDiagnoses.length > 0) && (
              <div className="bg-gray-50 rounded-lg p-4">
                {result.extractedProcedures.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Procedures: </span>
                    <span className="text-sm text-gray-600">{result.extractedProcedures.join(', ')}</span>
                  </div>
                )}
                {result.extractedDiagnoses.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Diagnoses: </span>
                    <span className="text-sm text-gray-600">{result.extractedDiagnoses.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Codes List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Extracted Billing Codes</h3>
              {result.codes.map((code, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm bg-gray-900 text-white px-2 py-1 rounded">
                          {code.code}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(code.confidence)}`}>
                          {Math.round(code.confidence * 100)}% confidence
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {code.category}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{code.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{code.reason}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(code.amount)}</div>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Copy code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setResult(null);
                setInputText('');
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Analyze New Text</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingCodeExtractor;
