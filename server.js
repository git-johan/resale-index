// Enhanced HTTP server for mobile-first development
// - Serves HTML page and proxies API calls (avoids CORS issues)
// - Network accessible for mobile testing via ngrok
// - Live reload functionality for rapid development

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 8080;
const WEBSOCKET_PORT = 9001;
const API_URL = process.env.TINGS_RESALE_TAGS_URL;
const API_KEY = process.env.TINGS_RESALE_API_KEY;

// Main async function to initialize server
async function startServer() {
  // Simple live reload (optional) - can work without WebSockets
  let hasLiveReload = false;
  let wsClients = [];

  // Try to setup live reload with WebSockets (optional)
  try {
    const wsModule = await import('ws');
    const WebSocketServer = wsModule.WebSocketServer || wsModule.default.Server;
    const WebSocket = wsModule.default;

    if (WebSocketServer) {
      const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
      hasLiveReload = true;

      wss.on('connection', (ws) => {
        wsClients.push(ws);
        console.log('🔄 Live reload client connected');

        ws.on('close', () => {
          wsClients = wsClients.filter(client => client !== ws);
          console.log('📱 Live reload client disconnected');
        });
      });

      // Watch for file changes and trigger reload
      const watchFiles = [
        'index.html',
        'exclusions.js',
        'src/styles/main.css',
        'src/js/app.js',
        'src/js/services/apiService.js',
        'src/js/components/StackItem.js',
        'src/js/components/HeaderComponent.js',
        'src/js/components/BrandSearchComponent.js',
        'src/js/components/TagComponent.js',
        'src/js/components/StatsComponent.js'
      ];

      watchFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          fs.watchFile(filePath, { interval: 500 }, () => {
            console.log(`🔄 File changed: ${file} - reloading clients`);
            wsClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send('reload');
              }
            });
          });
        }
      });
    }
  } catch (e) {
    console.log('Live reload disabled - WebSockets not available');
  }

// Get local IP for network access
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer(async (req, res) => {
  // Enable CORS for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Serve the HTML file with live reload injection
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

      // Inject live reload script if live reload is available
      if (hasLiveReload) {
        const liveReloadScript = `
<!-- Live Reload for Development -->
<script>
(function() {
  // Only enable live reload for localhost HTTP (not HTTPS/ngrok)
  if (window.location.hostname === 'localhost' && window.location.protocol === 'http:') {
    try {
      const ws = new WebSocket('ws://localhost:9001');

      ws.onmessage = function(event) {
        if (event.data === 'reload') {
          console.log('🔄 Live reload triggered');
          window.location.reload();
        }
      };
      ws.onopen = function() {
        console.log('🔄 Live reload connected');
      };
      ws.onerror = function() {
        console.log('⚠️ Live reload unavailable (use localhost HTTP for live reload)');
      };
    } catch (e) {
      console.log('⚠️ Live reload disabled:', e.message);
    }
  } else if (window.location.hostname.includes('ngrok') || window.location.protocol === 'https:') {
    console.log('🌍 Live reload disabled for HTTPS/ngrok (use localhost:8080 for development)');
  }
})();
</script>`;
        html = html.replace('</head>', liveReloadScript + '\n</head>');
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      res.writeHead(500);
      res.end('Error loading page');
    }
    return;
  }

  // Serve the exclusions.js file
  if (url.pathname === '/exclusions.js') {
    try {
      const js = fs.readFileSync(path.join(__dirname, 'exclusions.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (error) {
      res.writeHead(500);
      res.end('Error loading exclusions');
    }
    return;
  }

  // Serve files from src/ directory (JS, CSS, etc.)
  if (url.pathname.startsWith('/src/')) {
    try {
      const filePath = path.join(__dirname, url.pathname);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Determine content type based on file extension
      let contentType = 'text/plain';
      if (url.pathname.endsWith('.js')) {
        contentType = 'application/javascript';
      } else if (url.pathname.endsWith('.css')) {
        contentType = 'text/css';
      } else if (url.pathname.endsWith('.json')) {
        contentType = 'application/json';
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fileContent);
    } catch (error) {
      res.writeHead(404);
      res.end('File not found');
    }
    return;
  }

  // Serve files from dist/ directory (compiled CSS, etc.)
  if (url.pathname.startsWith('/dist/')) {
    try {
      const filePath = path.join(__dirname, url.pathname);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Determine content type based on file extension
      let contentType = 'text/plain';
      if (url.pathname.endsWith('.js')) {
        contentType = 'application/javascript';
      } else if (url.pathname.endsWith('.css')) {
        contentType = 'text/css';
      } else if (url.pathname.endsWith('.json')) {
        contentType = 'application/json';
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fileContent);
    } catch (error) {
      res.writeHead(404);
      res.end('File not found');
    }
    return;
  }

  // Proxy API calls
  if (url.pathname.startsWith('/api/')) {
    const apiEndpoint = url.pathname.replace('/api', '');

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const requestData = JSON.parse(body);

          // Make request to actual API using native Node.js HTTP
          const postData = JSON.stringify(requestData);
          const url = new URL(apiEndpoint, API_URL);
          const isHttps = url.protocol === 'https:';
          const client = isHttps ? https : http;

          const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              'api-key': API_KEY
            },
            timeout: 30000 // 30 second timeout
          };

          console.log(`API Request: ${apiEndpoint}`, requestData);

          const apiResponse = await new Promise((resolve, reject) => {
            const req = client.request(options, (apiRes) => {
              console.log(`API Response Status: ${apiRes.statusCode}`);
              let body = '';
              apiRes.on('data', chunk => body += chunk);
              apiRes.on('end', () => {
                try {
                  const json = JSON.parse(body);
                  console.log(`API Response received (${body.length} chars)`);
                  resolve(json);
                } catch (e) {
                  console.error('JSON parse error:', e.message);
                  reject(new Error('Invalid JSON response'));
                }
              });
            });

            req.on('error', (error) => {
              console.error('Request error:', error.message);
              reject(error);
            });

            req.on('timeout', () => {
              console.error('Request timeout');
              req.abort();
              reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
          });

          const responseData = apiResponse;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(responseData));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
    return;
  }

  // 404 for other paths
  res.writeHead(404);
  res.end('Not found');
});

// Start server with network access for mobile testing
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();

  console.log('\n🚀 Enhanced development server started!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📱 Local:    http://localhost:${PORT}`);
  console.log(`🌐 Network:  http://${localIP}:${PORT}`);
  console.log(`🔄 Live reload: ${hasLiveReload ? 'Enabled' : 'Disabled (install ws: npm install ws)'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏷️  Try these URLs:');
  console.log(`   http://localhost:${PORT}?brand=nike`);
  console.log(`   http://localhost:${PORT}?brand=adidas`);
  console.log(`   http://localhost:${PORT}?brand=balenciaga`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌍 For ngrok tunnel:');
  console.log(`   ngrok http --url=tings-resale-index.ngrok.app ${PORT}`);
  console.log('   Then access: https://tings-resale-index.ngrok.app?brand=nike');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

} // End of startServer function

// Start the server
startServer().catch(console.error);