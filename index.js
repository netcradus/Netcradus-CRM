// DigitalOcean App Platform Root Boot Redirector
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server folder if present
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "super_secret_jwt_key_for_development_12345";
}

// Run the main server application
require('./server/index.js');
