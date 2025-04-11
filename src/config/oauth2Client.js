const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath));

// Get client ID and secret based on credential type
const clientId = credentials.web?.client_id || credentials.installed?.client_id;
const clientSecret = credentials.web?.client_secret || credentials.installed?.client_secret;
const redirectUri = credentials.web?.redirect_uris?.[0] || credentials.installed?.redirect_uris?.[0];

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error('Invalid credentials format. Missing required fields.');
}

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Try to load existing token
const tokenPath = path.join(__dirname, 'token.json');
if (fs.existsSync(tokenPath)) {
  const token = JSON.parse(fs.readFileSync(tokenPath));
  oauth2Client.setCredentials(token);
}

module.exports = oauth2Client; 