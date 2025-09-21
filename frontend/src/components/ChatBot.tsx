import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm AISteth, your AI medical assistant. I can help you with medical coding, clinical guidelines, OHIP billing, dose calculators, and practice management. How can I assist you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputText),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('99213') || input.includes('99214')) {
      return "99213 and 99214 are evaluation and management codes for established patients. 99213 is typically for low to moderate complexity visits (15-20 minutes), while 99214 is for moderate to high complexity visits (25-30 minutes). The difference often comes down to medical decision making complexity and time spent with the patient.";
    }
    
    if (input.includes('modifier') || input.includes('-25') || input.includes('-59')) {
      return "Medical coding modifiers provide additional information about procedures. Modifier -25 indicates a significant, separately identifiable E/M service by the same physician on the same day as a procedure. Modifier -59 indicates distinct procedural services. Always ensure proper documentation supports modifier usage to avoid claim denials.";
    }
    
    if (input.includes('icd') || input.includes('diagnosis')) {
      return "ICD-10 codes describe diagnoses and conditions. Make sure to code to the highest level of specificity supported by the documentation. Always use the most current ICD-10-CM guidelines and check for any new updates or changes that might affect your coding.";
    }
    
    if (input.includes('billing') || input.includes('revenue') || input.includes('ohip')) {
      return "For OHIP billing optimization, I can help you choose the appropriate fee codes based on your clinical documentation. I can assist with complex visit assessments, procedure billing, and ensuring proper documentation supports your billing choices to maximize revenue while maintaining compliance.";
    }
    
    if (input.includes('dose') || input.includes('calculator') || input.includes('medication')) {
      return "I can help you with medication dosing calculations based on patient weight, age, kidney function, and other clinical factors. I can provide dosing guidelines for common medications and help you adjust doses for special populations like pediatric or geriatric patients.";
    }

    return "I'm AISteth, your comprehensive medical AI assistant. I can help with medical coding (CPT, ICD-10), OHIP billing optimization, clinical guidelines, dose calculators, practice management, and administrative tasks. Feel free to ask me anything about your medical practice!";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 animate-pulse-glow"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">AISteth Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isBot
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about medical coding, OHIP billing, or clinical guidelines..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ask me about medical coding, OHIP billing, clinical guidelines, dose calculators, and practice management.
        </p>
      </div>
    </div>
  );
};

export default ChatBot; 