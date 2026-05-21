const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const userRouter = express.Router();
const {
  REQUEST_STATUS,
  SEND_ALLOWED_STATUS,
  REVIEW_ALLOWED_STATUS,
} = require("../constants/requestStatus");

const USER_SAFE_DATA = [
  "firstName",
  "lastName",
  "gender",
  "photoUrl",
  "about",
  "skills",
  "age",
];

//GET all the pending connection request for the loggedIn user
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: REQUEST_STATUS.INTERESTED,
    }).populate("fromUserId", USER_SAFE_DATA);

    res.status(200).json({
      success: true,
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//GET all accepted connections - get all friends
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const acceptedConnections = await ConnectionRequest.find({
      $or: [
        {
          toUserId: loggedInUser._id,
          status: REQUEST_STATUS.ACCEPTED,
        },
        {
          fromUserId: loggedInUser._id,
          status: REQUEST_STATUS.ACCEPTED,
        },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const data = acceptedConnections.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Feed
userRouter.get("/feed", userAuth, async (req, res) => {
  const loggedInUser = req.user;

  const page = req.query.page || 1;
  let limit = req.query.limit || 10;
  limit = limit > 50 ? 50 : limit;
  const skip = (page - 1) * limit;

  const connectionRequests = await ConnectionRequest.find({
    $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
  });

  const hiddenUsers = new Set();
  connectionRequests.forEach((connection) => {
    (hiddenUsers.add(connection.fromUserId.toString()),
      hiddenUsers.add(connection.toUserId.toString()));
  });

  const users = await User.find({
    _id: { $nin: Array.from(hiddenUsers), $ne: loggedInUser._id },
  })
    .select(USER_SAFE_DATA)
    .skip(skip)
    .limit(limit);

  res.json({ data: users });
});

userRouter.get("/user/profile/:userId", userAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select(USER_SAFE_DATA);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
