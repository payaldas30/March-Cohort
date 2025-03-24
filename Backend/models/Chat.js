const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  chats: [
    {
      role: String,       // 'user' or 'assistant'
      content: String,    // message text
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Chat', chatSchema);
