import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './config';
import Database from './config/database';
import logger from './utils/logger';
import { errorHandler, handleUncaughtException, handleUnhandledRejection } from './middleware/errorHandler';
import { successResponse } from './utils/helpers';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import incomeRoutes from './routes/income';
import expenseRoutes from './routes/expenses';
import savingsRoutes from './routes/savings';
// import dashboardRoutes from './routes/dashboard';

class App {
  public app: Application;
  private database: Database;

  constructor() {
    this.app = express();
    this.database = Database.getInstance();
    
    // Handle uncaught exceptions and unhandled rejections
    handleUncaughtException();
    handleUnhandledRejection();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.server.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (config.server.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy (for rate limiting and real IP detection)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Health check route
    this.app.get('/health', (req: Request, res: Response) => {
      res.json(successResponse('Server is running', {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        database: this.database.isConnected() ? 'Connected' : 'Disconnected',
      }));
    });

    // API routes
    const apiPrefix = `${config.api.prefix}/${config.api.version}`;
    
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/projects`, projectRoutes);
    this.app.use(`${apiPrefix}/income`, incomeRoutes);
    this.app.use(`${apiPrefix}/expenses`, expenseRoutes);
    // this.app.use(`${apiPrefix}/savings`, savingsRoutes);
    // this.app.use(`${apiPrefix}/dashboard`, dashboardRoutes);

    // 404 handler
    this.app.all('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.database.connect();

      // Start server
      this.app.listen(config.server.port, () => {
        logger.info(`🚀 Server running on port ${config.server.port}`);
        logger.info(`📱 Environment: ${config.server.nodeEnv}`);
        logger.info(`🌐 API Base URL: http://localhost:${config.server.port}${config.api.prefix}/${config.api.version}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;
