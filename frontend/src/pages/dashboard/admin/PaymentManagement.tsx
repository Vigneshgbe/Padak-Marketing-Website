// src/pages/dashboard/admin/PaymentManagement.tsx
import React, { useState, useEffect } from 'react';
import { Check, X, Search, Download, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Payment {
  id: number;
  user_id: number;
  resource_id: number | null;
  plan: 'individual' | 'premium';
  amount: number;
  payment_method: string;
  transaction_id: string;
  proof_file: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  verified_at: string | null;
  first_name: string;
  last_name: string;
  email: string;
  resource_title: string | null;
}

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/payments', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      const paymentsData = await response.json();
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/payments/${paymentId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchPayments(); // Refresh the list
      } else {
        throw new Error('Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

  const viewProof = (proofFile: string) => {
    window.open(`http://localhost:5000/uploads/payments/${proofFile}`, '_blank');
  };

  const filteredPayments = payments.filter(payment => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.transaction_id.toLowerCase().includes(searchLower) ||
        payment.first_name.toLowerCase().includes(searchLower) ||
        payment.last_name.toLowerCase().includes(searchLower) ||
        payment.email.toLowerCase().includes(searchLower) ||
        (payment.resource_title && payment.resource_title.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Payment Management</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {payment.first_name} {payment.last_name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {payment.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {payment.transaction_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {payment.plan === 'individual' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                      Individual
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      Premium
                    </span>
                  )}
                  {payment.resource_title && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {payment.resource_title}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ${payment.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {payment.payment_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.status === 'pending' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <Clock size={12} className="mr-1" /> Pending
                    </span>
                  ) : payment.status === 'approved' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle size={12} className="mr-1" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      <XCircle size={12} className="mr-1" /> Rejected
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewProof(payment.proof_file)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View Proof"
                    >
                      <Eye size={16} />
                    </button>
                    {payment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => verifyPayment(payment.id, 'approved')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Approve Payment"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => verifyPayment(payment.id, 'rejected')}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Reject Payment"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentManagement;