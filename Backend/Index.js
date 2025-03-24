require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const axios = require("axios");
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

const GEMINI_API_URL = process.env.GEMINI_API_URL;

// Context store for MCP - Ensure this file exports a SINGLETON object
const contextStore = require("./contextStore");

// Recursive file search function (leave unchanged)
async function searchRelevantFile(keyword) {
  try {
    const folderPath = 'E:/AI-Access';
    return await searchDirectory(folderPath, keyword);
  } catch (error) {
    console.error('Error searching files:', error);
    return '';
  }
}

async function searchDirectory(directoryPath, keyword) {
  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.includes(keyword)) {
            return `File: ${file}\n${content.slice(0, 500)}...`;
          }
        } catch (err) {
          console.error(`Error reading file ${filePath}:`, err);
        }
      } else if (stats.isDirectory()) {
        const result = await searchDirectory(filePath, keyword);
        if (result) return result;
      }
    }
    return '';
  } catch (error) {
    console.error(`Error accessing directory ${directoryPath}:`, error);
    return '';
  }
}

// Routes
app.use("/api", require("./routes/authRoutes"));

// ✅ Chat endpoint with MCP Context Memory Fix
app.post('/api/chat', async (req, res) => {
  try {
    const mcp = req.body;
    const { context_id, data, fileSearch } = mcp;

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

    // ✅ Search file if needed
    let fileData = '';
    if (fileSearch) {
      fileData = await searchRelevantFile(userMessage);
    }

    const combinedMessage = fileData ? `${userMessage}\n\nFile Data:\n${fileData}` : userMessage;

    // ✅ Update the last user message if file data was found
    if (fileData) {
      contextStore[context_id][contextStore[context_id].length - 1] = { role: 'user', content: combinedMessage };
    }

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
