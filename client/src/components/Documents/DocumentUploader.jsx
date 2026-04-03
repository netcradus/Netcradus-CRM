import React, { useState, useRef } from 'react';
import useDocuments from '../../hooks/useDocuments';

const DocumentUploader = ({ entityType, entityId }) => {
  const { uploadDocument, uploadProgress, isLoading, error } = useDocuments();
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  const validateFile = (selectedFile) => {
    setLocalError('');
    if (!selectedFile) return false;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setLocalError('File size exceeds the 20MB limit.');
      return false;
    }

    const type = selectedFile.type;
    const isImage = type.startsWith('image/');
    const isPdf = type === 'application/pdf';
    const isWord = type.includes('msword') || type.includes('wordprocessingml');
    const isExcel = type.includes('ms-excel') || type.includes('spreadsheetml');

    if (!isImage && !isPdf && !isWord && !isExcel) {
      setLocalError('Invalid file type. Only images, PDFs, Word, and Excel files are allowed.');
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateFile(droppedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      await uploadDocument(file, entityType, entityId, label);
      setFile(null);
      setLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Document</h3>
      
      {(error || localError) && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error || localError}
        </div>
      )}

      <form onSubmit={handleUpload}>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className="text-sm font-medium text-blue-600 py-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          ) : (
            <div className="text-gray-500 py-4">
              <p className="mb-2">Drag and drop your file here, or click to browse.</p>
              <p className="text-xs">Max size: 20MB. Formats: PDF, Image, DOCX, XLSX.</p>
            </div>
          )}
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>

        {file && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label / Title (Optional)</label>
              <input 
                type="text" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NDA Contract Signed"
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default DocumentUploader;
