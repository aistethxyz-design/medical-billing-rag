import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Eye,
  Download,
  Trash2
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedText?: string;
  analyzedCodes?: any[];
  errorMessage?: string;
}

const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Simulate file upload and processing
    newFiles.forEach(file => {
      simulateFileProcessing(file.id);
    });
  }, []);

  const simulateFileProcessing = (fileId: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = Math.min(file.progress + 10, 100);
          if (newProgress === 100) {
            clearInterval(uploadInterval);
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { ...f, status: 'processing', progress: 0 }
                  : f
              ));
              simulateAIProcessing(fileId);
            }, 500);
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const simulateAIProcessing = (fileId: string) => {
    // Simulate AI processing
    const processingInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'processing') {
          const newProgress = Math.min(file.progress + 8, 100);
          if (newProgress === 100) {
            clearInterval(processingInterval);
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { 
                      ...f, 
                      status: 'completed', 
                      progress: 100,
                      extractedText: 'Sample clinical text extracted from document...',
                      analyzedCodes: [
                        { code: '99214', type: 'CPT', description: 'Office visit, established patient' },
                        { code: 'M79.89', type: 'ICD-10', description: 'Other specified soft tissue disorders' }
                      ]
                    }
                  : f
              ));
            }, 500);
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 300);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-purple-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'processing':
        return `AI Processing... ${file.progress}%`;
      case 'completed':
        return 'Processing complete';
      case 'error':
        return file.errorMessage || 'Processing failed';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Document Upload</h1>
        <p className="text-gray-600">Upload medical documents for AI-powered code analysis</p>
      </div>

      {/* Upload Zone */}
      <div className="medical-card p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                PDF, DOCX, TXT files up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* Supported Formats */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>PDF Documents</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Word Documents</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Text Files</span>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="medical-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({files.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {files.map(file => (
              <div key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{getStatusText(file)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'completed' && (
                      <>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {(file.status === 'uploading' || file.status === 'processing') && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {file.status === 'uploading' ? 'Uploading' : 'AI Processing'}
                      </span>
                      <span className="text-gray-600">{file.progress}%</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          file.status === 'uploading' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Extracted Codes */}
                {file.status === 'completed' && file.analyzedCodes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Extracted Medical Codes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {file.analyzedCodes.map((code, index) => (
                        <span
                          key={index}
                          className={`code-badge ${
                            code.type === 'CPT' ? 'code-badge-cpt' : 'code-badge-icd'
                          }`}
                        >
                          {code.code} - {code.description}
                        </span>
                      ))}
                    </div>
                    <button className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View full analysis →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Summary */}
      {files.some(f => f.status === 'completed') && (
        <div className="medical-card p-6 border-l-4 border-l-green-400 bg-green-50">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">
                Documents Processed Successfully
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {files.filter(f => f.status === 'completed').length} documents have been analyzed. 
                <a href="/coding" className="font-medium underline hover:no-underline ml-1">
                  Review coding suggestions
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="medical-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Tips for Best Results
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Clear Documentation</p>
                <p className="text-sm text-gray-600">
                  Ensure medical documents include detailed clinical notes and encounter information
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Legible Text</p>
                <p className="text-sm text-gray-600">
                  For scanned documents, ensure text is clear and readable for accurate OCR processing
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Complete Information</p>
                <p className="text-sm text-gray-600">
                  Include patient symptoms, diagnoses, procedures, and provider assessments
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">HIPAA Compliance</p>
                <p className="text-sm text-gray-600">
                  All uploaded documents are automatically de-identified and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 