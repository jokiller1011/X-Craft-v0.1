import * as THREE from "https://cdn.skypack.dev/three@0.152.2";
import { GLTFLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js";

/* =========================
   CORE SETUP
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

/* =========================
   LIGHTING
========================= */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(50, 100, 50);
scene.add(sun);

/* =========================
   TEXTURES
========================= */
const texLoader = new THREE.TextureLoader();
const textures = {
  grass: texLoader.load("textures/grass.png"),
  dirt: texLoader.load("textures/dirt.png"),
  stone: texLoader.load("textures/stone.png")
};
Object.values(textures).forEach(t => {
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
});

/* =========================
   WORLD DATA (CHUNK READY)
========================= */
const blocks = [];
const worldData = {}; // chunk-safe storage

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

/* =========================
   BLOCK CREATION
========================= */
function createBlock(type, x, y, z) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ map: textures[type] });
  const block = new THREE.Mesh(geo, mat);

  block.position.set(x, y, z);
  block.userData.type = type;

  scene.add(block);
  blocks.push(block);
  worldData[blockKey(x, y, z)] = type;
}

/* =========================
   GENERATE WORLD
========================= */
for (let x = -10; x < 10; x++) {
  for (let z = -10; z < 10; z++) {
    createBlock("grass", x, 0, z);
  }
}

/* =========================
   PLAYER + INVENTORY
========================= */
let selectedBlock = "grass";

const playerInventory = {
  grass: 10,
  dirt: 10,
  stone: 5
};

const tools = {
  hand: 1,
  pickaxe: 3
};
let currentTool = "hand";

/* =========================
   CHEST
========================= */
const chestInventory = { grass: 3, stone: 2 };
let chestObject = null;
let chestOpen = false;

new GLTFLoader().load("models/Chest.glb", gltf => {
  chestObject = gltf.scene;
  chestObject.position.set(2, 1, 2);
  chestObject.scale.set(0.8, 0.8, 0.8);
  scene.add(chestObject);
});

/* =========================
   UI (INVENTORY + CRAFTING)
========================= */
const ui = document.createElement("div");
ui.style = `
position:fixed;top:50%;left:50%;
transform:translate(-50%,-50%);
background:#111;color:white;
padding:15px;font-family:monospace;
display:none;z-index:10;
`;
document.body.appendChild(ui);

function renderUI() {
  ui.innerHTML = `
<h3>Chest</h3>
${Object.entries(chestInventory).map(([k,v])=>`<button data-c="c" data-i="${k}">${k}:${v}</button>`).join("<br>")}
<hr>
<h3>You</h3>
${Object.entries(playerInventory).map(([k,v])=>`<button data-c="p" data-i="${k}">${k}:${v}</button>`).join("<br>")}
<hr>
<h3>Craft</h3>
<button id="craft-pickaxe">Pickaxe (2 stone)</button>
<br><small>ESC to close</small>
`;
}

ui.onclick = e => {
  const i = e.target.dataset.i;
  const c = e.target.dataset.c;

  if (i && c === "c" && chestInventory[i] > 0) {
    chestInventory[i]--;
    playerInventory[i]++;
  }
  if (i && c === "p" && playerInventory[i] > 0) {
    playerInventory[i]--;
    chestInventory[i]++;
  }

  if (e.target.id === "craft-pickaxe" && playerInventory.stone >= 2) {
    playerInventory.stone -= 2;
    currentTool = "pickaxe";
    alert("Crafted Pickaxe!");
  }

  renderUI();
};

/* =========================
   CONTROLS
========================= */
document.body.onclick = () => document.body.requestPointerLock();

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== document.body) return;
  camera.rotation.y -= e.movementX * 0.002;
  camera.rotation.x -= e.movementY * 0.002;
  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
});

document.addEventListener("mousedown", e => {
  if (chestOpen) return;

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects([...blocks, chestObject].filter(Boolean), true);
  if (!hits.length) return;

  const obj = hits[0].object;

  if (chestObject && (obj === chestObject || chestObject.children.includes(obj))) {
    chestOpen = true;
    ui.style.display = "block";
    document.exitPointerLock();
    renderUI();
    return;
  }

  if (e.button === 0 && blocks.includes(obj)) {
    scene.remove(obj);
    blocks.splice(blocks.indexOf(obj), 1);
    playerInventory[obj.userData.type]++;
  }

  if (e.button === 2 && playerInventory[selectedBlock] > 0) {
    const p = obj.position.clone().add(hits[0].face.normal);
    p.set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
    createBlock(selectedBlock, p.x, p.y, p.z);
    playerInventory[selectedBlock]--;
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && chestOpen) {
    chestOpen = false;
    ui.style.display = "none";
    document.body.requestPointerLock();
  }
});

/* =========================
   SAVE / LOAD
========================= */
window.addEventListener("beforeunload", () => {
  localStorage.setItem("world", JSON.stringify(worldData));
  localStorage.setItem("inv", JSON.stringify(playerInventory));
});

/* =========================
   LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
