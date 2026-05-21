require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const initializeSocket = require("./utils/socket");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const uploadRouter = require("./routes/upload");
const chatRouter = require("./routes/chat");
const app = express();

const server = http.createServer(app);
initializeSocket(server);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", uploadRouter);
app.use("/", chatRouter);

connectDB()
  .then(() => {
    console.log("DB connection established");
    server.listen(process.env.PORT, () => {
      console.log(`app is successfully listening at port ${process.env.PORT}`);
    });
  })
  .catch(() => {
    console.log("DB connection failed");
  });
