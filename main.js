// ===== SCENE SETUP =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// ===== MENU =====
const menu = document.getElementById('menu');
const startBtn = document.getElementById('start');
const canvas = document.getElementById('game');

let gameStarted = false;

startBtn.addEventListener('click', () => {
  menu.style.display = 'none';
  gameStarted = true;
  document.body.requestPointerLock();
});

// ===== CAMERA =====
const camera = new THREE.PerspectiveCamera(
  75,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 5);

// ===== RENDERER =====
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setPixelRatio(window.devicePixelRatio);

// ===== LIGHTING =====
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ===== GROUND =====
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x3a7d44 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ===== PLAYER =====
let player;

const loader = new THREE.GLTFLoader();
loader.load('models/player.glb', (gltf) => {
  player = gltf.scene;
  player.scale.set(0.5, 0.5, 0.5);
  player.position.set(0, 0, 0);
  scene.add(player);
});

// ===== PHYSICS =====
let velocityY = 0;
const gravity = -0.015;
const jumpStrength = 0.35;
let isOnGround = false;

// ===== CONTROLS =====
const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  // Jump
  if (e.key === ' ' && isOnGround && player) {
    velocityY = jumpStrength;
    isOnGround = false;
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Mouse look
let yaw = 0;
let pitch = 0;

document.addEventListener('mousemove', (e) => {
  if (!gameStarted) return;

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});

// ===== GAME LOOP =====
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted || !player) {
    renderer.render(scene, camera);
    return;
  }

  // ---- GRAVITY ----
  velocityY += gravity;
  player.position.y += velocityY;

  if (player.position.y <= 0) {
    player.position.y = 0;
    velocityY = 0;
    isOnGround = true;
  }

  // ---- MOVEMENT ----
  const speed = 0.05;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

  if (keys['w']) player.position.addScaledVector(forward, speed);
  if (keys['s']) player.position.addScaledVector(forward, -speed);
  if (keys['a']) player.position.addScaledVector(right, -speed);
  if (keys['d']) player.position.addScaledVector(right, speed);

  player.rotation.y = yaw;

  // ---- CAMERA ----
  camera.position.set(
    player.position.x,
    player.position.y + 1.6,
    player.position.z
  );
  camera.rotation.set(pitch, yaw, 0);

  renderer.render(scene, camera);
}

animate();

// ===== RESIZE =====
window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});
