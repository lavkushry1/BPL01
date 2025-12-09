import ApiTest from '../components/ApiTest';

export default function ApiTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">API Connection Test Page</h1>
      <p className="mb-6">Use this page to test API connections to the backend server.</p>
      <ApiTest />
    </div>
  );
} 