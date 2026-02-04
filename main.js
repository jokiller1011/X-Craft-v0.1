import { initWasm, wasmMove } from "./wasm.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let engine = "js";
let username = "";
let x = 100, y = 100;

const players = {};
let peer = null;
let conn = null;

document.getElementById("start").onclick = async () => {
  try {
    console.log("Start clicked");

    username = document.getElementById("username").value || "Player";
    engine = document.getElementById("engine").value;

    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";

    if (engine === "wasm") {
      console.log("Initializing WASM");
      await initWasm();
    }

    startMultiplayer();
    requestAnimationFrame(loop);

  } catch (err) {
    alert("Game failed to start. Check console.");
    console.error(err);
  }
};

function startMultiplayer() {
  peer = new Peer();

  peer.on("open", id => {
    console.log("Peer ID:", id);
  });

  peer.on("error", err => {
    console.warn("Peer error:", err);
  });
}

window.addEventListener("keydown", e => {
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
});

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(x, y, 20, 20);
  ctx.fillText(username, x, y - 5);

  requestAnimationFrame(loop);
}
