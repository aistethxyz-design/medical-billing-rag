# AISteth Chatbot

A beautiful, modern chatbot interface powered by OpenRouter API with support for multiple AI models.

## Features

- 🎨 **Aesthetically Pleasing UI**: Modern, responsive design with smooth animations
- 🤖 **Multiple AI Models**: Choose from GPT-4o, Claude, Gemini, and more
- 💬 **Real-time Chat**: Instant messaging with typing indicators
- 🏥 **Medical Specialized**: Optimized for medical coding and healthcare analysis
- ⚡ **Fast & Responsive**: Built with React and Vite for optimal performance
- 🎯 **Easy Model Selection**: Simple interface to switch between different AI models

## Available Models

- **GPT-4o** (OpenAI) - Most capable model for complex tasks
- **GPT-4o Mini** (OpenAI) - Fast and efficient for most tasks
- **Claude 3.5 Sonnet** (Anthropic) - Excellent reasoning and analysis
- **Claude 3 Haiku** (Anthropic) - Fast and cost-effective
- **Gemini Pro** (Google) - Versatile and creative
- **Llama 3.1 8B** (Meta) - Open source and efficient

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:3002`

## Usage

1. **Select a Model**: Choose your preferred AI model from the sidebar
2. **Start Chatting**: Type your message and press Enter or click Send
3. **Clear Chat**: Use the "Clear" button to start a new conversation
4. **Switch Models**: Change models anytime during your conversation

## API Configuration

The chatbot uses OpenRouter API with the following configuration:
- **API Key**: Pre-configured in the application
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Models**: Various models from OpenAI, Anthropic, Google, and Meta

## Development

### Project Structure
```
chatbot/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   ├── ModelSelector.tsx
│   │   └── Header.tsx
│   ├── types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **OpenRouter API** - AI model access

## Customization

### Adding New Models

To add a new model, update the `availableModels` array in `src/App.tsx`:

```typescript
{
  id: 'provider/model-name',
  name: 'Display Name',
  provider: 'Provider Name',
  description: 'Model description',
  maxTokens: 32000
}
```

### Styling

The application uses Tailwind CSS for styling. Custom styles can be added in `src/index.css` or by extending the Tailwind configuration in `tailwind.config.js`.

## License

MIT License - feel free to use this project for your own applications.

## Support

For issues or questions, please refer to the main AISteth project documentation. 