require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const axios = require("axios");
const contextStore = require("./contextStore");

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use("/api", require("./routes/authRoutes"));
// app.use("/api", require("./routes/chatRoutes"));

app.post('/api/chat', async (req, res) => {
  const mcp = req.body;
  const { context_id, data } = mcp;

  if (!context_id || !data?.user_message) {
    return res.status(400).json({ error: 'Invalid MCP format' });
  }

  if (!contextStore[context_id]) contextStore[context_id] = [];
  contextStore[context_id].push({ role: 'user', content: data.user_message });

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAYMP-D54ty2tRR4MlVVNgwOZ_8IHJE_dk",
      {
        contents: contextStore[context_id].map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    contextStore[context_id].push({ role: 'assistant', content: aiResponse });

    const mcpResponse = {
      protocol: 'mcp',
      version: '1.0',
      module: 'chat',
      context_id,
      data: { response: aiResponse }
    };

    res.json(mcpResponse);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
