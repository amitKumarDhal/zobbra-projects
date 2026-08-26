import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import productRoutes from './modules/products/products.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import quoteRoutes from './modules/quotes/quotes.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import productionRoutes from './modules/production/production.routes.js';
import dispatchRoutes from './modules/dispatch/dispatch.routes.js';
import cmsRoutes from './modules/cms/cms.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import inquiryRoutes from './modules/inquiries/inquiries.routes.js';
import taskRoutes from './modules/tasks/tasks.routes.js';
import agentRoutes from './modules/agents/agents.routes.js';
import couponRoutes from './modules/coupons/coupons.routes.js';
import testimonialRoutes from './modules/testimonials/testimonials.routes.js';
import invoiceRoutes from './modules/invoices/invoices.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ZOBBRA B2B SaaS API' });
});

// API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1/invoices', invoiceRoutes);


// Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 ZOBBRA B2B Server listening on http://localhost:${config.port}`);
  });
}

export default app;
