const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const fs = require("fs");
let rawData = fs.existsSync("data.json") ? fs.readFileSync("data.json") : "{}";
let data = JSON.parse(rawData);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

// --- website access password ---
const SITE_PASSWORD = "BCCSMOKE";

// --- login attempts tracking ---
let attempts = {};
let lockouts = {};

// --- Routes ---
app.post("/check-site-password", (req, res) => {
  const { password, username } = req.body;
  if (lockouts[username] && Date.now() < lockouts[username]) {
    return res.json({ success: false, message: "Locked out. Wait 5 min." });
  }
  attempts[username] = attempts[username] || 0;
  if (password === SITE_PASSWORD) {
    attempts[username] = 0;
    return res.json({ success: true });
  } else {
    attempts[username]++;
    if (attempts[username] >= 5) {
      lockouts[username] = Date.now() + 5 * 60 * 1000;
      attempts[username] = 0;
    }
    return res.json({ success: false, message: "Wrong password." });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (lockouts[username] && Date.now() < lockouts[username]) {
    return res.json({ success: false, message: "Locked out. Wait 5 min." });
  }
  attempts[username] = attempts[username] || 0;
  
  if (username === "admin" && password === "787Sang!!") {
    return res.json({ success: true, admin: true });
  }
  
  if (data[username]) {
    if (data[username].password === password) {
      attempts[username] = 0;
      return res.json({ success: true });
    } else {
      attempts[username]++;
      if (attempts[username] >= 5) {
        lockouts[username] = Date.now() + 5 * 60 * 1000;
        attempts[username] = 0;
      }
      return res.json({ success: false, message: "Wrong password" });
    }
  } else {
    // create new account
    data[username] = { password, money: 1000, banned: false };
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
    return res.json({ success: true, newAccount: true });
  }
});

// --- multiplayer ---
let rooms = {};

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join-room", (room, username) => {
    socket.join(room);
    socket.username = username;
    rooms[room] = rooms[room] || { players: [], status: "waiting" };
    rooms[room].players.push(username);
    io.to(room).emit("room-update", rooms[room]);
  });

  socket.on("chat", (room, message) => {
    io.to(room).emit("chat", { username: socket.username, message });
  });

  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room].players = rooms[room].players.filter(u => u !== socket.username);
      io.to(room).emit("room-update", rooms[room]);
    }
    console.log("a user disconnected");
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

