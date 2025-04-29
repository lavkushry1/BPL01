/**
 * Simplified Express server with event CRUD operations for testing
 * 
 * Run with: node scripts/test-events-server.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const port = 4100;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// JWT Configuration
const JWT_SECRET = 'test_secret_key';
const JWT_REFRESH_SECRET = 'test_refresh_secret_key';

// Mock Database
const users = [
  {
    id: '1',
    email: 'admin@eventia.com',
    name: 'Admin User',
    password: 'password123',
    role: 'ADMIN',
    verified: true
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    password: 'password123',
    role: 'USER',
    verified: true
  }
];

const events = [];
const categories = [
  { id: '1', name: 'Music' },
  { id: '2', name: 'Sports' },
  { id: '3', name: 'Arts & Theatre' }
];

// Helper Functions
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token or session expired'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({
    status: 'error',
    message: 'Admin access required'
  });
};

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email);
    if (!user || user.password !== password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Admin Event Routes
app.post('/api/admin/events', authenticate, isAdmin, (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate required fields
    if (!eventData.title || !eventData.startDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and start date are required'
      });
    }
    
    // Create event
    const newEvent = {
      id: uuidv4(),
      ...eventData,
      status: eventData.status || 'PUBLISHED',
      createdAt: new Date(),
      updatedAt: new Date(),
      organizerId: req.user.id
    };
    
    events.push(newEvent);
    
    res.status(201).json({
      status: 'success',
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create event'
    });
  }
});

app.get('/api/v1/events', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedEvents = events.slice(startIndex, endIndex);
    
    res.status(200).json({
      status: 'success',
      data: {
        events: paginatedEvents,
        pagination: {
          total: events.length,
          page,
          limit,
          totalPages: Math.ceil(events.length / limit)
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch events'
    });
  }
});

app.get('/api/v1/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const event = events.find(event => event.id === id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: event
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch event'
    });
  }
});

app.put('/api/admin/events/:id', authenticate, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    
    const eventIndex = events.findIndex(event => event.id === id);
    
    if (eventIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    // Update event
    events[eventIndex] = {
      ...events[eventIndex],
      ...eventData,
      updatedAt: new Date()
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Event updated successfully',
      data: events[eventIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update event'
    });
  }
});

app.delete('/api/admin/events/:id', authenticate, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const eventIndex = events.findIndex(event => event.id === id);
    
    if (eventIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }
    
    // Delete event
    events.splice(eventIndex, 1);
    
    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete event'
    });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Test events server running at http://localhost:${port}`);
  console.log('Available routes:');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/admin/events');
  console.log('- GET /api/v1/events');
  console.log('- GET /api/v1/events/:id');
  console.log('- PUT /api/admin/events/:id');
  console.log('- DELETE /api/admin/events/:id');
}); 