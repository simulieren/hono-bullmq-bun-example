import { Hono } from 'hono';
import { logger } from '../middleware/logger';

export const dashboardRoutes = new Hono();

// Create a custom queue monitoring dashboard since we're in development
dashboardRoutes.get('/', (c) => {
  // Display a list of available API endpoints to view queue information
  return c.html(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Queue Management Dashboard</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        font-size: 28px;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 10px;
      }
      h2 {
        font-size: 22px;
        margin-top: 30px;
      }
      ul {
        padding-left: 30px;
      }
      li {
        margin-bottom: 8px;
      }
      code {
        background-color: #f6f8fa;
        border-radius: 3px;
        font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
        font-size: 85%;
        padding: 0.2em 0.4em;
      }
      .queue-section {
        margin-bottom: 30px;
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
      }
      .endpoint {
        margin-top: 10px;
      }
      .endpoint a {
        color: #0366d6;
        text-decoration: none;
      }
      .endpoint a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <h1>Queue Management Dashboard</h1>
    <p>This dashboard provides access to monitor and manage the job queues in the application.</p>
    
    <h2>Available Queues</h2>
    <div class="queue-section">
      <h3>Email Queue</h3>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=email" target="_blank">View all email jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=email&status=waiting" target="_blank">View waiting email jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=email&status=active" target="_blank">View active email jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=email&status=completed" target="_blank">View completed email jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=email&status=failed" target="_blank">View failed email jobs</a>
      </div>
    </div>
    
    <div class="queue-section">
      <h3>Notification Queue</h3>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=notification" target="_blank">View all notification jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=notification&status=waiting" target="_blank">View waiting notification jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=notification&status=active" target="_blank">View active notification jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=notification&status=completed" target="_blank">View completed notification jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=notification&status=failed" target="_blank">View failed notification jobs</a>
      </div>
    </div>
    
    <div class="queue-section">
      <h3>Processing Queue</h3>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=processing" target="_blank">View all processing jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=processing&status=waiting" target="_blank">View waiting processing jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=processing&status=active" target="_blank">View active processing jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=processing&status=completed" target="_blank">View completed processing jobs</a>
      </div>
      <div class="endpoint">
        <a href="/api/v1/jobs?type=processing&status=failed" target="_blank">View failed processing jobs</a>
      </div>
    </div>
    
    <h2>API Documentation</h2>
    <ul>
      <li><code>GET /api/v1/jobs</code> - List all jobs (with pagination)</li>
      <li><code>GET /api/v1/jobs?type=TYPE&status=STATUS</code> - Filter jobs by type and status</li>
      <li><code>GET /api/v1/jobs/:id</code> - Get job details</li>
      <li><code>GET /api/v1/jobs/:id/logs</code> - Get job logs</li>
      <li><code>DELETE /api/v1/jobs/:id</code> - Cancel a job</li>
    </ul>
    
    <p>For more information, see the <a href="/">API documentation</a>.</p>
  </body>
  </html>
  `);
});

logger.info('Queue dashboard initialized at /dashboard');