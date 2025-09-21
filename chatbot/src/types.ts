export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  isError?: boolean
}

export interface Model {
  id: string
  name: string
  provider: string
  description: string
  maxTokens: number
}

export interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading: boolean
  onClearChat: () => void
  selectedModel: Model
}

export interface ModelSelectorProps {
  models: Model[]
  selectedModel: Model
  onModelSelect: (model: Model) => void
} 