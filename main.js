// ============================
// BASIC SETUP
// ============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Menu
const menu = document.getElementById('menu');
const startBtn = document.getElementById('start');
const canvas = document.getElementById('game');

let gameStarted = false;

startBtn.addEventListener('click', () => {
  menu.style.display = 'none';
  gameStarted = true;

  // Delay pointer lock so browser allows it
  setTimeout(() => {
    document.body.requestPointerLock();
  }, 100);
});

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setPixelRatio(window.devicePixelRatio);

// Resize fix
window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});

// ============================
// LIGHTING
// ============================
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

// ============================
// TEXTURES & BLOCK MATERIALS
// ============================
const textureLoader = new THREE.TextureLoader();

function loadTex(path) {
  const t = textureLoader.load(path);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

const BLOCK_MATERIALS = {
  grass: [
    new THREE.MeshStandardMaterial({ map: loadTex('textures/grass_side.png') }),
    new THREE.MeshStandardMaterial({ map: loadTex('textures/grass_side.png') }),
    new THREE.MeshStandardMaterial({ map: loadTex('textures/grass_top.png') }),
    new THREE.MeshStandardMaterial({ map: loadTex('textures/dirt.png') }),
    new THREE.MeshStandardMaterial({ map: loadTex('textures/grass_side.png') }),
    new THREE.MeshStandardMaterial({ map: loadTex('textures/grass_side.png') })
  ],
  dirt: new THREE.MeshStandardMaterial({ map: loadTex('textures/dirt.png') }),
  stone: new THREE.MeshStandardMaterial({ map: loadTex('textures/stone.png') })
};

// ============================
// BLOCK FACTORY
// ============================
const blocks = [];
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

function createBlock(type, x, y, z) {
  const block = new THREE.Mesh(blockGeo, BLOCK_MATERIALS[type]);
  block.position.set(x + 0.5, y + 0.5, z + 0.5);
  block.userData.type = type;
  scene.add(block);
  blocks.push(block);
}

// ============================
// GENERATE WORLD
// ============================
for (let x = -10; x < 10; x++) {
  for (let z = -10; z < 10; z++) {
    createBlock('grass', x, 0, z);
    createBlock('dirt', x, -1, z);
    createBlock('stone', x, -2, z);
  }
}

// ============================
// PLAYER (placeholder cube for now)
// ============================
const player = new THREE.Object3D();
player.position.set(0, 2, 0);
scene.add(player);

// ============================
// CONTROLS
// ============================
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Mouse look
let yaw = 0;
let pitch = 0;

document.addEventListener('mousemove', e => {
  if (!gameStarted) return;

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});

// ============================
// PHYSICS
// ============================
let velocityY = 0;
const gravity = -0.015;
const jumpStrength = 0.35;
let onGround = false;

document.addEventListener('keydown', e => {
  if (e.key === ' ' && onGround) {
    velocityY = jumpStrength;
    onGround = false;
  }
});

// ============================
// GAME LOOP
// ============================
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) {
    renderer.render(scene, camera);
    return;
  }

  // Gravity
  velocityY += gravity;
  player.position.y += velocityY;

  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    onGround = true;
  }

  // Movement
  const speed = 0.08;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

  if (keys['w']) player.position.addScaledVector(forward, speed);
  if (keys['s']) player.position.addScaledVector(forward, -speed);
  if (keys['a']) player.position.addScaledVector(right, -speed);
  if (keys['d']) player.position.addScaledVector(right, speed);

  // Camera
  camera.position.set(
    player.position.x,
    player.position.y + 1.6,
    player.position.z
  );
  camera.rotation.set(pitch, yaw, 0);

  renderer.render(scene, camera);
}

animate();
