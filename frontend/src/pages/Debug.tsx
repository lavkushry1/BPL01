import { useEffect, useState } from 'react';
import { errorTracker } from '../utils/errorTracker';

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
}

const Debug = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Only load errors if authenticated
    setErrors(errorTracker.getErrors());
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleClearErrors = () => {
    errorTracker.clearErrors();
    setErrors([]);
  };

  const handleForceCrash = () => {
    // Intentionally cause an error for testing
    try {
      // @ts-ignore - Intentional error
      const obj = null;
      obj.nonExistentMethod();
    } catch (error) {
      if (error instanceof Error) {
        errorTracker.trackError({
          message: error.message,
          stack: error.stack,
          timestamp: Date.now(),
          url: window.location.href,
        });
        setErrors(errorTracker.getErrors());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">Debug Console</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 flex-grow">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Error Log</h2>
              <p className="mt-1 text-sm text-gray-500">
                Recent errors captured by the application
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                onClick={handleForceCrash}
              >
                Test Error
              </button>
              <button
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                onClick={handleClearErrors}
              >
                Clear Errors
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200">
            {errors.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-gray-500 italic">
                No errors recorded yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {errors.map((error, index) => (
                  <li key={index} className="px-4 py-5 sm:px-6">
                    <div className="mb-2">
                      <span className="font-mono text-sm text-gray-500">
                        {formatTimestamp(error.timestamp)} | {error.url}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-red-600">
                      {error.message}
                    </h3>
                    {error.stack && (
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs text-gray-800 max-h-32">
                        {error.stack}
                      </pre>
                    )}
                    {error.componentStack && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          Component Stack:
                        </h4>
                        <pre className="p-2 bg-gray-100 rounded overflow-auto text-xs text-gray-800 max-h-32">
                          {error.componentStack}
                        </pre>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Application Info
            </h2>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  User Agent
                </dt>
                <dd className="mt-1 text-sm text-gray-900 break-all">
                  {navigator.userAgent}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Window Size
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {`${window.innerWidth}px × ${window.innerHeight}px`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Current URL
                </dt>
                <dd className="mt-1 text-sm text-gray-900 break-all">
                  {window.location.href}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Local Storage Available
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug; 