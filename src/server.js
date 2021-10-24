import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import bcrypt from "bcrypt";

const PORT = 4000;

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

instrument(io, {
  auth: {
    type: "basic",
    username: "admin",
    password: bcrypt.hashSync("123", 10),
  },
});

const countInRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size;
};

const publicRoom = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });

  return publicRooms;
};

io.on("connection", (socket) => {
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket["nickname"], countInRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    io.sockets.emit("public", publicRoom());
  });
  socket.on("enter_room", ({ nickname, room }, done) => {
    socket.join(room);
    socket["nickname"] = nickname;
    done(room);
    socket.to(room).emit("welcome", nickname, countInRoom(room));
    io.sockets.emit("public", publicRoom());
  });

  socket.on("message", (msg, room, done) => {
    socket.to(room).emit("message", `${socket["nickname"]} : ${msg}`);
    done();
  });
});

server.listen(PORT, handler);
