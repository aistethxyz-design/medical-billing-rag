import React from 'react'
import { Check, Zap, Brain, Shield } from 'lucide-react'
import { ModelSelectorProps } from '../types'

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelSelect
}) => {
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return <Brain className="w-4 h-4 text-green-600" />
      case 'anthropic':
        return <Shield className="w-4 h-4 text-blue-600" />
      case 'google':
        return <Zap className="w-4 h-4 text-yellow-600" />
      case 'meta':
        return <Brain className="w-4 h-4 text-purple-600" />
      default:
        return <Zap className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">AI Model</h2>
        <p className="text-sm text-gray-600">
          Choose your preferred AI model for the conversation
        </p>
      </div>

      <div className="space-y-3">
        {models.map((model) => (
          <div
            key={model.id}
            onClick={() => onModelSelect(model)}
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedModel.id === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            {selectedModel.id === model.id && (
              <div className="absolute top-2 right-2">
                <Check className="w-5 h-5 text-blue-600" />
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getProviderIcon(model.provider)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {model.name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                    {model.provider}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {model.description}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Max tokens: {model.maxTokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">Current Model</span>
        </div>
        <p className="text-sm text-blue-700">
          {selectedModel.name} by {selectedModel.provider}
        </p>
      </div>
    </div>
  )
}

export default ModelSelector 