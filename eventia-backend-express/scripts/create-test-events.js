const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = 'http://localhost:4000/api/v1';
const ADMIN_EMAIL = 'admin@example.com';

// Create a mock admin JWT token for testing
const createMockAdminJWT = () => {
  // Create a simple mock JWT format (header.payload.signature)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Create a payload with admin credentials
  const payload = Buffer.from(JSON.stringify({
    id: 'admin-mock-id',
    email: ADMIN_EMAIL,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    aud: 'eventia-app',
    iss: 'eventia-api',
  })).toString('base64url');
  
  // Mock signature (in real JWTs this would be cryptographically signed)
  const signature = Buffer.from('mocksignature').toString('base64url');
  
  // Create the complete JWT token
  return `${header}.${payload}.${signature}`;
};

// Sample event data
const testEvents = [
  {
    title: "Mumbai Indians vs Chennai Super Kings",
    description: "The biggest IPL rivalry match of the season featuring Mumbai Indians and Chennai Super Kings at Wankhede Stadium.",
    start_date: "2025-05-15T18:00:00Z",
    end_date: "2025-05-15T22:00:00Z",
    location: "Wankhede Stadium, Mumbai",
    status: "published",
    category: "cricket",
    featured: true,
    posterImage: "https://example.com/ipl/mi-vs-csk.jpg",
    venue: "Wankhede Stadium",
    time: "6:00 PM",
    duration: "4 hours",
    images: [
      {
        url: "https://example.com/ipl/mi-vs-csk.jpg",
        alt_text: "Mumbai Indians vs Chennai Super Kings match banner",
        is_featured: true
      },
      {
        url: "https://example.com/ipl/stadium.jpg",
        alt_text: "Wankhede Stadium"
      }
    ],
    ticket_types: [
      {
        name: "Premium Stand",
        description: "Best view of the action with premium amenities",
        price: 3000,
        quantity: 2000,
        available: 2000
      },
      {
        name: "General Stand",
        description: "Standard seating with good views",
        price: 1200,
        quantity: 5000,
        available: 5000
      },
      {
        name: "Economy Stand",
        description: "Budget-friendly seating option",
        price: 800,
        quantity: 8000,
        available: 8000
      }
    ],
    teams: {
      team1: {
        name: "Mumbai Indians",
        shortName: "MI",
        logo: "https://example.com/ipl/mi-logo.png"
      },
      team2: {
        name: "Chennai Super Kings",
        shortName: "CSK",
        logo: "https://example.com/ipl/csk-logo.png"
      }
    }
  },
  {
    title: "Royal Challengers Bangalore vs Kolkata Knight Riders",
    description: "Exciting IPL match between RCB and KKR at M. Chinnaswamy Stadium.",
    start_date: "2025-05-18T18:00:00Z",
    end_date: "2025-05-18T22:00:00Z",
    location: "M. Chinnaswamy Stadium, Bangalore",
    status: "published",
    category: "cricket",
    featured: true,
    posterImage: "https://example.com/ipl/rcb-vs-kkr.jpg",
    venue: "M. Chinnaswamy Stadium",
    time: "6:00 PM",
    duration: "4 hours",
    images: [
      {
        url: "https://example.com/ipl/rcb-vs-kkr.jpg",
        alt_text: "RCB vs KKR match banner",
        is_featured: true
      },
      {
        url: "https://example.com/ipl/chinnaswamy.jpg",
        alt_text: "M. Chinnaswamy Stadium"
      }
    ],
    ticket_types: [
      {
        name: "Premium Stand",
        description: "Best view of the action with premium amenities",
        price: 2800,
        quantity: 1800,
        available: 1800
      },
      {
        name: "General Stand",
        description: "Standard seating with good views",
        price: 1100,
        quantity: 4500,
        available: 4500
      },
      {
        name: "Economy Stand",
        description: "Budget-friendly seating option",
        price: 750,
        quantity: 7500,
        available: 7500
      }
    ],
    teams: {
      team1: {
        name: "Royal Challengers Bangalore",
        shortName: "RCB",
        logo: "https://example.com/ipl/rcb-logo.png"
      },
      team2: {
        name: "Kolkata Knight Riders",
        shortName: "KKR",
        logo: "https://example.com/ipl/kkr-logo.png"
      }
    }
  }
];

// Create the events
async function createTestEvents() {
  try {
    // Ensure we're running in development mode
    process.env.NODE_ENV = 'development';
    
    // Create admin token
    const token = createMockAdminJWT();
    
    // Setup API client with admin token
    const apiClient = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Creating test events with mock admin token...');
    console.log('Environment:', process.env.NODE_ENV);
    
    // Create each event
    for (const event of testEvents) {
      try {
        const response = await apiClient.post('/admin/events', event);
        console.log(`✅ Created event: ${event.title}`);
        console.log('  Event ID:', response.data.data?.event?.id);
      } catch (error) {
        console.error(`❌ Failed to create event: ${event.title}`);
        
        // Enhanced error details logging
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('  Status:', error.response.status);
          console.error('  Response headers:', JSON.stringify(error.response.headers, null, 2));
          console.error('  Response data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
          // The request was made but no response was received
          console.error('  No response received from server');
          console.error('  Request:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('  Error message:', error.message);
        }
        
        console.error('  Full error:', error);
      }
    }
    
    console.log('Done creating test events.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
createTestEvents(); 