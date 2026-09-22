const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const { authMiddleware } = require('./middleware/auth');
const authRoute = require('./routes/auth');
const publicRoute = require('./routes/public');
const roomsRoute = require('./routes/rooms');
const tenantsRoute = require('./routes/tenants');
const paymentsRoute = require('./routes/payments');
const logsRoute = require('./routes/logs');
const settingsRoute = require('./routes/settings');
const statsRoute = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Public API routes (No auth required)
app.use('/api/public', publicRoute);
app.use('/api/auth', authRoute);

// 2. Protected Admin API routes (Protected by authMiddleware)
app.use('/api', authMiddleware);
app.use('/api/rooms', roomsRoute);
app.use('/api/tenants', tenantsRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/logs', logsRoute);
app.use('/api/settings', settingsRoute);
app.use('/api/stats', statsRoute);

// Helper to get local network IP address
function getLocalIp() {
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

// Serve static frontend in production (dist folder)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint API tidak ditemukan' });
  }
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <head><title>KosManager Server</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h2>Sistem Manajemen Kos Berjalan</h2>
            <p>API Server aktif di port ${PORT}.</p>
            <p>Frontend sedang disiapkan atau jalankan mode development (<code>npm run dev</code>).</p>
          </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`====================================================`);
  console.log(`🏡 SISTEM MANAJEMEN KOS AKTIF`);
  console.log(`💻 Akses di Komputer ini: http://localhost:${PORT}`);
  console.log(`📱 Akses dari HP/Laptop via Wi-Fi: http://${localIp}:${PORT}`);
  console.log(`====================================================`);
});
