/**
 * ============================================================
 *  googleAuth.js
 *  Simple Google OAuth 2.0 login module (Authorization Code Flow)
 * ============================================================
 *
 *  SETUP INSTRUCTIONS
 *  -------------------
 *  1. Go to https://console.cloud.google.com/apis/credentials
 *  2. Create/select a project, then create a credential of type
 *     "OAuth client ID"
 *     - Application type: Web application
 *  3. In the "Authorized redirect URIs" field, add your callback URL,
 *     e.g.: http://localhost:3000/auth/google/callback
 *     (this URL MUST match REDIRECT_URI below EXACTLY)
 *  4. Copy the "Client ID" and "Client secret" that appear, then
 *     fill them into the CONFIG section below.
 *
 *  IMPORTANT - BEFORE UPLOADING TO GITHUB / GIT PUSH:
 *  -----------------------------------------------
 *  Clear CLIENT_ID and CLIENT_SECRET below (set them back to empty
 *  strings ""), so your real credentials don't get committed to
 *  the repository (public or private).
 *
 *  HOW TO USE IN YOUR PROJECT
 *  -----------------------
 *    const googleAuth = require('./googleAuth');
 *
 *    // 1) Route to start login -> redirect user to Google
 *    app.get('/auth/google', (req, res) => {
 *      res.redirect(googleAuth.getAuthUrl());
 *    });
 *
 *    // 2) Callback route -> Google redirects here with a "code"
 *    app.get('/auth/google/callback', async (req, res) => {
 *      try {
 *        const profile = await googleAuth.handleCallback(req.query.code);
 *        // profile = { googleId, email, emailVerified, name, givenName,
 *        //             familyName, picture }
 *        // -> find/create the user in your database, create a
 *        //    session/JWT, then redirect the user somewhere in your app
 *        res.json(profile);
 *      } catch (err) {
 *        res.status(401).json({ error: err.message });
 *      }
 *    });
 *
 *  DEPENDENCY
 *  -----------
 *    npm install google-auth-library
 *
 * ============================================================
 */

const { OAuth2Client } = require('google-auth-library');

// ============================================================
//  CONFIG - FILL THIS IN
//  (clear it again before pushing to GitHub)
// ============================================================
const CONFIG = {
  CLIENT_ID: '',       // <-- Client ID from Google Cloud Console
  CLIENT_SECRET: '',   // <-- Client Secret from Google Cloud Console
  REDIRECT_URI: 'http://localhost:3000/auth/google/callback', // <-- adjust as needed
};

// Default scopes: minimal, just enough to get profile + email.
// Add more scopes here if needed (e.g. Google Drive, Calendar, etc).
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// ============================================================
//  INTERNAL - no need to change this
// ============================================================

function validateConfig() {
  if (!CONFIG.CLIENT_ID || !CONFIG.CLIENT_SECRET) {
    throw new Error(
      '[googleAuth] CLIENT_ID / CLIENT_SECRET is empty. ' +
      'Fill in the CONFIG section in googleAuth.js before using it.'
    );
  }
}

function createClient() {
  validateConfig();
  return new OAuth2Client(
    CONFIG.CLIENT_ID,
    CONFIG.CLIENT_SECRET,
    CONFIG.REDIRECT_URI
  );
}

/**
 * Generate the redirect URL to Google's login page.
 * Call this and res.redirect(url) in your initial login route.
 *
 * @param {string} [state] - optional, for CSRF protection or carrying
 *                            data (e.g. the path to redirect to after
 *                            a successful login)
 * @returns {string} Google OAuth URL
 */
function getAuthUrl(state) {
  const client = createClient();

  return client.generateAuthUrl({
    access_type: 'offline',   // so a refresh_token is also returned
    prompt: 'consent',        // always show the consent screen (so a refresh_token is returned every time)
    scope: SCOPES,
    state: state || undefined,
  });
}

/**
 * Exchange the authorization "code" (from the callback query param)
 * for the user's profile data.
 *
 * @param {string} code - req.query.code in the callback route
 * @returns {Promise<object>} user profile
 *   { googleId, email, emailVerified, name, givenName, familyName, picture }
 */
async function handleCallback(code) {
  if (!code) {
    throw new Error('[googleAuth] "code" was not found in the callback request.');
  }

  const client = createClient();

  // Exchange code -> tokens (access_token, id_token, refresh_token)
  const { tokens } = await client.getToken(code);

  // Verify & decode the id_token to get the user data
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: CONFIG.CLIENT_ID,
  });

  const payload = ticket.getPayload();

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    name: payload.name,
    givenName: payload.given_name,
    familyName: payload.family_name,
    picture: payload.picture,
    // tokens are also included in case the project needs the access_token/refresh_token
    tokens,
  };
}

module.exports = {
  getAuthUrl,
  handleCallback,
};
