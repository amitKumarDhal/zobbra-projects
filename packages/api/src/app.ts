import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import { swaggerSpec } from './config/swagger.js';

dotenv.config();

const app = express();

// Middleware Stack
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger OpenAPI Docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base & Health Routes
app.use('/', healthRouter);

// Central Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
