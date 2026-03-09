#!/usr/bin/env node

/**
 * OAuth2 Gmail Refresh Token Generator
 * 
 * Ezt futtasd a Morocz projekt root mappájában:
 *   node get-gmail-token.js
 * 
 * Ez:
 * 1. Megnyitja a böngésződet a Google OAuth2 authorization oldalon
 * 2. Vár, hogy hozzájárulj a Gmail access-hez
 * 3. Cseréli az auth code-ot refresh token-re
 * 4. Frissíti az .env.local fájlt az új token-nel
 */

const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ENV variables szükségesek
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "662910267823-sjeg2l1keaubu67ea9ivkfb6at7edd6n.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
const REDIRECT_URI = "http://localhost:3001/callback";

const authParams = new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: "https://www.googleapis.com/auth/gmail.send",
  access_type: "offline",
  prompt: "consent",
});
const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;

console.log("🔐 Gmail OAuth2 Token Generator\n");
console.log("Megnyitom a böngészőt a Google OAuth2 authorization oldalon...\n");
console.log(`Authorization URL: ${authorizationUrl}\n`);

let server;

// HTTP server a callback-hez
server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === "/callback") {
    const code = parsedUrl.query.code;
    const error = parsedUrl.query.error;

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>❌ Hiba: ${error}</h1><p>Kérjük, próbálkozz újra.</p>`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>❌ Nincs authorization code</h1>");
      server.close();
      process.exit(1);
    }

    console.log("✅ Authorization code kapott!\n");

    try {
      // Token exchange
      console.log("🔄 Token exchange...");
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      const refreshToken = tokenData.refresh_token;

      if (!refreshToken) {
        throw new Error("Refresh token not in response");
      }

      console.log("✅ Refresh token megkapva!\n");

      // Update .env.local
      const envPath = path.join(process.cwd(), ".env.local");
      let envContent = "";

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
      }

      // Replace or add GMAIL_REFRESH_TOKEN
      if (envContent.includes("GMAIL_REFRESH_TOKEN=")) {
        envContent = envContent.replace(
          /GMAIL_REFRESH_TOKEN=.*/,
          `GMAIL_REFRESH_TOKEN=${refreshToken}`
        );
      } else {
        envContent += `\nGMAIL_REFRESH_TOKEN=${refreshToken}`;
      }

      fs.writeFileSync(envPath, envContent, "utf-8");
      console.log("✅ .env.local frissítve!\n");

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <html>
          <head><title>✅ Gmail OAuth2 Sikeres</title></head>
          <body>
            <h1>✅ Gmail OAuth2 Sikeres!</h1>
            <p>Az új refresh token-t mentésre került az <code>.env.local</code> fájlba.</p>
            <p>Most már újraindíthatod a dev server-t:</p>
            <pre>npm run dev</pre>
            <p>Ez az ablak bezárható.</p>
          </body>
        </html>
      `);

      server.close();
      process.exit(0);
    } catch (err) {
      console.error("❌ Hiba a token exchange-ben:", err);
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>❌ Token exchange hiba</h1><p>${err.message}</p>`);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3001, () => {
  console.log("📡 Callback server fut: http://localhost:3001\n");
  console.log("Nyisd meg az alábbi linket a böngészőben:\n");
  console.log(authorizationUrl.toString() + "\n");

  // Próbálja megnyitni a böngészőt (macOS/Linux/Windows)
  try {
    if (process.platform === "win32") {
      spawn("start", [authorizationUrl.toString()], { shell: true });
    } else if (process.platform === "darwin") {
      spawn("open", [authorizationUrl.toString()]);
    } else {
      spawn("xdg-open", [authorizationUrl.toString()]);
    }
  } catch (err) {
    console.log("(Böngésző nem nyílt meg automatikusan, kérjük nyisd meg kézzel)\n");
  }
});
