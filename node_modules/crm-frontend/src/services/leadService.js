// Frontend service for Leads (API calls)
import axios from 'axios';
import { apiUrl } from "../config/api";

const API_URL = apiUrl("/leads");

const getToken = () => localStorage.getItem("token");

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// Fetch all leads (public)
export const getLeads = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch leads" };
  }
};

// Fetch single lead (protected)
export const getLeadById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch lead" };
  }
};

// Create new lead (protected)
export const createLead = async (leadData) => {
  try {
    const response = await axios.post(API_URL, leadData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create lead" };
  }
};

// Update lead (protected)
export const updateLead = async (id, leadData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, leadData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update lead" };
  }
};

// Delete lead (admin only - protected)
export const deleteLead = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete lead" };
  }
};
