import * as THREE from "https://cdn.skypack.dev/three@0.152.2";

/* =====================
   BASIC SETUP
===================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* =====================
   START MENU (SCHOOL SAFE)
===================== */
let gameStarted = false;

const menu = document.createElement("div");
menu.style = `
position:fixed;inset:0;
background:#111;color:white;
display:flex;align-items:center;justify-content:center;
font-family:monospace;z-index:10;
`;
menu.innerHTML = `<button id="startBtn" style="font-size:24px;">START</button>`;
document.body.appendChild(menu);

document.getElementById("startBtn").onclick = () => {
  gameStarted = true;
  menu.remove();
  document.body.requestPointerLock();
};

/* =====================
   LIGHTING
===================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.7);
sun.position.set(50, 100, 50);
scene.add(sun);

/* =====================
   TEXTURES
===================== */
const loader = new THREE.TextureLoader();
const grassTex = loader.load("textures/grass.png");
grassTex.magFilter = grassTex.minFilter = THREE.NearestFilter;

/* =====================
   BLOCK + CHUNKS
===================== */
const CHUNK_SIZE = 16;
const chunks = {};
const blocks = [];

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function createBlock(x, y, z) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ map: grassTex });
  const block = new THREE.Mesh(geo, mat);
  block.position.set(x, y, z);
  scene.add(block);
  blocks.push(block);
}

function generateChunk(cx, cz) {
  const key = chunkKey(cx, cz);
  if (chunks[key]) return;
  chunks[key] = [];

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const wx = cx * CHUNK_SIZE + x;
      const wz = cz * CHUNK_SIZE + z;
      createBlock(wx, 0, wz);
    }
  }
}

function updateChunks() {
  const cx = Math.floor(camera.position.x / CHUNK_SIZE);
  const cz = Math.floor(camera.position.z / CHUNK_SIZE);

  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      generateChunk(cx + dx, cz + dz);
    }
  }
}

/* =====================
   CONTROLS
===================== */
let yaw = 0, pitch = 0;
const keys = {};

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

document.addEventListener("mousemove", e => {
  if (!gameStarted) return;
  if (document.pointerLockElement !== document.body) return;

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-1.5, Math.min(1.5, pitch));
});

/* =====================
   GAME LOOP
===================== */
function animate() {
  requestAnimationFrame(animate);

  if (gameStarted) {
    const speed = 0.08;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

    if (keys["w"]) camera.position.addScaledVector(forward, speed);
    if (keys["s"]) camera.position.addScaledVector(forward, -speed);
    if (keys["a"]) camera.position.addScaledVector(right, -speed);
    if (keys["d"]) camera.position.addScaledVector(right, speed);

    camera.rotation.set(pitch, yaw, 0);
    updateChunks();
  }

  renderer.render(scene, camera);
}

animate();

/* =====================
   RESIZE
===================== */
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
