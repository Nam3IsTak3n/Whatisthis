const socket = io();
let username = "";

// --- Site password ---
function checkSitePassword() {
  const pass = document.getElementById("site-pass").value;
  const user = document.getElementById("username-site").value;
  fetch("/check-site-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pass, username: user })
  }).then(res => res.json())
    .then(data => {
      if(data.success){
        username = user;
        document.getElementById("site-password-screen").style.display = "none";
        document.getElementById("login-screen").style.display = "block";
      } else {
        document.getElementById("site-pass-msg").innerText = data.message;
      }
    });
}

// --- Login ---
function login(){
  const user = document.getElementById("login-username").value;
  const pass = document.getElementById("login-password").value;
  fetch("/login", {
    method:"POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  }).then(res => res.json())
    .then(data => {
      if(data.success){
        username = user;
        document.getElementById("login-screen").style.display="none";
        document.getElementById("game-screen").style.display="block";
        document.getElementById("user-name").innerText = username;
        socket.emit("join-room", "main-room", username);
      } else {
        document.getElementById("login-msg").innerText = data.message;
      }
    });
}

// --- Chat ---
function sendChat(){
  const msg = document.getElementById("chat-msg").value;
  socket.emit("chat","main-room", msg);
}

socket.on("chat", data=>{
  const li = document.createElement("li");
  li.innerText = `${data.username}: ${data.message}`;
  document.getElementById("chat-log").appendChild(li);
});

// --- Join games ---
function joinPoker(){ alert("Poker game starting soon!"); }
function joinBlackjack(){ alert("Blackjack game starting soon!"); }

