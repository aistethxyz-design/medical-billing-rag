# AISteth - AI-Powered Medical Assistant Platform

AISteth is a comprehensive medical AI assistant platform designed for healthcare providers, offering intelligent medical coding, document processing, and clinical decision support.

## 🚀 Quick Start

### Prerequisites
- **Node.js 20 LTS** (Windows x64 recommended for best performance)
- **npm** (comes with Node.js)
- **PowerShell** (for Windows setup)

### One-Command Setup

**Option 1: Using the setup script (Recommended)**
```bash
# Double-click setup.bat or run:
setup.bat
```

**Option 2: Using npm commands**
```bash
# Install everything and start the app
npm run start
```

**Option 3: Manual setup**
```bash
# Install dependencies
npm run setup

# Start development servers
npm run dev
```

## 📱 Access the Application

After setup, the application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

### Demo Login Credentials
- **Email:** `demo@aisteth.com`
- **Password:** `demo123`

## 🛠️ Available Commands

### Development
```bash
npm run dev              # Start both frontend and backend servers
npm run dev:frontend     # Start only frontend server
npm run dev:backend      # Start only backend server
```

### Setup & Maintenance
```bash
npm run setup            # Complete setup (install + configure)
npm run install:all      # Install all dependencies
npm run reset            # Clean everything and reinstall
npm run clean            # Clean node_modules and Prisma cache
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push database schema
npm run db:studio        # Open Prisma Studio (database GUI)
```

### Production
```bash
npm run build            # Build for production
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
```

## 🏗️ Project Structure

```
AISteth/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state management
│   │   └── styles/         # CSS and Tailwind styles
│   └── package.json
├── backend/                  # Express + TypeScript backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── setup.ps1               # PowerShell setup script
├── setup.bat               # Windows batch setup script
└── package.json            # Root package.json with scripts
```

## 🔧 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **React Query** - Data fetching
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **SQLite** - Database (development)
- **JWT** - Authentication
- **bcrypt** - Password hashing

### AI & ML
- **OpenAI GPT-4** - Natural language processing
- **Custom medical coding logic** - ICD-10 and CPT code optimization

## 🏥 Features

### Core Features
- **Medical Document Processing** - Upload and analyze medical documents
- **AI-Powered Coding** - Intelligent ICD-10 and CPT code suggestions
- **Code Optimization** - Identify potential coding improvements
- **Practice Analytics** - Comprehensive practice performance metrics
- **Patient Management** - HIPAA-compliant patient data handling
- **Audit Trail** - Complete activity logging for compliance

### AI Capabilities
- **Natural Language Processing** - Extract medical information from text
- **Code Suggestion** - Suggest appropriate medical codes
- **Optimization Analysis** - Identify coding improvements and revenue opportunities
- **Clinical Decision Support** - Provide evidence-based recommendations

## 🔒 Security & Compliance

- **HIPAA Compliant** - Patient data protection
- **JWT Authentication** - Secure user sessions
- **Audit Logging** - Complete activity tracking
- **Data Encryption** - Sensitive data protection
- **Role-Based Access** - Provider, Coder, Biller, Admin roles

## 🐛 Troubleshooting

### Common Issues

**1. Prisma Engine Error**
```
Error: query_engine-windows.dll.node is not a valid Win32 application
```
**Solution:** The setup script automatically configures Prisma to use WASM engine for Windows ARM64 compatibility.

**2. Missing Dependencies**
```
Cannot find module '@tailwindcss/typography'
```
**Solution:** Run `npm run setup` to install all required dependencies.

**3. Port Already in Use**
```
Port 3000 is in use, trying another one...
```
**Solution:** The application will automatically use the next available port.

**4. Node.js Architecture Issues**
```
You're running Windows ARM64 Node.js
```
**Solution:** This is handled automatically with Prisma WASM engine. For better performance, consider installing Windows x64 Node.js.

### Reset Everything
If you encounter persistent issues:
```bash
npm run reset
```

## 📚 Documentation

- **API Documentation** - Available at http://localhost:3001/docs (when running)
- **Database Schema** - See `backend/prisma/schema.prisma`
- **Component Library** - See `frontend/src/components/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review the documentation
- Open an issue on GitHub

---

**AISteth** - Empowering healthcare providers with AI-driven insights and efficiency. 