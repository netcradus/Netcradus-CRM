// Frontend service for Leads (API calls)
import axios from 'axios';

const API_URL = "http://localhost:5000/api/leads"; // backend endpoint

export const getLeads = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getLeadById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createLead = async (leadData) => {
  const response = await axios.post(API_URL, leadData);
  return response.data;
};

export const updateLead = async (id, leadData) => {
  const response = await axios.put(`${API_URL}/${id}`, leadData);
  return response.data;
};

export const deleteLead = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
