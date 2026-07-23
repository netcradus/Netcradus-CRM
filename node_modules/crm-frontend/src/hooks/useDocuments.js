import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Helper to get auth header
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Fallback if using localStorage
    return {
      Authorization: `Bearer ${token}`
    };
  };

  const fetchDocuments = useCallback(async (entityType, entityId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/documents/${entityType}/${entityId}`, {
        headers: getAuthHeaders()
      });
      setDocuments(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDocument = async (file, entityType, entityId, label) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    if (label) formData.append('label', label);

    try {
      const response = await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Add new doc to list
      setDocuments(prev => [response.data.data, ...prev]);
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to upload document';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/documents/${documentId}`, {
        headers: getAuthHeaders()
      });
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProxyViewUrl = (documentId) => {
    return `${API_URL}/documents/view/${documentId}`;
  };

  return {
    documents,
    isLoading,
    error,
    uploadProgress,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    getProxyViewUrl,
    getAuthHeaders // Exposed so we can fetch with it in the viewer if needed
  };
};

export default useDocuments;
