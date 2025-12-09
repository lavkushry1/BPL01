import { useState } from 'react';
import { defaultApiClient } from '../services/api';

/**
 * Simple component to test API connections
 */
const ApiTest = () => {
  const [result, setResult] = useState<string>('No request made yet');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async (endpoint: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await defaultApiClient.get(endpoint);
      setResult(JSON.stringify(response.data, null, 2));
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Unknown error occurred');
      setResult(JSON.stringify(err.response?.data || {}, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-3xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">API Connection Test</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => testConnection('/events')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          Test Events API
        </button>
        
        <button 
          onClick={() => testConnection('/health')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          disabled={loading}
        >
          Test Health Endpoint
        </button>
        
        <button 
          onClick={() => testConnection('/categories')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          disabled={loading}
        >
          Test Categories API
        </button>
      </div>
      
      {loading && <div className="text-blue-500 mb-4">Loading...</div>}
      
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      
      <div className="mt-4">
        <h3 className="font-bold mb-2">Response:</h3>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {result}
        </pre>
      </div>
    </div>
  );
};

export default ApiTest; 