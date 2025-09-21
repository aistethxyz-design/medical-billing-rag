import React from 'react'
import { Stethoscope, Brain, Sparkles } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="relative">
          <Stethoscope className="w-8 h-8 text-blue-600" />
          <Brain className="w-4 h-4 text-purple-600 absolute -top-1 -right-1" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AISteth
        </h1>
        <Sparkles className="w-6 h-6 text-yellow-500" />
      </div>
      <p className="text-gray-600 text-lg font-medium">
        AI-Powered Medical Assistant & Coding Analysis
      </p>
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Powered by OpenRouter
        </span>
        <span>•</span>
        <span>Multiple AI Models</span>
        <span>•</span>
        <span>Real-time Chat</span>
      </div>
    </header>
  )
}

export default Header 