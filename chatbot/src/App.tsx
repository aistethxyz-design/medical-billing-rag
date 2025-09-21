import React, { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import ModelSelector from './components/ModelSelector'
import Header from './components/Header'
import ErrorBoundary from './components/ErrorBoundary'
import { Message, Model } from './types'
import { queryPinecone } from './services/pineconeService'

const OPENROUTER_API_KEY = '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'

const availableModels: Model[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Most capable, balanced performance',
    maxTokens: 128000
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Advanced reasoning and analysis',
    maxTokens: 128000
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    description: 'Versatile and creative',
    maxTokens: 32768
  },
  {
    id: 'meta-llama/llama-3-8b-instruct:free',
    name: 'Llama 3 8B (Free)',
    provider: 'Meta',
    description: 'Free open source model',
    maxTokens: 8192
  },
  {
    id: 'microsoft/phi-3-mini-128k-instruct:free',
    name: 'Phi-3 Mini (Free)',
    provider: 'Microsoft',
    description: 'Free compact model',
    maxTokens: 128000
  },
  {
    id: 'google/gemma-7b-it:free',
    name: 'Gemma 7B (Free)',
    provider: 'Google',
    description: 'Free Google model',
    maxTokens: 8192
  }
]

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedModel, setSelectedModel] = useState<Model>(availableModels[0])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setIsLoading(true)

    try {
      // Enhanced system prompt for visual diagrams
      const systemPrompt = `You are an AI assistant specialized in medical analysis and healthcare. When explaining concepts, processes, or relationships:\n\n1. Use rich markdown formatting including tables, lists, and code blocks\n2. For complex processes, create Mermaid diagrams using this format:\n   \`\`\`mermaid\n   graph TD\n       A[Start] --> B[Process]\n       B --> C[End]\n   \`\`\`\n3. For workflows and decision trees, use flowcharts\n4. For hierarchical relationships, use mindmaps or org charts\n5. Always structure your responses with clear headings and formatting\n\nAvailable Mermaid diagram types:\n- Flowcharts: graph TD, graph LR\n- Sequence diagrams: sequenceDiagram\n- Class diagrams: classDiagram\n- State diagrams: stateDiagram\n- Pie charts: pie\n- Gantt charts: gantt\n\nMake your responses visually rich and informative.`

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3003',
          'X-Title': 'AI Stethoscope Chatbot'
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content }
          ],
          max_tokens: selectedModel.maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Defensive: check if data.choices and data.choices[0].message.content exist
      let assistantContent = 'Sorry, I encountered an error while processing your request.'
      if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        assistantContent = data.choices[0].message.content
      } else {
        console.error('Unexpected API response:', data)
      }
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages((prevMessages) => [...prevMessages, assistantMessage])
    } catch (error) {
      console.error('Error calling OpenRouter API:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        isError: true
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <ModelSelector
          models={availableModels}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
        />
        <ErrorBoundary>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onClearChat={handleClearChat}
            selectedModel={selectedModel}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default App 