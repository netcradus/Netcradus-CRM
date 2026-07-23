// DigitalOcean App Platform Root Boot Redirector
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server folder if present
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

// Run the main server application
require('./server/index.js');
