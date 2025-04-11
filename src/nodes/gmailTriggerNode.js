const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs').promises;
const path = require('path');
// require ("./credentials.json")

class GmailTriggerNode {
    constructor(config) {
        this.config = config;
        this.oauth2Client = null;
        this.gmail = null;
        this.credentialsPath = path.join(__dirname, '../config/credentials.json');
        this.tokenPath = path.join(__dirname, '../config/token.json');
    }

    async initialize() {
        try {
            // Check if credentials file exists
            try {
                await fs.access(this.credentialsPath);
            } catch (error) {
                console.error('Credentials file not found. Please place credentials.json in the config directory.');
                return false;
            }

            // Load credentials
            const credentials = JSON.parse(await fs.readFile(this.credentialsPath));
            const { client_secret, client_id, redirect_uris } = credentials.installed;
            
            // Create OAuth2 client
            this.oauth2Client = new OAuth2Client(
                client_id,
                client_secret,
                redirect_uris[0]
            );

            // Load token if exists
            try {
                await fs.access(this.tokenPath);
                const token = JSON.parse(await fs.readFile(this.tokenPath));
                this.oauth2Client.setCredentials(token);
            } catch (error) {
                console.log('No token found. Please authenticate.');
                return false;
            }

            // Initialize Gmail API
            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
            return true;
        } catch (error) {
            console.error('Error initializing Gmail trigger:', error);
            return false;
        }
    }

    async getAuthUrl() {
        const credentials = JSON.parse(await fs.readFile(this.credentialsPath));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        
        this.oauth2Client = new OAuth2Client(
            client_id,
            client_secret,
            redirect_uris[0]
        );

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/gmail.readonly'],
            prompt: 'consent',
            redirect_uri: 'http://localhost:5173'
        });

        return authUrl;
    }

    async saveToken(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            await fs.writeFile(this.tokenPath, JSON.stringify(tokens));
            return true;
        } catch (error) {
            console.error('Error saving token:', error);
            return false;
        }
    }

    async getEmailAddress() {
        try {
            const response = await this.gmail.users.getProfile({ userId: 'me' });
            return response.data.emailAddress;
        } catch (error) {
            console.error('Error getting email address:', error);
            return null;
        }
    }

    async processEmail(email) {
        try {
            const message = await this.gmail.users.messages.get({
                userId: 'me',
                id: email.id,
                format: 'full'
            });

            const headers = message.data.payload.headers;
            const subject = this.getHeader(headers, 'Subject');
            const from = this.getHeader(headers, 'From');
            const date = this.getHeader(headers, 'Date');

            let body = '';
            if (message.data.payload.parts) {
                for (const part of message.data.payload.parts) {
                    if (part.mimeType === 'text/plain') {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        break;
                    }
                }
            } else if (message.data.payload.body.data) {
                body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
            }

            return {
                id: email.id,
                subject,
                from,
                date,
                body
            };
        } catch (error) {
            console.error('Error processing email:', error);
            return null;
        }
    }

    getHeader(headers, name) {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
    }

    async execute() {
        if (!this.gmail) {
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize Gmail client');
            }
        }

        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults: this.config?.numEmails || 2,
                q: 'is:unread'
            });

            const messages = response.data.messages || [];
            const processedEmails = [];

            for (const message of messages) {
                const processedEmail = await this.processEmail(message);
                if (processedEmail) {
                    processedEmails.push(processedEmail);
                }
            }

            // Format the output in a more LLM-friendly way
            const emailText = processedEmails.map(email => 
                `Email ${processedEmails.indexOf(email) + 1}:
Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}
Body: ${email.body}
-------------------`
            ).join('\n\n');

            return {
                type: 'email',
                content: emailText,
                summary: `Found ${processedEmails.length} unread emails.`
            };
        } catch (error) {
            console.error('Error executing Gmail trigger:', error);
            throw error;
        }
    }
}

module.exports = GmailTriggerNode; 