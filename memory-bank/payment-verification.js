/**
 * Eventia Payment Verification Throughput Test
 * 
 * This script tests the throughput and performance of the payment verification system,
 * specifically focusing on the UTR verification workflow.
 * 
 * Usage: node payment-verification.js [concurrent-users] [test-duration-seconds]
 */

const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

// Configuration
const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  adminUsername: process.env.ADMIN_USERNAME || 'admin@eventia.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  concurrentUsers: parseInt(process.argv[2]) || 10,
  testDurationSeconds: parseInt(process.argv[3]) || 60,
  verificationInterval: 200, // ms between verification attempts per user
  workerCount: os.cpus().length
};

// Sample UTR numbers for testing (should match regex pattern for real UTRs)
const generateUTR = () => {
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  }
  return result;
};

// Sample booking IDs for testing
const generateBookingId = () => {
  return `BOOK-${Math.floor(Math.random() * 1000000)}`;
};

// Main test function for worker threads
async function runVerificationTest(workerIndex, usersPerWorker) {
  let token = null;
  let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Number.MAX_SAFE_INTEGER
  };

  // Login as admin to get token
  try {
    const loginResponse = await axios.post(`${config.apiBaseUrl}/auth/login`, {
      email: config.adminUsername,
      password: config.adminPassword
    });
    
    token = loginResponse.data.token;
    if (!token) {
      console.error(`Worker ${workerIndex}: Failed to authenticate`);
      return stats;
    }
  } catch (error) {
    console.error(`Worker ${workerIndex}: Authentication error: ${error.message}`);
    return stats;
  }

  // Function to perform a single verification request
  async function verifyPayment() {
    const bookingId = generateBookingId();
    const utrNumber = generateUTR();
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${config.apiBaseUrl}/admin/verify-payment`,
        {
          bookingId: bookingId,
          utrNumber: utrNumber,
          action: 'approve'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const responseTime = Date.now() - startTime;
      
      stats.totalRequests++;
      stats.totalResponseTime += responseTime;
      stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime);
      stats.minResponseTime = Math.min(stats.minResponseTime, responseTime);
      
      if (response.status === 200) {
        stats.successfulRequests++;
      } else {
        stats.failedRequests++;
      }
    } catch (error) {
      stats.totalRequests++;
      stats.failedRequests++;
      console.error(`Worker ${workerIndex} - Verification error: ${error.message}`);
    }
  }

  // Simulate multiple users making verification requests
  const simulateUsers = async () => {
    const startTime = Date.now();
    const endTime = startTime + (config.testDurationSeconds * 1000);
    
    const userPromises = Array.from({ length: usersPerWorker }, (_, userIndex) => {
      const userId = workerIndex * usersPerWorker + userIndex;
      
      return (async () => {
        while (Date.now() < endTime) {
          await verifyPayment();
          
          // Add randomness to verification interval to better simulate real users
          const jitter = Math.floor(Math.random() * 100);
          await new Promise(r => setTimeout(r, config.verificationInterval + jitter));
        }
      })();
    });
    
    await Promise.all(userPromises);
  };

  await simulateUsers();
  
  // If min response time was never set, make it 0
  if (stats.minResponseTime === Number.MAX_SAFE_INTEGER) {
    stats.minResponseTime = 0;
  }
  
  return stats;
}

// Main process
if (isMainThread) {
  console.log(`
=======================================================
  EVENTIA PAYMENT VERIFICATION THROUGHPUT TEST
=======================================================
  Concurrent Users: ${config.concurrentUsers}
  Test Duration: ${config.testDurationSeconds} seconds
  Workers: ${config.workerCount}
  API URL: ${config.apiBaseUrl}
=======================================================
`);

  const usersPerWorker = Math.ceil(config.concurrentUsers / config.workerCount);
  const startTime = Date.now();
  const workers = [];
  
  // Create worker threads
  for (let i = 0; i < config.workerCount; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        workerIndex: i,
        usersPerWorker: usersPerWorker
      }
    });
    
    workers.push(worker);
  }
  
  // Collect results from all workers
  let completedWorkers = 0;
  const aggregateStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Number.MAX_SAFE_INTEGER
  };
  
  workers.forEach((worker, index) => {
    worker.on('message', (workerStats) => {
      aggregateStats.totalRequests += workerStats.totalRequests;
      aggregateStats.successfulRequests += workerStats.successfulRequests;
      aggregateStats.failedRequests += workerStats.failedRequests;
      aggregateStats.totalResponseTime += workerStats.totalResponseTime;
      aggregateStats.maxResponseTime = Math.max(aggregateStats.maxResponseTime, workerStats.maxResponseTime);
      aggregateStats.minResponseTime = Math.min(aggregateStats.minResponseTime, workerStats.minResponseTime);
      
      completedWorkers++;
      
      if (completedWorkers === config.workerCount) {
        const testDuration = (Date.now() - startTime) / 1000;
        const avgResponseTime = aggregateStats.totalResponseTime / aggregateStats.totalRequests || 0;
        const throughput = aggregateStats.totalRequests / testDuration;
        const successRate = (aggregateStats.successfulRequests / aggregateStats.totalRequests) * 100 || 0;
        
        // If min response time was never set, make it 0
        if (aggregateStats.minResponseTime === Number.MAX_SAFE_INTEGER) {
          aggregateStats.minResponseTime = 0;
        }
        
        console.log(`
=======================================================
  TEST RESULTS
=======================================================
  Total Requests: ${aggregateStats.totalRequests}
  Successful: ${aggregateStats.successfulRequests} (${successRate.toFixed(2)}%)
  Failed: ${aggregateStats.failedRequests}
  
  Throughput: ${throughput.toFixed(2)} verifications/second
  
  Response Times:
    Average: ${avgResponseTime.toFixed(2)} ms
    Min: ${aggregateStats.minResponseTime} ms
    Max: ${aggregateStats.maxResponseTime} ms
  
  Test Duration: ${testDuration.toFixed(2)} seconds
=======================================================

${outputPerformanceGrade(throughput, avgResponseTime, successRate)}
`);
      }
    });
    
    worker.on('error', (error) => {
      console.error(`Worker ${index} error: ${error}`);
      completedWorkers++;
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${index} exited with code ${code}`);
      }
      completedWorkers++;
    });
  });
} else {
  // This code runs in worker threads
  const { workerIndex, usersPerWorker } = workerData;
  
  (async () => {
    const stats = await runVerificationTest(workerIndex, usersPerWorker);
    parentPort.postMessage(stats);
  })();
}

