import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import bcrypt from "bcrypt";

const PORT = 3000;

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname + "/views"));
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));

// app.get("/*", (req, res) => res.redirect("/"));

const handler = () => console.log(`server running - http://localhost:${PORT}/`);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join", async (msg) => {
    const roomName = msg;
    socket.join(roomName);
    socket.to(roomName).emit("hello", "someone joined");
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      io.to(room).emit("bye", "someone out");
    });
  });
  socket.on("offer", (offer, room) => {
    socket.to(room).emit("offer", offer);
  });
  socket.on("answer", (answer, room) => {
    socket.to(room).emit("answer", answer);
  });
  socket.on("ice", (ice, room) => {
    socket.to(room).emit("ice", ice);
  });
});

server.listen(PORT, handler);
