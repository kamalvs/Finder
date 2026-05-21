const socket = require("socket.io");
const Chat = require("../models/chat");
const { assertChatAllowed } = require("./chatAccess");

const createRoomId = (senderId, targetUserId) => {
  return [senderId, targetUserId].sort().join("_");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", async ({ loggedInUserId, targetUserId }) => {
      try {
        await assertChatAllowed(loggedInUserId, targetUserId);
        const roomId = createRoomId(loggedInUserId, targetUserId);
        socket.join(roomId);
      } catch (err) {
        socket.emit("chatError", { message: err.message });
      }
    });

    socket.on("sendMessage", async ({ senderId, targetUserId, text }) => {
      const roomId = createRoomId(senderId, targetUserId);
      try {
        await assertChatAllowed(senderId, targetUserId);
        let chat = await Chat.findOne({
          participants: { $all: [senderId, targetUserId], $size: 2 },
        });
        if (!chat) {
          chat = new Chat({
            participants: [senderId, targetUserId],
            messages: [],
          });
        }
        chat.messages.push({ senderId, text });
        await chat.save();
        const newMessage = {
          senderId,
          text,
          createdAt: new Date(),
        };
        io.to(roomId).emit("receiveMessage", newMessage);
      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("chatError", { message: err.message });
      }
    });
  });
};

module.exports = initializeSocket;
