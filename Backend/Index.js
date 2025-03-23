require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const axios = require("axios");
const path = require('path');
const fs = require('fs').promises;

// Initialize express app
const app = express();
app.use(express.json());
app.use(cors());

// Connect to database
connectDB();

// Define Gemini API URL from environment variables
const GEMINI_API_URL = process.env.GEMINI_API_URL;

// Context store for MCP
const contextStore = require("./contextStore");

// Recursive file search function
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
            return `File: ${file}\n${content.slice(0, 500)}...`; // Limiting content length
          }
        } catch (err) {
          console.error(`Error reading file ${filePath}:`, err);
        }
      } else if (stats.isDirectory()) {
        // Recursively search subdirectories
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

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const mcp = req.body;
    const { context_id, data, fileSearch } = mcp;

    // Validate request format
    if (!context_id) {
      return res.status(400).json({ error: 'Invalid MCP format: missing context_id' });
    }

    // Extract user message with fallback support for both formats
    const userMessage = data.user_message || data.contents?.[0]?.parts?.[0]?.text;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Invalid MCP format: missing user message' });
    }
    
    // Initialize context if it doesn't exist
    if (!contextStore[context_id]) {
      contextStore[context_id] = [];
    }
    
    // Add user message to context
    contextStore[context_id].push({ role: 'user', content: userMessage });

    // Search for relevant file content if requested
    let fileData = '';
    if (fileSearch) {
      fileData = await searchRelevantFile(userMessage);
    }

    // Combine user message with file data if available
    const combinedMessage = fileData ? `${userMessage}\n\nFile Data:\n${fileData}` : userMessage;

    // Format messages for Gemini API
    const formattedMessages = contextStore[context_id].map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Update the last user message with combined message if file data was found
    if (fileData && formattedMessages.length > 0) {
      formattedMessages[formattedMessages.length - 1] = {
        role: 'user',
        parts: [{ text: combinedMessage }]
      };
    }

    // Check if GEMINI_API_URL is defined
    if (!GEMINI_API_URL) {
      throw new Error('GEMINI_API_URL is not defined in environment variables');
    }

    // Make request to Gemini API
    const response = await axios.post(GEMINI_API_URL, {
      contents: formattedMessages
    });

    // Extract and store AI response
    const aiResponse = response.data.candidates[0].content.parts[0].text;
    contextStore[context_id].push({ role: 'assistant', content: aiResponse });

    // Send response back to client
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));