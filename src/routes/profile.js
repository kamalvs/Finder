const express = require("express");
const profileRouter = express.Router();
const { validateProfileEditData } = require("../utils/validation");
const { userAuth } = require("../middlewares/auth");
const bcrypt = require("bcrypt");

//view profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//edit profile
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    const isEditAllowed = validateProfileEditData(req);
    if (!isEditAllowed) {
      throw new Error("Invalid edit fields!");
    }
    const loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    await loggedInUser.save();
    res.status(200).json({ success: true, data: loggedInUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//reset password
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const loggedInUser = req.user;
    const isPasswordValid = await loggedInUser.validatePassword(oldPassword);
    if (!isPasswordValid) {
      throw new Error("Invalid old password!");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    loggedInUser.password = passwordHash;
    await loggedInUser.save();
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
module.exports = profileRouter;
