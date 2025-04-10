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
        background-color: #f9f9f9;
      }
      h1 {
        font-size: 28px;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 10px;
        color: #24292e;
      }
      h2 {
        font-size: 22px;
        margin-top: 30px;
        color: #24292e;
      }
      h3 {
        color: #24292e;
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
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
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
      .button {
        display: inline-block;
        background-color: #2ea44f;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 600;
        margin-right: 10px;
        margin-bottom: 10px;
        transition: background-color 0.2s;
        border: none;
        cursor: pointer;
        font-size: 14px;
      }
      .button:hover {
        background-color: #2c974b;
      }
      .button-red {
        background-color: #d73a49;
      }
      .button-red:hover {
        background-color: #cb2431;
      }
      .button-blue {
        background-color: #0366d6;
      }
      .button-blue:hover {
        background-color: #035cc1;
      }
      .test-form {
        background-color: #f6f8fa;
        padding: 15px;
        border-radius: 6px;
        margin-top: 15px;
        margin-bottom: 20px;
      }
      .form-group {
        margin-bottom: 15px;
      }
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
      }
      .form-group input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .status-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 5px;
      }
      .status-complete {
        background-color: #2ea44f;
      }
      .status-active {
        background-color: #0366d6;
      }
      .status-waiting {
        background-color: #f6a33e;
      }
      .status-failed {
        background-color: #d73a49;
      }
      .status-delayed {
        background-color: #6f42c1;
      }
      .tabs {
        display: flex;
        border-bottom: 1px solid #e1e4e8;
        margin-bottom: 20px;
      }
      .tab {
        padding: 10px 20px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        font-weight: 600;
      }
      .tab:hover {
        color: #0366d6;
      }
      .tab.active {
        border-bottom-color: #0366d6;
        color: #0366d6;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
      .stats-card {
        background-color: white;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
      }
      .stats-title {
        font-size: 16px;
        font-weight: 600;
        color: #586069;
        margin-bottom: 10px;
      }
      .stats-value {
        font-size: 32px;
        font-weight: 700;
        color: #24292e;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      .card-email {
        border-top: 3px solid #2ea44f;
      }
      .card-notification {
        border-top: 3px solid #0366d6;
      }
      .card-processing {
        border-top: 3px solid #6f42c1;
      }
      .card-total {
        border-top: 3px solid #24292e;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e1e4e8;
      }
      th {
        background-color: #f6f8fa;
        font-weight: 600;
      }
      tr:hover {
        background-color: #f6f8fa;
      }
      .pill {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        color: white;
      }
      .pill-email {
        background-color: #2ea44f;
      }
      .pill-notification {
        background-color: #0366d6;
      }
      .pill-processing {
        background-color: #6f42c1;
      }
      .pill-completed {
        background-color: #2ea44f;
      }
      .pill-active {
        background-color: #0366d6;
      }
      .pill-waiting {
        background-color: #f6a33e;
      }
      .pill-failed {
        background-color: #d73a49;
      }
      .pill-delayed {
        background-color: #6f42c1;
      }
      .timestamp {
        font-size: 12px;
        color: #586069;
      }
      .pagination {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }
      .pagination button {
        margin: 0 5px;
        padding: 8px 12px;
        border: 1px solid #e1e4e8;
        background-color: white;
        border-radius: 4px;
        cursor: pointer;
      }
      .pagination button:hover {
        background-color: #f6f8fa;
      }
      .pagination button.active {
        background-color: #0366d6;
        color: white;
        border-color: #0366d6;
      }
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        z-index: 1000;
        overflow: auto;
      }
      .modal-content {
        background-color: white;
        margin: 50px auto;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 800px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .close {
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
      }
      .close:hover {
        color: #d73a49;
      }
      .response-container {
        max-height: 300px;
        overflow-y: auto;
        background-color: #f6f8fa;
        padding: 10px;
        border-radius: 4px;
        font-family: monospace;
        margin-top: 15px;
      }
      #refreshStats, #refreshJobs {
        display: inline-block;
        padding: 8px 16px;
        margin-left: 10px;
        background-color: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 4px;
        cursor: pointer;
      }
      #refreshStats:hover, #refreshJobs:hover {
        background-color: #e1e4e8;
      }
      .loader {
        border: 3px solid #f3f3f3;
        border-radius: 50%;
        border-top: 3px solid #0366d6;
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-left: 5px;
        vertical-align: middle;
        display: none;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <h1>Queue Management Dashboard</h1>
    <p>Real-time monitoring and management tool for job queues in the application.</p>
    
    <div class="tabs">
      <div class="tab active" data-tab="overview">Overview</div>
      <div class="tab" data-tab="jobs">Jobs</div>
      <div class="tab" data-tab="test">Test Endpoints</div>
      <div class="tab" data-tab="api">API Documentation</div>
    </div>
    
    <!-- Overview Tab -->
    <div id="overview" class="tab-content active">
      <h2>Queue Statistics <button id="refreshStats">↻ Refresh</button> <span id="statsLoader" class="loader"></span></h2>
      <div id="statsGrid" class="stats-grid">
        <!-- Stats cards will be loaded here -->
        <div class="stats-card card-email">
          <div class="stats-title">Email Jobs</div>
          <div class="stats-value">Loading...</div>
        </div>
        <div class="stats-card card-notification">
          <div class="stats-title">Notification Jobs</div>
          <div class="stats-value">Loading...</div>
        </div>
        <div class="stats-card card-processing">
          <div class="stats-title">Processing Jobs</div>
          <div class="stats-value">Loading...</div>
        </div>
        <div class="stats-card card-total">
          <div class="stats-title">Total Jobs</div>
          <div class="stats-value">Loading...</div>
        </div>
      </div>
      
      <div class="queue-section">
        <h3>Queue Status</h3>
        <table id="queueStatsTable">
          <thead>
            <tr>
              <th>Queue</th>
              <th>Waiting</th>
              <th>Active</th>
              <th>Completed</th>
              <th>Failed</th>
              <th>Delayed</th>
              <th>Workers</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <!-- Queue stats will be loaded here -->
            <tr>
              <td colspan="8" style="text-align:center;">Loading statistics...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Jobs Tab -->
    <div id="jobs" class="tab-content">
      <h2>All Jobs <button id="refreshJobs">↻ Refresh</button> <span id="jobsLoader" class="loader"></span></h2>
      <div class="queue-section">
        <table id="jobsTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Queue</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Jobs will be loaded here -->
            <tr>
              <td colspan="6" style="text-align:center;">Loading jobs...</td>
            </tr>
          </tbody>
        </table>
        <div id="pagination" class="pagination">
          <!-- Pagination controls will be added here -->
        </div>
      </div>
    </div>
    
    <!-- Test Endpoints Tab -->
    <div id="test" class="tab-content">
      <h2>Test Queue Endpoints</h2>
      
      <div class="queue-section">
        <h3>Email Queue</h3>
        <div class="test-form">
          <h4>Create Email Job</h4>
          <div class="form-group">
            <label for="emailTo">To:</label>
            <input type="email" id="emailTo" value="user@example.com">
          </div>
          <div class="form-group">
            <label for="emailSubject">Subject:</label>
            <input type="text" id="emailSubject" value="Test Email">
          </div>
          <div class="form-group">
            <label for="emailBody">Body:</label>
            <input type="text" id="emailBody" value="This is a test email body">
          </div>
          <button class="button" onclick="testCreateEmail()">Create Email Job</button>
        </div>
        
        <div class="test-form">
          <h4>Create Welcome Email</h4>
          <div class="form-group">
            <label for="welcomeEmail">Email:</label>
            <input type="email" id="welcomeEmail" value="newuser@example.com">
          </div>
          <div class="form-group">
            <label for="welcomeName">Name:</label>
            <input type="text" id="welcomeName" value="New User">
          </div>
          <button class="button" onclick="testWelcomeEmail()">Send Welcome Email</button>
        </div>
        
        <div class="test-form">
          <h4>Create Password Reset Email</h4>
          <div class="form-group">
            <label for="resetEmail">Email:</label>
            <input type="email" id="resetEmail" value="user@example.com">
          </div>
          <div class="form-group">
            <label for="resetToken">Reset Token:</label>
            <input type="text" id="resetToken" value="a1b2c3d4e5f6">
          </div>
          <button class="button" onclick="testPasswordResetEmail()">Send Password Reset</button>
        </div>
      </div>
      
      <div class="queue-section">
        <h3>Notification Queue</h3>
        <div class="test-form">
          <h4>Create Notification</h4>
          <div class="form-group">
            <label for="notifUserId">User ID:</label>
            <input type="text" id="notifUserId" value="user123">
          </div>
          <div class="form-group">
            <label for="notifMessage">Message:</label>
            <input type="text" id="notifMessage" value="This is a test notification">
          </div>
          <div class="form-group">
            <label for="notifChannel">Channel:</label>
            <select id="notifChannel">
              <option value="push">Push</option>
              <option value="sms">SMS</option>
              <option value="in-app">In-App</option>
            </select>
          </div>
          <button class="button" onclick="testCreateNotification()">Create Notification</button>
        </div>
      </div>
      
      <div class="queue-section">
        <h3>Processing Queue</h3>
        <div class="test-form">
          <h4>Create Processing Job</h4>
          <div class="form-group">
            <label for="processingData">Job Data (JSON):</label>
            <input type="text" id="processingData" value='{"operation": "data-analysis", "params": {"dataset": "users", "metric": "retention"}}'>
          </div>
          <div class="form-group">
            <label for="processingPriority">Priority:</label>
            <select id="processingPriority">
              <option value="high">High</option>
              <option value="medium" selected>Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button class="button" onclick="testCreateProcessing()">Create Processing Job</button>
        </div>
      </div>
      
      <div class="queue-section">
        <h3>Job Management</h3>
        <div class="test-form">
          <h4>Get Job Details</h4>
          <div class="form-group">
            <label for="jobId">Job ID:</label>
            <input type="text" id="jobId" value="1">
          </div>
          <button class="button button-blue" onclick="testGetJob()">Get Job</button>
          <button class="button button-blue" onclick="testGetJobLogs()">Get Logs</button>
          <button class="button button-red" onclick="testCancelJob()">Cancel Job</button>
        </div>
      </div>
    </div>
    
    <!-- API Documentation Tab -->
    <div id="api" class="tab-content">
      <h2>API Documentation</h2>
      <div class="queue-section">
        <h3>Endpoints</h3>
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>/api/v1/stats</code></td>
              <td>GET</td>
              <td>Get queue statistics for all queues</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs</code></td>
              <td>GET</td>
              <td>List all jobs (with pagination)</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/:id</code></td>
              <td>GET</td>
              <td>Get job details by ID</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/:id/logs</code></td>
              <td>GET</td>
              <td>Get logs for a specific job</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/:id</code></td>
              <td>DELETE</td>
              <td>Cancel a job by ID</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/email</code></td>
              <td>POST</td>
              <td>Create a new email job</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/email/welcome</code></td>
              <td>POST</td>
              <td>Create a welcome email job</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/email/password-reset</code></td>
              <td>POST</td>
              <td>Create a password reset email job</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/notification</code></td>
              <td>POST</td>
              <td>Create a new notification job</td>
            </tr>
            <tr>
              <td><code>/api/v1/jobs/processing</code></td>
              <td>POST</td>
              <td>Create a new processing job</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal for displaying responses -->
    <div id="responseModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal()">&times;</span>
        <h3 id="modalTitle">Response</h3>
        <div id="responseContainer" class="response-container"></div>
      </div>
    </div>
    
    <script>
      // Tab switching functionality
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding content
          tab.classList.add('active');
          document.getElementById(tab.dataset.tab).classList.add('active');
        });
      });
      
      // Function to format dates nicely
      function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
      }
      
      // Function to truncate long text
      function truncate(text, length = 30) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
      }
      
      // Load queue statistics
      async function loadStats() {
        document.getElementById('statsLoader').style.display = 'inline-block';
        try {
          const response = await fetch('/api/v1/stats');
          const data = await response.json();
          
          if (data.success) {
            const stats = data.data;
            
            // Update stats cards
            document.querySelector('.card-email .stats-value').textContent = stats.queues.email.jobCount;
            document.querySelector('.card-notification .stats-value').textContent = stats.queues.notification.jobCount;
            document.querySelector('.card-processing .stats-value').textContent = stats.queues.processing.jobCount;
            document.querySelector('.card-total .stats-value').textContent = stats.totalJobs;
            
            // Update queue stats table
            const tableBody = document.querySelector('#queueStatsTable tbody');
            tableBody.innerHTML = '';
            
            for (const [name, queue] of Object.entries(stats.queues)) {
              const statusClass = queue.paused ? 'status-failed' : 'status-complete';
              const statusText = queue.paused ? 'Paused' : 'Running';
              
              tableBody.innerHTML += \`
                <tr>
                  <td>\${name}</td>
                  <td>\${queue.waiting}</td>
                  <td>\${queue.active}</td>
                  <td>\${queue.completed}</td>
                  <td>\${queue.failed}</td>
                  <td>\${queue.delayed}</td>
                  <td>\${queue.workerCount}</td>
                  <td><span class="status-indicator \${statusClass}"></span>\${statusText}</td>
                </tr>
              \`;
            }
          } else {
            console.error('Failed to load stats:', data.error);
          }
        } catch (error) {
          console.error('Error loading stats:', error);
        } finally {
          document.getElementById('statsLoader').style.display = 'none';
        }
      }
      
      // Load jobs
      let currentPage = 1;
      let pageSize = 10;
      
      async function loadJobs() {
        document.getElementById('jobsLoader').style.display = 'inline-block';
        try {
          const response = await fetch(\`/api/v1/jobs?page=\${currentPage}&limit=\${pageSize}\`);
          const data = await response.json();
          
          if (data.success) {
            const jobs = data.data.jobs;
            const pagination = data.data.pagination;
            
            // Update jobs table
            const tableBody = document.querySelector('#jobsTable tbody');
            tableBody.innerHTML = '';
            
            if (jobs.length === 0) {
              tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No jobs found</td></tr>';
            } else {
              jobs.forEach(job => {
                // Determine queue pill class
                let queuePillClass = '';
                if (job.queue === 'email') queuePillClass = 'pill-email';
                else if (job.queue === 'notification') queuePillClass = 'pill-notification';
                else if (job.queue === 'processing') queuePillClass = 'pill-processing';
                
                // Determine status pill class
                let statusPillClass = '';
                if (job.status === 'completed') statusPillClass = 'pill-completed';
                else if (job.status === 'active') statusPillClass = 'pill-active';
                else if (job.status === 'waiting') statusPillClass = 'pill-waiting';
                else if (job.status === 'failed') statusPillClass = 'pill-failed';
                else if (job.status === 'delayed') statusPillClass = 'pill-delayed';
                
                tableBody.innerHTML += \`
                  <tr>
                    <td>\${job.id}</td>
                    <td><span class="pill \${queuePillClass}">\${job.queue}</span></td>
                    <td>\${job.name}</td>
                    <td><span class="pill \${statusPillClass}">\${job.status}</span></td>
                    <td class="timestamp">\${formatDate(job.timestamp)}</td>
                    <td>
                      <button class="button button-blue" onclick="viewJob('\${job.id}')">View</button>
                      <button class="button" onclick="viewJobLogs('\${job.id}')">Logs</button>
                      \${job.status !== 'completed' && job.status !== 'failed' ? 
                        \`<button class="button button-red" onclick="cancelJob('\${job.id}')">Cancel</button>\` : 
                        ''}
                    </td>
                  </tr>
                \`;
              });
            }
            
            // Update pagination
            updatePagination(pagination);
          } else {
            console.error('Failed to load jobs:', data.error);
          }
        } catch (error) {
          console.error('Error loading jobs:', error);
        } finally {
          document.getElementById('jobsLoader').style.display = 'none';
        }
      }
      
      // Update pagination controls
      function updatePagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = '';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '←';
        prevButton.disabled = pagination.page <= 1;
        prevButton.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            loadJobs();
          }
        });
        paginationElement.appendChild(prevButton);
        
        // Page numbers
        const totalPages = Math.ceil(pagination.totalJobs / pagination.limit) || 1;
        
        for (let i = 1; i <= totalPages; i++) {
          const pageButton = document.createElement('button');
          pageButton.textContent = i;
          pageButton.classList.toggle('active', i === pagination.page);
          pageButton.addEventListener('click', () => {
            currentPage = i;
            loadJobs();
          });
          paginationElement.appendChild(pageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = '→';
        nextButton.disabled = !pagination.hasMore;
        nextButton.addEventListener('click', () => {
          if (pagination.hasMore) {
            currentPage++;
            loadJobs();
          }
        });
        paginationElement.appendChild(nextButton);
      }
      
      // Function to view job details
      async function viewJob(id) {
        try {
          const response = await fetch(\`/api/v1/jobs/\${id}\`);
          const data = await response.json();
          
          // Display in modal
          document.getElementById('modalTitle').textContent = \`Job Details: \${id}\`;
          document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          document.getElementById('responseModal').style.display = 'block';
        } catch (error) {
          console.error('Error viewing job:', error);
        }
      }
      
      // Function to view job logs
      async function viewJobLogs(id) {
        try {
          const response = await fetch(\`/api/v1/jobs/\${id}/logs\`);
          const data = await response.json();
          
          // Display in modal
          document.getElementById('modalTitle').textContent = \`Job Logs: \${id}\`;
          document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          document.getElementById('responseModal').style.display = 'block';
        } catch (error) {
          console.error('Error viewing job logs:', error);
        }
      }
      
      // Function to cancel a job
      async function cancelJob(id) {
        if (confirm(\`Are you sure you want to cancel job \${id}?\`)) {
          try {
            const response = await fetch(\`/api/v1/jobs/\${id}\`, {
              method: 'DELETE'
            });
            const data = await response.json();
            
            // Display in modal
            document.getElementById('modalTitle').textContent = \`Cancel Job: \${id}\`;
            document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
            document.getElementById('responseModal').style.display = 'block';
            
            // Reload jobs
            loadJobs();
            loadStats();
          } catch (error) {
            console.error('Error cancelling job:', error);
          }
        }
      }
      
      // Test functions for the test tab
      async function testCreateEmail() {
        const to = document.getElementById('emailTo').value;
        const subject = document.getElementById('emailSubject').value;
        const body = document.getElementById('emailBody').value;
        
        try {
          const response = await fetch('/api/v1/jobs/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, subject, body })
          });
          const data = await response.json();
          
          // Display in modal
          document.getElementById('modalTitle').textContent = 'Create Email Job Response';
          document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          document.getElementById('responseModal').style.display = 'block';
          
          // Reload data
          loadStats();
          loadJobs();
        } catch (error) {
          console.error('Error creating email job:', error);
        }
      }
      
      async function testWelcomeEmail() {
        const email = document.getElementById('welcomeEmail').value;
        const name = document.getElementById('welcomeName').value;
        
        try {
          const response = await fetch('/api/v1/jobs/email/welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, name })
          });
          const data = await response.json();
          
          // Display in modal
          document.getElementById('modalTitle').textContent = 'Welcome Email Response';
          document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          document.getElementById('responseModal').style.display = 'block';
          
          // Reload data
          loadStats();
          loadJobs();
        } catch (error) {
          console.error('Error creating welcome email:', error);
        }
      }
      
      async function testPasswordResetEmail() {
        const email = document.getElementById('resetEmail').value;
        const resetToken = document.getElementById('resetToken').value;
        
        try {
          const response = await fetch('/api/v1/jobs/email/password-reset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, resetToken })
          });
          const data = await response.json();
          
          // Display in modal
          document.getElementById('modalTitle').textContent = 'Password Reset Email Response';
          document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          document.getElementById('responseModal').style.display = 'block';
          
          // Reload data
          loadStats();
          loadJobs();
        } catch (error) {
          console.error('Error creating password reset email:', error);
        }
      }
      
      async function testCreateNotification() {
        const userId = document.getElementById('notifUserId').value;
        const message = document.getElementById('notifMessage').value;
        const channel = document.getElementById('notifChannel').value;
        
        try {
          const response = await fetch('/api/v1/jobs/notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, message, channel })
          });
          const data = await response.json();
          
          // Display in modal
          document.getElementById('modalTitle').textContent = 'Create Notification Response';
          document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          document.getElementById('responseModal').style.display = 'block';
          
          // Reload data
          loadStats();
          loadJobs();
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
      
      async function testCreateProcessing() {
        try {
          const dataValue = document.getElementById('processingData').value;
          const data = JSON.parse(dataValue);
          const priority = document.getElementById('processingPriority').value;
          
          const response = await fetch('/api/v1/jobs/processing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data, priority })
          });
          const responseData = await response.json();
          
          // Display in modal
          document.getElementById('modalTitle').textContent = 'Create Processing Job Response';
          document.getElementById('responseContainer').innerHTML = \`<pre>\${JSON.stringify(responseData, null, 2)}</pre>\`;
          document.getElementById('responseModal').style.display = 'block';
          
          // Reload data
          loadStats();
          loadJobs();
        } catch (error) {
          console.error('Error creating processing job:', error);
          alert('Error: ' + error.message);
        }
      }
      
      async function testGetJob() {
        const jobId = document.getElementById('jobId').value;
        viewJob(jobId);
      }
      
      async function testGetJobLogs() {
        const jobId = document.getElementById('jobId').value;
        viewJobLogs(jobId);
      }
      
      async function testCancelJob() {
        const jobId = document.getElementById('jobId').value;
        cancelJob(jobId);
      }
      
      // Modal functions
      function closeModal() {
        document.getElementById('responseModal').style.display = 'none';
      }
      
      // Close modal when clicking outside the content
      window.onclick = function(event) {
        const modal = document.getElementById('responseModal');
        if (event.target == modal) {
          modal.style.display = 'none';
        }
      }
      
      // Set up refresh buttons
      document.getElementById('refreshStats').addEventListener('click', loadStats);
      document.getElementById('refreshJobs').addEventListener('click', loadJobs);
      
      // Initial data load
      loadStats();
      loadJobs();
    </script>
  </body>
  </html>
  `);
});

logger.info('Queue dashboard initialized at /dashboard');