import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ChevronRight, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAnswer {
  question: string;
  answer: string;
  relatedCodes?: string[];
}

const NavbarAIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<QuickAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick answers database for common billing questions
  const getQuickAnswer = (input: string): QuickAnswer | null => {
    const normalizedInput = input.toLowerCase();

    // Common billing code questions
    if (normalizedInput.includes('h152') || normalizedInput.includes('comprehensive assessment')) {
      return {
        question: input,
        answer: 'H152 is a Comprehensive Assessment code for ER patients requiring moderate evaluation. Use this on Weekends and Holidays. Amount: $63.30 CAD.',
        relatedCodes: ['H152', 'H102', 'H132']
      };
    }

    if (normalizedInput.includes('critical care') || normalizedInput.includes('g521')) {
      return {
        question: input,
        answer: 'G521 is for Life Threatening Critical Care (First 15 min). Up to 3 MDs can bill. Includes IVs, arterial lines, intubations, catheters, defibrillations. Amount: $110.55 CAD.',
        relatedCodes: ['G521', 'G523', 'G524']
      };
    }

    if (normalizedInput.includes('after hours') || normalizedInput.includes('e412') || normalizedInput.includes('premium')) {
      return {
        question: input,
        answer: 'E412 is the After Hours Procedures bonus for MON-FRI 1700-0000. It provides a 20% bonus to billings when timing conditions are met.',
        relatedCodes: ['E412', 'E409', 'E410']
      };
    }

    if (normalizedInput.includes('ultrasound') || normalizedInput.includes('pocus') || normalizedInput.includes('h100')) {
      return {
        question: input,
        answer: 'H100 is for Bedside Ultrasound (POCUS). Use for suspected pericardial tamponade, cardiac standstill, free abdominal fluid, ruptured AAA, or ectopic pregnancy. Max 2 scans per patient per day. Amount: $19.65 CAD.',
        relatedCodes: ['H100']
      };
    }

    if (normalizedInput.includes('form 1') || normalizedInput.includes('k623')) {
      return {
        question: input,
        answer: 'K623 is for Form 1 completion. Add this code if Form 1 is completed or performed during visit/encounter. Amount: $104.80 CAD.',
        relatedCodes: ['K623']
      };
    }

    if (normalizedInput.includes('minor assessment') || normalizedInput.includes('h101')) {
      return {
        question: input,
        answer: 'H101 is a Minor Assessment code for Mon-Fri 0800-1700. Use for brief, straightforward patient encounters. Amount: $15.00 CAD. After hours use H131 ($18.70) or H151 for weekends ($25.50).',
        relatedCodes: ['H101', 'H131', 'H151']
      };
    }

    if (normalizedInput.includes('telemedicine') || normalizedInput.includes('b100')) {
      return {
        question: input,
        answer: 'B100A is the First Telemedicine Patient Encounter premium. Bill for the first telemedicine patient encounter of the day. Amount: $35.00 CAD.',
        relatedCodes: ['B100A']
      };
    }

    if (normalizedInput.includes('consultation') || normalizedInput.includes('k734')) {
      return {
        question: input,
        answer: 'K734 is for ED MD to NON CritiCALL consultations. Requires minimum 10 minutes discussion between referring and consulted MD. Document start/stop time, consultant name, reasons, and recommendations. Amount: $31.35 CAD.',
        relatedCodes: ['K734']
      };
    }

    // Generic response for unmatched queries
    return {
      question: input,
      answer: `I found information related to "${input}". For detailed billing code analysis and recommendations, please use the full RAG Assistant.`,
      relatedCodes: []
    };
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      const result = getQuickAnswer(query);
      setAnswer(result);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSeeAll = () => {
    setIsOpen(false);
    navigate('/billing');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Ask AI</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">AI Quick Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              title="Close"
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about billing codes, procedures..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                onClick={handleSearch}
                disabled={!query.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Answer Section */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">Thinking...</span>
              </div>
            ) : answer ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">{answer.answer}</p>
                
                {answer.relatedCodes && answer.relatedCodes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {answer.relatedCodes.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded-md"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me about billing codes, procedures, or OHIP guidelines</p>
              </div>
            )}
          </div>

          {/* See All Link */}
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <button
              onClick={handleSeeAll}
              className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>Open Full RAG Assistant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarAIAgent;
