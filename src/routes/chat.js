const express = require("express");
const chatRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const Chat = require("../models/chat");
const { assertChatAllowed } = require("../utils/chatAccess");

chatRouter.get("/chat/get/:userId", userAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const loggedInUserId = req.user._id;
    await assertChatAllowed(loggedInUserId, userId);
    let chat = await Chat.findOne({
      participants: { $all: [userId, loggedInUserId], $size: 2 },
    });
    if (!chat) {
      chat = new Chat({
        participants: [userId, loggedInUserId],
        messages: [],
      });
      await chat.save();
    }
    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (err) {
    const status = err.statusCode || 400;
    res.status(status).json({ message: err.message });
  }
});

module.exports = chatRouter;
