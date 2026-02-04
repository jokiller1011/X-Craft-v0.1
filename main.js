import { initWasm, wasmMove } from "./wasm.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let engine = "js";
let username = "";
let x = 50, y = 50;

const players = {};
let peer, conn;

document.getElementById("start").onclick = async () => {
  username = document.getElementById("username").value || "Player";
  engine = document.getElementById("engine").value;

  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

  if (engine === "wasm") {
    await initWasm();
  }

  startMultiplayer();
  requestAnimationFrame(loop);
};

function startMultiplayer() {
  peer = new Peer();

  peer.on("open", id => {
    if (location.hash) {
      conn = peer.connect(location.hash.slice(1));
      setupConn();
    } else {
      location.hash = id;
    }
  });

  peer.on("connection", c => {
    if (Object.keys(players).length >= 2) return;
    conn = c;
    setupConn();
  });
}

function setupConn() {
  conn.on("data", data => {
    players[data.id] = data;
  });
}

function sendState() {
  if (conn && conn.open) {
    conn.send({ id: username, x, y });
  }
}

window.onkeydown = e => {
  if (engine === "js") {
    if (e.key === "w") y -= 5;
    if (e.key === "s") y += 5;
    if (e.key === "a") x -= 5;
    if (e.key === "d") x += 5;
  } else {
    const pos = wasmMove(x, y, e.key);
    x = pos[0];
    y = pos[1];
  }
};

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(x, y, 20, 20);
  ctx.fillText(username, x, y - 5);

  ctx.fillStyle = "cyan";
  for (const p of Object.values(players)) {
    ctx.fillRect(p.x, p.y, 20, 20);
    ctx.fillText(p.id, p.x, p.y - 5);
  }

  sendState();
  requestAnimationFrame(loop);
}
