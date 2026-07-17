# googleAuth.js

<a href="https://github.com/huokaaa/googleauth">
   <img src="https://img.shields.io/github/stars/huokaaa/googleauth?style=for-the-badge&logo=github"/>
</a>
<a href="https://nodejs.org">
   <img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&labelColor=green&logoColor=white&style=for-the-badge"/>
</a>
<a href="#">
   <img src="https://img.shields.io/badge/CommonJS-only?logo=javascript&labelColor=yellow&logoColor=black&style=for-the-badge"/>
</a>

A simple single-file module for logging in with a Google account (OAuth 2.0, Authorization Code Flow). Your project just needs to import this module and call two functions: `getAuthUrl()` and `handleCallback(code)`. Everything related to redirecting to Google, exchanging the authorization code, and verifying tokens is handled inside the module.

**Tech stack:** Node.js

## Features

- Generate the Google login URL (`getAuthUrl`)
- Exchange the authorization code for the user's profile data (`handleCallback`)
- Returns clean user data: `googleId`, `email`, `name`, `picture`, etc.
- No extra setup needed besides filling in Client ID and Client Secret

## Dependency

```bash
npm install google-auth-library
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or use an existing one)
3. Click **Create Credentials -> OAuth client ID**
   - If prompted, set up the **OAuth consent screen** first (app name, email, etc.)
   - Application type: **Web application**
4. In the **Authorized redirect URIs** field, add the callback URL your project will use, e.g.:
   ```
   http://localhost:3000/auth/google/callback
   ```
5. Once created, a **Client ID** and **Client Secret** will appear. Save both.

## Usage

1. Copy the `googleAuth.js` file into your project folder.
2. Open the file and fill in the `CONFIG` section at the top:

   ```js
   const CONFIG = {
     CLIENT_ID: 'your-client-id-here',
     CLIENT_SECRET: 'your-client-secret-here',
     REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
   };
   ```

   Make sure `REDIRECT_URI` matches exactly what you registered in Google Cloud Console.

3. Import and use it in your routes:

   ```js
   const googleAuth = require('./googleAuth');

   // Route to start the login process
   app.get('/auth/google', (req, res) => {
     res.redirect(googleAuth.getAuthUrl());
   });

   // Callback route, this is the one registered as the Authorized redirect URI
   app.get('/auth/google/callback', async (req, res) => {
     try {
       const profile = await googleAuth.handleCallback(req.query.code);
       // profile = { googleId, email, emailVerified, name, givenName, familyName, picture, tokens }

       // continue based on your project's needs, e.g.:
       // - find/create the user in your database using profile.googleId or profile.email
       // - create your own session or JWT
       // - redirect to a dashboard page

       res.json(profile);
     } catch (err) {
       res.status(401).json({ error: err.message });
     }
   });
   ```

   Note: since the callback route is a real page the browser navigates to (not an AJAX call), whatever you send back there is what the user will see. If you only do `res.json(profile)` without redirecting, the user will stay on that blank JSON page after Google sends them back. Redirect them to an actual page in your app (e.g. `res.redirect('/dashboard')`) once you've set up their session, or use a popup + `postMessage` flow if your frontend is a single-page app.

## Data Returned by `handleCallback()`

| Field           | Description                                    |
|-----------------|-------------------------------------------------|
| `googleId`      | Unique Google account ID (`sub`)                |
| `email`         | Google account email                            |
| `emailVerified` | Boolean, whether the email is verified by Google |
| `name`          | Full name                                       |
| `givenName`     | First name                                      |
| `familyName`    | Last name                                       |
| `picture`       | Profile picture URL                             |
| `tokens`        | Object containing `access_token`, `id_token`, `refresh_token` (if any), etc. from Google |

## Before Pushing to GitHub

This module stores the Client ID and Client Secret hardcoded in the file (not via `.env`), so the file can be copy-pasted into any project without any extra setup.

The trade-off: **you must clear `CLIENT_ID` and `CLIENT_SECRET` in `googleAuth.js` before committing/pushing to GitHub**, even if the repository is private. Credentials that get committed will remain in the git history even after you edit the file again later, unless the history is rewritten.

Checklist before pushing:

- [ ] `CLIENT_ID` cleared back to `''`
- [ ] `CLIENT_SECRET` cleared back to `''`
- [ ] `REDIRECT_URI` can be left as is (not secret), or cleared too for extra caution

## Notes

- This module is meant to be used by copying the file directly into a project (not via `npm install`). It's planned to be published as its own npm package later.
- The default scopes used are only `email` and `profile`. If you need additional access (Google Drive, Calendar, etc.), add the scope to the `SCOPES` array in `googleAuth.js`.
- `access_type: 'offline'` and `prompt: 'consent'` in `getAuthUrl()` make sure Google always returns a `refresh_token`, not just an `access_token`.

## Author

[@huokaaa](https://github.com/huokaaa)
