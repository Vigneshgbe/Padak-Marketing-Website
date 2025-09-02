// src/hooks/useAdminData.ts
import { useState, useEffect } from 'react';

export const useAdminData = (endpoint: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => {
    const token = localStorage.getItem('token') ||
                 localStorage.getItem('authToken') ||
                 localStorage.getItem('accessToken') ||
                 sessionStorage.getItem('token') ||
                 sessionStorage.getItem('authToken');

    const userStr = localStorage.getItem('user');
    if (!token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) return user.token;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    return token;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        const errorData = await response.text();
        console.error(`Error fetching ${endpoint}:`, errorData);
        
        // For development, use mock data if endpoint not implemented
        console.warn(`Failed to fetch ${endpoint} data, using mock data instead`);
        setData(getMockData(endpoint));
        setLoading(false);
        return;
      }

      const data = await response.json();
      setData(data);
    } catch (err: any) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err.message || 'Failed to load data. Please try again later.');
      
      // For development, use mock data
      setData(getMockData(endpoint));
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (endpoint: string) => {
    switch (endpoint) {
      case '/api/admin/users':
        return [
          {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            account_type: 'student',
            phone: '+91 9876543210',
            is_active: true,
            email_verified: true,
            created_at: '15 Jun 2025',
            updated_at: '15 Jun 2025'
          },
          {
            id: 2,
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            account_type: 'professional',
            phone: '+91 9876543211',
            is_active: true,
            email_verified: true,
            created_at: '14 Jun 2025',
            updated_at: '14 Jun 2025'
          }
        ];
      // Add more mock data for other endpoints
      default:
        return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
};