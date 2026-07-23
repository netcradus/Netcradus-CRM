import React, { useState } from 'react';
import useDocuments from '../../hooks/useDocuments';

const DocumentViewer = ({ document, onClose }) => {
  const { getProxyViewUrl, getAuthHeaders } = useDocuments();
  const [loading, setLoading] = useState(true);

  if (!document) return null;

  const url = getProxyViewUrl(document._id);
  
  // Appending token to URL directly for iframes/images is insecure and often blocked 
  // depending on strict CSP or browser behavior. 
  // However, since we must authenticate the proxy route:
  // We can either fetch the blob and create an object URL, or simply pass token in query (discouraged).
  // For a production CRM reading images & PDFs, fetching a blob is the safest robust approach.

  const [blobUrl, setBlobUrl] = useState('');
  
  React.useEffect(() => {
    let objectUrl = '';
    const fetchBlob = async () => {
      try {
        const response = await fetch(url, {
          headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to load document');
        
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlob();
    
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  const isImage = document.mimeType.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold truncate pr-4" title={document.label || document.originalName}>
            {document.label || document.originalName}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 overflow-auto relative">
          {loading && (
             <div className="flex flex-col items-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                 <p className="text-gray-600">Loading secure document...</p>
             </div>
          )}

          {!loading && blobUrl && isImage && (
            <img 
              src={blobUrl} 
              alt={document.safeName} 
              className="max-w-full max-h-full object-contain shadow-sm"
            />
          )}

          {!loading && blobUrl && isPdf && (
            <iframe 
              src={blobUrl} 
              className="w-full h-full border-0"
              title={document.safeName}
            />
          )}

          {!loading && blobUrl && !isImage && !isPdf && (
            <div className="text-center p-8 bg-white rounded shadow max-w-sm">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-gray-700 mb-4">Preview not available for this file type.</p>
                <a 
                    href={blobUrl}
                    download={document.originalName}
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
                >
                    Download File
                </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
