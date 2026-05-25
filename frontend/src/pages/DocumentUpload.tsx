import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { analyzeDocument, type DocumentCodeMatch } from '@/services/documentsApi';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedPreview?: string;
  analyzedCodes?: DocumentCodeMatch[];
  errorMessage?: string;
}

const DocumentUpload: React.FC = () => {
  const { token } = useAuthStore();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const processFile = async (fileId: string, file: File) => {
    if (!token) {
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: 'error', errorMessage: 'Not signed in' } : f));
      return;
    }
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: 'processing', progress: 50 } : f));
    try {
      const result = await analyzeDocument(token, file);
      setFiles((prev) => prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              status: 'completed',
              progress: 100,
              extractedPreview: result.extractedPreview,
              analyzedCodes: result.codes,
            }
          : f
      ));
      toast.success(`Found ${result.codes.length} applicable OHIP codes`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: 'error', errorMessage: msg } : f));
      toast.error(msg);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const id = Math.random().toString(36).slice(2, 11);
      setFiles((prev) => [...prev, {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
      }]);
      setTimeout(() => {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'processing', progress: 30 } : f));
        processFile(id, file);
      }, 300);
    });
  }, [token]);

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
        <p className="text-gray-600">Upload a PDF or document to find applicable OHIP billing codes</p>
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
                      Applicable OHIP codes ({file.analyzedCodes.length})
                    </h4>
                    <ul className="space-y-2">
                      {file.analyzedCodes.map((code) => (
                        <li key={code.code} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2">
                          <div>
                            <span className="font-mono font-bold text-blue-700">{code.code}</span>
                            <span className="text-gray-700 ml-2">{code.description}</span>
                            {code.howToUse && <p className="text-xs text-gray-500 mt-0.5">{code.howToUse}</p>}
                          </div>
                          <span className="font-medium text-green-700 whitespace-nowrap ml-2">
                            ${code.amount.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {file.extractedPreview && (
                      <p className="text-xs text-gray-500 mt-3 line-clamp-2">{file.extractedPreview}…</p>
                    )}
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
                {files.filter(f => f.status === 'completed').length} document(s) analyzed for OHIP codes.
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