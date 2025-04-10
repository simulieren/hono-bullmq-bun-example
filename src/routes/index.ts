import { Hono } from 'hono';
import { jobRoutes } from './job.routes';
import { healthRoutes } from './health.routes';
import { dashboardRoutes } from './dashboard.routes';
import { statsRoutes } from './stats.routes';

/**
 * Registers all application routes
 * @param app Hono application instance
 */
export function registerRoutes(app: Hono): void {
  // Mount API routes with versioning
  const api = new Hono()
    .basePath('/api/v1');

  // Register feature-specific routes
  api.route('/jobs', jobRoutes);
  api.route('/health', healthRoutes);
  api.route('/stats', statsRoutes);

  // Register error routes
  api.notFound((c) => {
    return c.json({
      success: false,
      error: {
        message: 'Not Found',
        code: 404
      }
    }, 404);
  });

  // Mount the API router to the main app
  app.route('/', api);

  // Mount the custom queue dashboard
  app.route('/dashboard', dashboardRoutes);

  // Root redirect to API health check
  app.get('/', (c) => c.redirect('/api/v1/health'));
}
