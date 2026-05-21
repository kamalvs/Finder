const express = require("express");
const uploadRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { getUploadUrl } = require("../utils/s3");

uploadRouter.post("/upload-url", userAuth, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    const uploadUrl = await getUploadUrl(fileName, fileType);

    res.status(200).json({
      success: true,
      data: uploadUrl,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = uploadRouter;
