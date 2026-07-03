import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environmental variables
dotenv.config();

// Import database, routes, and services
import { sequelize } from './src/database/models/index.js';
import userRoutes from './src/routes/userRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import errorHandler from './src/middleware/errorHandler.js';
import { initSocket } from './src/services/socketService.js';

const app = express();
const server = http.createServer(app);

// Configure trust proxy for Render load balancers to read client IPs correctly
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers with configured Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      upgradeInsecureRequests: [],
    },
  },
}));

// CORS configuration origins list
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]
  : ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000', 'http://127.0.0.1:8081'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow mobile apps and server-to-server requests (which have no origin header)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

// Setup Socket.io with production-ready CORS origin check
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket.io service logic
initSocket(io);

// Standard Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Production API rate limiter
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  });
  app.use('/api', limiter);
}

// REST API Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Base route for health check (Render relies on health checking to verify deployments)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat Server is healthy and running'
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Database Connection & Synchronization
const startServer = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('PostgreSQL database connection established successfully.');

    // Sync database models (creates tables if they do not exist)
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized successfully.');

    // Start HTTP and Socket server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start the server due to database connection error:', error);
    process.exit(1);
  }
};

startServer();
