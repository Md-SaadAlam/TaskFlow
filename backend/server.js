// Entry point: loads environment variables, connects to MongoDB, then starts Express.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001; // Render provides PORT; locally we fall back to 5000.

function checkEnvironment() {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}. Check backend/.env`);
  }
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production.');
  }
}

async function startServer() {
  try {
    checkEnvironment();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`TaskFlow API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (error) {
    console.error('Could not start the server:', error.message);
    process.exit(1);
  }
}

startServer();
