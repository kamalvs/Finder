const express = require("express");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");

const authRouter = express.Router();

authRouter.post("/signUp", async (req, res) => {
  const { firstName, lastName, emailId, password, age, gender } = req.body;
  try {
    //validate data
    validateSignUpData(req);

    //encrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
    });
    await user.save();

    const token = await user.generateAuthToken();
    res.cookie("token", token, { httpOnly: true });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId });

    if (!user) {
      throw new Error("Invalid email or password!!");
    }
    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.generateAuthToken();
      res.cookie("token", token, { httpOnly: true });
      res.status(200).json({
        success: true,
        data: user,
      });
    } else {
      throw new Error("Invalid email or password!");
    }
  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.status(200).json({
    success: true,
    data: null,
  });
});

module.exports = authRouter;
