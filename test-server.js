// Ultra-simple test server for Coolify deployment verification
const http = require('http');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // Log all requests
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      message: '✅ Server is running!',
      timestamp: new Date().toISOString(),
      port: PORT,
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }

  // Root endpoint
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AISteth Test Server</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 800px; 
              margin: 50px auto; 
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #2563eb; }
            .status { 
              background: #10b981; 
              color: white; 
              padding: 10px 20px; 
              border-radius: 5px; 
              display: inline-block;
              margin: 20px 0;
            }
            .info { 
              background: #f3f4f6; 
              padding: 15px; 
              border-radius: 5px;
              margin: 20px 0;
            }
            code { 
              background: #e5e7eb; 
              padding: 2px 6px; 
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏥 AISteth Test Server</h1>
            <div class="status">✅ Server is Running Successfully!</div>
            
            <div class="info">
              <h3>Server Information:</h3>
              <ul>
                <li><strong>Port:</strong> ${PORT}</li>
                <li><strong>Node.js:</strong> ${process.version}</li>
                <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              </ul>
            </div>

            <h3>Available Endpoints:</h3>
            <ul>
              <li><code>GET /</code> - This page</li>
              <li><code>GET /health</code> - Health check (JSON)</li>
              <li><code>GET /test</code> - Simple test endpoint</li>
            </ul>

            <p><strong>🎉 Coolify deployment is working!</strong></p>
          </div>
        </body>
      </html>
    `);
    return;
  }

  // Test endpoint
  if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Test endpoint working!',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    path: req.url
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 AISteth Test Server Started Successfully!');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started: ${new Date().toISOString()}`);
  console.log(`📦 Node.js: ${process.version}`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log(`  - http://localhost:${PORT}/`);
  console.log(`  - http://localhost:${PORT}/health`);
  console.log(`  - http://localhost:${PORT}/test`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});




