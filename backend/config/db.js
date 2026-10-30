const mongoose = require('mongoose');

// Connects to MongoDB using the connection string from the .env file.
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add it to backend/.env (see .env.example).');
  }

  // Fail after 10 seconds instead of hanging forever if Atlas cannot be reached.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
}

module.exports = connectDB;
