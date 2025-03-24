require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const axios = require("axios");
const path = require('path');
const fs = require('fs').promises;
const ACCESS_FOLDER = './Access to AI';
// const { getAllFiles, readFileContent } = require('../controllers/Files.controllers.js');

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieSession = require("cookie-session");

const session = require('express-session');





const app = express();
app.use(express.json());
app.use(cors({
  origin: "*", 
  credentials: true
}));

connectDB();

const GEMINI_API_URL = process.env.GEMINI_API_URL;

// Context store for MCP - Ensure this file exports a SINGLETON object
const contextStore = require("./contextStore");

// Routes
app.use("/api", require("./routes/authRoutes"));

// ✅ Chat endpoint with MCP Context Memory Fix
app.post('/api/chat', async (req, res) => {
  try {
    const mcp = req.body;
    const { context_id, data } = mcp;

    if (!context_id) {
      return res.status(400).json({ error: 'Invalid MCP format: missing context_id' });
    }

    const userMessage = data.user_message || data.contents?.[0]?.parts?.[0]?.text;
    if (!userMessage) {
      return res.status(400).json({ error: 'Invalid MCP format: missing user message' });
    }

    // ✅ Initialize context if it doesn't exist
    if (!contextStore[context_id]) {
      contextStore[context_id] = [];
    }

    // ✅ Add user message to context
    contextStore[context_id].push({ role: 'user', content: userMessage });

    // ✅ Optional: Log context for debugging
    console.log(`Context for ${context_id}:`, contextStore[context_id]);

    // ✅ Prepare the messages for Gemini API
    const formattedMessages = contextStore[context_id].map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // ✅ Call Gemini API
    const response = await axios.post(GEMINI_API_URL, {
      contents: formattedMessages
    });

    const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';

    // ✅ Store AI response in context
    contextStore[context_id].push({ role: 'assistant', content: aiResponse });

    // ✅ Send MCP response
    res.json({
      protocol: 'mcp',
      version: '1.0',
      module: 'chat',
      context_id,
      data: { response: aiResponse }
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

app.post('/api/read-files', (req, res) => {
  try {
    const files = getAllFiles(ACCESS_FOLDER);
    const filesData = files.map(file => ({
      filePath: file,
      content: readFileContent(file),
    }));

    res.json({ success: true, filesData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error reading files" });
  }
});



// OAuth with Google
// app.use(
//   cookieSession({
//     name: "session",
//     keys: [process.env.SESSION_SECRET],
//     maxAge: 24 * 60 * 60 * 1000,
//   })
// );

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));


app.use(passport.initialize());
app.use(passport.session());


// Passport Google OAuth Strategy
passport.use(
  new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Store user info in DB if needed
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:5173/chat");
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.get("/user", (req, res) => {
  if (req.isAuthenticated()) res.json(req.user);
  else res.status(401).send("Not authenticated");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
