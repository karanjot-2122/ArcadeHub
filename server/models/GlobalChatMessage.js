const mongoose = require('mongoose');

const GlobalChatMessageSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GlobalChatMessage', GlobalChatMessageSchema);
