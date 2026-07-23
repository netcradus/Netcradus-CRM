import React, { useEffect, useState } from 'react';
import useDocuments from '../../hooks/useDocuments';
import DocumentUploader from './DocumentUploader';
import DocumentViewer from './DocumentViewer';

const DocumentList = ({ entityType, entityId }) => {
  const { documents, fetchDocuments, deleteDocument, isLoading, error } = useDocuments();
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    if (entityType && entityId) {
      fetchDocuments(entityType, entityId);
    }
  }, [entityType, entityId, fetchDocuments]);

  const handleDelete = async (docId) => {
    try {
      await deleteDocument(docId);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <DocumentUploader entityType={entityType} entityId={entityId} />

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents ({documents.length})</h3>
        
        {isLoading && documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading documents...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
            No documents found for this record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{doc.label || doc.originalName}</p>
                          {doc.label && <p className="text-xs text-gray-500 truncate max-w-xs">{doc.originalName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.uploadedBy?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setViewingDoc(doc)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDelete(doc._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingDoc && (
        <DocumentViewer 
          document={viewingDoc} 
          onClose={() => setViewingDoc(null)} 
        />
      )}
    </div>
  );
};

export default DocumentList;
