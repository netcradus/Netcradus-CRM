/**
 * This script helps you generate a Google OAuth Refresh Token locally.
 * 
 * Usage:
 * 1. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your server/.env
 * 2. Run: node scripts/get-refresh-token.js
 * 3. Follow the instructions in the terminal.
 */

const { google } = require('googleapis');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function getRefreshToken() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in .env');
    console.log('Please add them to server/.env first.');
    process.exit(1);
  }

  // Common redirect URI for local tools
  const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
  
  // Create OAuth2 client
  // Note: For "Web application" client types, GCP requires a redirect URI that matches.
  // We specify 'postmessage' as a fallback or the user can use the Playground method.
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent to ensure refresh token is always returned
  });

  console.log('\n--- Google OAuth Token Generator ---\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Log in and authorize the app.');
  console.log('3. Copy the "code" parameter from the URL you are redirected to (e.g., http://localhost/?code=4/0Afge...)');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\n4. Paste the authorization code (or the full URL you were redirected to) here: ', async (input) => {
    rl.close();
    
    let code = input.trim();
    
    // Auto-extract code if the user pasted a full URL or "code=..."
    try {
      if (code.includes('code=')) {
        const urlParams = new URLSearchParams(code.split('?')[1] || code);
        code = urlParams.get('code') || code;
      }
    } catch (e) {
      // Fallback to raw input if URL parsing fails
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('\n✅ Success! Tokens received:');
      console.log('\n--- Copy this into your .env ---');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('-------------------------------\n');
      console.log('Note: If refresh_token is "undefined", revoking access in your Google Account and trying again usually fixes it.');
    } catch (err) {
      console.error('\n❌ Error exchanging code for tokens:', err.message);
      console.log('\nTip: Make sure you use the code immediately after generating it, as they expire quickly.');
    }
  });
}

getRefreshToken();
