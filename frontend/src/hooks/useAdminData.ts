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
      case '/api/admin/recent-users':
        return [
          {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            account_type: 'student',
            created_at: '15 Jun 2025'
          },
          {
            id: 2,
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            account_type: 'professional',
            created_at: '14 Jun 2025'
          }
        ];
      case '/api/admin/recent-enrollments':
        return [
          {
            id: 1,
            user_name: 'John Doe',
            course_name: 'Digital Marketing Fundamentals',
            date: '15 Jul 2025',
            status: 'active'
          },
          {
            id: 2,
            user_name: 'Jane Smith',
            course_name: 'Advanced SEO Techniques',
            date: '14 Jul 2025',
            status: 'completed'
          }
        ];
      case '/api/admin/service-requests':
        return [
          {
            id: 1,
            name: 'Alex Johnson',
            service: 'SEO Optimization',
            date: '15 Jul 2025',
            status: 'pending'
          },
          {
            id: 2,
            name: 'Sarah Williams',
            service: 'Social Media Marketing',
            date: '14 Jul 2025',
            status: 'in-process'
          }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
};