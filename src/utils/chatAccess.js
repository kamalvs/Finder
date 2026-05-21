const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { REQUEST_STATUS } = require("../constants/requestStatus");

const assertChatAllowed = async (loggedInUserId, otherUserId) => {
  if (loggedInUserId.toString() === otherUserId.toString()) {
    const err = new Error("Cannot chat with yourself");
    err.statusCode = 400;
    throw err;
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const accepted = await ConnectionRequest.findOne({
    status: REQUEST_STATUS.ACCEPTED,
    $or: [
      { fromUserId: loggedInUserId, toUserId: otherUserId },
      { fromUserId: otherUserId, toUserId: loggedInUserId },
    ],
  });

  if (!accepted) {
    const err = new Error("You can only chat with connected users");
    err.statusCode = 403;
    throw err;
  }
};

module.exports = { assertChatAllowed };
