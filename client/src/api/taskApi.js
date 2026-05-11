import axios from 'axios';
import { apiUrl } from '../config/api';

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// Add only this function — do not change existing functions
export const fetchAssignableUsers = () =>
  axios.get(apiUrl('/api/tasks/assignable-users'), authConfig());
