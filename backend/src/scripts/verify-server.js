/**
 * Server Verification Script
 * 
 * This script verifies if the Eventia backend server is running
 * before executing API tests.
 */
const axios = require('axios');
const colors = require('colors');

// Configuration
const API_URL = 'http://localhost:4000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Logging utilities
const logSuccess = (message) => console.log(colors.green(`✅ ${message}`));
const logError = (message) => console.log(colors.red(`❌ ${message}`));
const logInfo = (message) => console.log(colors.blue(`ℹ️ ${message}`));
const logWarning = (message) => console.log(colors.yellow(`⚠️ ${message}`));

/**
 * Check if the server is running
 * @param {number} retryCount - Current retry count
 * @returns {Promise<boolean>} - Whether the server is running
 */
const checkServer = async (retryCount = 0) => {
  try {
    logInfo(`Checking if server is running at ${API_URL}`);
    
    // Try to hit the health endpoint or root endpoint
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      logSuccess(`Server is running at ${API_URL}`);
      return true;
    } else {
      logWarning(`Server returned unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      logWarning(`Server not reachable. Retrying in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Wait for RETRY_DELAY before trying again
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      // Try again
      return checkServer(retryCount + 1);
    } else {
      logError(`Server is not running at ${API_URL}`);
      logInfo('To start the server:');
      logInfo('1. In one terminal: cd eventia-backend-express && npm run dev');
      logInfo('2. In another terminal: Run the tests with npm run test:api');
      return false;
    }
  }
};

/**
 * Main function
 */
const main = async () => {
  const isServerRunning = await checkServer();
  
  if (!isServerRunning) {
    process.exit(1); // Exit with error code
  }
  
  process.exit(0); // Exit with success code
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { checkServer }; 