import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ChevronRight, Search, Sparkles, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quickSearch, analyzeClinicalText, type BillingCode } from '@/services/billingApi';

interface AIAnswer {
  question: string;
  answer: string;
  codes: BillingCode[];
}

const NavbarAIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<AIAnswer | null>(null);
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

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setAnswer(null);

    try {
      // First try quick search for code lookups
      const codes = await quickSearch(query);

      if (codes.length > 0) {
        // Build a helpful answer from the matched codes
        const topCode = codes[0];
        const summary = codes.slice(0, 3).map(c =>
          `**${c.code}** — ${c.description} ($${c.amount.toFixed(2)})`
        ).join('\n');

        setAnswer({
          question: query,
          answer: codes.length === 1
            ? `${topCode.code}: ${topCode.description}. ${topCode.howToUse || ''} Amount: $${topCode.amount.toFixed(2)} CAD.`
            : `Found ${codes.length} matching code(s). Top results:\n${summary}`,
          codes: codes.slice(0, 5),
        });
      } else {
        // Try full analysis for longer clinical text
        if (query.split(/\s+/).length >= 3) {
          const analysis = await analyzeClinicalText({ clinicalText: query, maxSuggestions: 5 });
          setAnswer({
            question: query,
            answer: analysis.explanation || `Found ${analysis.suggestedCodes.length} code(s) for this clinical scenario.`,
            codes: analysis.suggestedCodes.slice(0, 5),
          });
        } else {
          setAnswer({
            question: query,
            answer: `No codes found for "${query}". Try more specific terms like "chest pain", "laceration repair", or a code like "H152".`,
            codes: [],
          });
        }
      }
    } catch (err) {
      console.error('NavbarAI search failed:', err);
      setAnswer({
        question: query,
        answer: 'Search failed. Please try the full Billing Assistant for detailed analysis.',
        codes: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCodeClick = (code: BillingCode) => {
    setIsOpen(false);
    navigate('/billing', { state: { searchQuery: code.code } });
  };

  const handleSeeAll = () => {
    setIsOpen(false);
    if (query.trim()) {
      navigate('/billing', { state: { searchQuery: query } });
    } else {
      navigate('/billing');
    }
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
        title="Ask AI about billing codes"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Ask AI</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">OHIP Billing AI</span>
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
                placeholder="Search codes, e.g. 'chest pain' or 'H152'..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                onClick={handleSearch}
                disabled={!query.trim() || isLoading}
                title="Search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">Searching OHIP codes...</span>
              </div>
            ) : answer ? (
              <div className="space-y-3">
                {/* Text answer */}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{answer.answer}</p>

                {/* Code cards */}
                {answer.codes.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {answer.codes.map((code) => (
                      <button
                        key={code.code}
                        onClick={() => handleCodeClick(code)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-bold bg-gray-100 px-2 py-0.5 rounded">
                              {code.code}
                            </span>
                            {code.timeOfDay && (
                              <span className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-0.5" />
                                {code.timeOfDay}
                              </span>
                            )}
                          </div>
                          <span className="text-green-600 text-sm font-medium flex items-center">
                            <DollarSign className="w-3 h-3" />
                            {code.amount.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{code.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Ask about OHIP billing codes</p>
                <p className="text-xs mt-1 text-gray-400">
                  Try: "critical care", "H152", "laceration repair", or paste clinical notes
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <button
              onClick={handleSeeAll}
              className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>Open Full Billing Assistant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarAIAgent;
