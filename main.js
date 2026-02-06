// ================= SCENE + RENDERER =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

const camera = new THREE.PerspectiveCamera(
  75,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// ================= MENU =================
const menu = document.getElementById("menu");
const startBtn = document.getElementById("start");
let gameStarted = false;

startBtn.onclick = () => {
  menu.style.display = "none";
  gameStarted = true;
  document.body.requestPointerLock();
};

// ================= LIGHTING =================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

// ================= TEXTURES =================
const texLoader = new THREE.TextureLoader();

const grassTop = texLoader.load("textures/grass_top.png");
const grassSide = texLoader.load("textures/grass_side.png");
const dirtTex = texLoader.load("textures/dirt.png");
const sandTex = texLoader.load("textures/sand.png");

[grassTop, grassSide, dirtTex, sandTex].forEach(t => {
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
});

// ================= BLOCK SYSTEM =================
const blocks = [];
const raycaster = new THREE.Raycaster();

function createBlock(type, x, y, z) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  let mat;

  if (type === "grass") {
    mat = [
      new THREE.MeshStandardMaterial({ map: grassSide }),
      new THREE.MeshStandardMaterial({ map: grassSide }),
      new THREE.MeshStandardMaterial({ map: grassTop }),
      new THREE.MeshStandardMaterial({ map: dirtTex }),
      new THREE.MeshStandardMaterial({ map: grassSide }),
      new THREE.MeshStandardMaterial({ map: grassSide })
    ];
  } else if (type === "dirt") {
    mat = new THREE.MeshStandardMaterial({ map: dirtTex });
  } else if (type === "sand") {
    mat = new THREE.MeshStandardMaterial({ map: sandTex });
  }

  const block = new THREE.Mesh(geo, mat);
  block.position.set(x, y, z);
  block.userData.type = type;

  scene.add(block);
  blocks.push(block);
}

// ================= WORLD =================
for (let x = -10; x <= 10; x++) {
  for (let z = -10; z <= 10; z++) {
    createBlock("grass", x, 0, z);
  }
}

// ================= INVENTORY =================
const inventory = {
  grass: 10,
  dirt: 10,
  sand: 10
};
let selectedBlock = "grass";

// ================= HUD =================
const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.bottom = "20px";
hud.style.left = "50%";
hud.style.transform = "translateX(-50%)";
hud.style.color = "white";
hud.style.fontFamily = "monospace";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.padding = "8px";
document.body.appendChild(hud);

// ================= PLAYER =================
let player;
const loader = new THREE.GLTFLoader();

loader.load("models/player.glb", gltf => {
  player = gltf.scene;
  player.scale.set(0.5, 0.5, 0.5);
  player.position.set(0, 1, 0);
  scene.add(player);
});

// ================= CHEST =================
loader.load("models/Chest.glb", gltf => {
  const chest = gltf.scene;
  chest.position.set(3, 1, 3);
  chest.scale.set(0.8, 0.8, 0.8);
  scene.add(chest);
});

// ================= CONTROLS =================
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "1") selectedBlock = "grass";
  if (e.key === "2") selectedBlock = "dirt";
  if (e.key === "3") selectedBlock = "sand";
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ================= MOUSE LOOK =================
let yaw = 0;
let pitch = 0;

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== document.body) return;
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-1.5, Math.min(1.5, pitch));
});

// ================= PHYSICS =================
let velocityY = 0;
const gravity = -0.015;
const jumpPower = 0.35;
let onGround = false;

// ================= BLOCK BREAK / PLACE =================
document.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("mousedown", e => {
  if (!gameStarted || !player) return;

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(blocks);
  if (!hits.length) return;

  const hit = hits[0];
  const block = hit.object;

  // LEFT CLICK = BREAK
  if (e.button === 0) {
    scene.remove(block);
    blocks.splice(blocks.indexOf(block), 1);
    inventory[block.userData.type]++;
  }

  // RIGHT CLICK = PLACE
  if (e.button === 2 && inventory[selectedBlock] > 0) {
    const pos = block.position.clone().add(hit.face.normal);
    pos.x = Math.round(pos.x);
    pos.y = Math.round(pos.y);
    pos.z = Math.round(pos.z);
    createBlock(selectedBlock, pos.x, pos.y, pos.z);
    inventory[selectedBlock]--;
  }
});

// ================= GAME LOOP =================
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) {
    renderer.render(scene, camera);
    return;
  }

  if (player) {
    velocityY += gravity;
    player.position.y += velocityY;

    if (player.position.y <= 1) {
      player.position.y = 1;
      velocityY = 0;
      onGround = true;
    }

    if (keys[" "] && onGround) {
      velocityY = jumpPower;
      onGround = false;
    }

    const speed = 0.06;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

    if (keys.w) player.position.addScaledVector(forward, speed);
    if (keys.s) player.position.addScaledVector(forward, -speed);
    if (keys.a) player.position.addScaledVector(right, -speed);
    if (keys.d) player.position.addScaledVector(right, speed);

    camera.position.set(player.position.x, player.position.y + 1.6, player.position.z);
    camera.rotation.set(pitch, yaw, 0);
    player.rotation.y = yaw;
  }

  hud.innerHTML = `
[1] Grass: ${inventory.grass}
[2] Dirt: ${inventory.dirt}
[3] Sand: ${inventory.sand}
<br>Selected: ${selectedBlock}
`;

  renderer.render(scene, camera);
}

animate();

// ================= RESIZE =================
window.addEventListener("resize", () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});