// Helper function to output performance grade based on results
function outputPerformanceGrade(throughput, avgResponseTime, successRate) {
  let grade = '';
  let recommendations = [];
  
  // Grade based on throughput (verifications per second)
  if (throughput >= 100) {
    grade = 'A+';
  } else if (throughput >= 50) {
    grade = 'A';
  } else if (throughput >= 20) {
    grade = 'B';
  } else if (throughput >= 10) {
    grade = 'C';
  } else {
    grade = 'D';
    recommendations.push('- Consider optimizing database queries for verification');
    recommendations.push('- Add caching for frequently accessed payment data');
  }
  
  // Adjust grade based on response time
  if (avgResponseTime > 500) {
    grade = downgradeGrade(grade);
    recommendations.push('- Response times are high, check database indexes');
    recommendations.push('- Consider adding a dedicated verification service');
  }
  
  // Adjust grade based on success rate
  if (successRate < 95) {
    grade = downgradeGrade(grade);
    recommendations.push('- Improve error handling to increase success rate');
    recommendations.push('- Check for potential race conditions in verification process');
  }
  
  let output = `PERFORMANCE GRADE: ${grade}`;
  
  if (recommendations.length > 0) {
    output += '\n\nRECOMMENDATIONS:\n' + recommendations.join('\n');
  } else {
    output += '\n\nSystem is performing well for the current load!';
  }
  
  return output;
}

// Helper function to downgrade a letter grade
function downgradeGrade(currentGrade) {
  const grades = ['A+', 'A', 'B', 'C', 'D', 'F'];
  const currentIndex = grades.indexOf(currentGrade);
  
  if (currentIndex < grades.length - 1) {
    return grades[currentIndex + 1];
  }
  
  return currentGrade;
} 