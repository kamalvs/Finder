const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const {
  REQUEST_STATUS,
  SEND_ALLOWED_STATUS,
  REVIEW_ALLOWED_STATUS,
} = require("../constants/requestStatus");

//send a connection request or ignore a profile
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      if (fromUserId.toString() === toUserId) {
        throw new Error("Cannot send request to yourself");
      }
      //check for allowed status
      if (!SEND_ALLOWED_STATUS.includes(status)) {
        throw new Error("Invalid status type: " + status);
      }

      //check for repeated connection request
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingConnectionRequest) {
        throw new Error("Connection request already exist");
      }

      //check toUserId exist
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        throw new Error("User not found!");
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      await connectionRequest.save();

      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
);

//accept or reject a connection request
requestRouter.post(
  "/request/view/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      //check for allowed status
      if (!REVIEW_ALLOWED_STATUS.includes(status)) {
        throw new Error("Invalid status type: " + status);
      }

      //connection request check
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: REQUEST_STATUS.INTERESTED,
      });

      if (!connectionRequest) {
        throw new Error("Invalid connection request");
      }

      connectionRequest.status = status;

      const data = await connectionRequest.save();

      res.status(200).json({
        success: true,
        data: data,
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
);

module.exports = requestRouter;
