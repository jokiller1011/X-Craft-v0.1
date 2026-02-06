// ===== BASIC SETUP =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 3, 8);

// ===== MENU =====
const menu = document.getElementById("menu");
const startBtn = document.getElementById("start");
let gameStarted = false;

startBtn.onclick = () => {
  menu.style.display = "none";
  gameStarted = true;
  document.body.requestPointerLock();
};

// ===== LIGHTING =====
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
testCube.position.set(0, 1, -5);
scene.add(testCube);

// ===== TEXTURES =====
const texLoader = new THREE.TextureLoader();
const grassTop = texLoader.load("textures/grass_top.png");
const grassSide = texLoader.load("textures/grass_side.png");
const dirtTex = texLoader.load("textures/dirt.png");
const sandTex = texLoader.load("textures/sand.png");

[grassTop, grassSide, dirtTex, sandTex].forEach(t => {
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
});

// ===== BLOCK FACTORY =====
function createBlock(type, x, y, z) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  let mats;

  if (type === "grass") {
    mats = [
      new THREE.MeshStandardMaterial({ map: grassSide }),
      new THREE.MeshStandardMaterial({ map: grassSide }),
      new THREE.MeshStandardMaterial({ map: grassTop }),
      new THREE.MeshStandardMaterial({ map: dirtTex }),
      new THREE.MeshStandardMaterial({ map: grassSide }),
      new THREE.MeshStandardMaterial({ map: grassSide })
    ];
  } else if (type === "dirt") {
    mats = new THREE.MeshStandardMaterial({ map: dirtTex });
  } else if (type === "sand") {
    mats = new THREE.MeshStandardMaterial({ map: sandTex });
  }

  const block = new THREE.Mesh(geo, mats);
  block.position.set(x, y, z);
  scene.add(block);
}

// ===== WORLD GENERATION =====
for (let x = -10; x <= 10; x++) {
  for (let z = -10; z <= 10; z++) {
    createBlock("grass", x, 0, z);
  }
}

// ===== PLAYER =====
let player;
const loader = new THREE.GLTFLoader();

loader.load("models/player.glb", gltf => {
  player = gltf.scene;
  player.scale.set(0.5, 0.5, 0.5);
  player.position.set(0, 1, 0);
  scene.add(player);
});

// ===== CHEST =====
loader.load("models/Chest.glb", gltf => {
  const chest = gltf.scene;
  chest.position.set(3, 1, 3);
  chest.scale.set(0.8, 0.8, 0.8);
  scene.add(chest);
});

// ===== CONTROLS =====
const keys = {};
document.addEventListener("keydown", e => (keys[e.key.toLowerCase()] = true));
document.addEventListener("keyup", e => (keys[e.key.toLowerCase()] = false));

// ===== MOUSE LOOK (FIXED) =====
let yaw = 0;
let pitch = 0;

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== document.body) return;

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-1.5, Math.min(1.5, pitch));
});

// ===== PHYSICS =====
let velocityY = 0;
const gravity = -0.015;
const jumpPower = 0.35;
let onGround = false;

// ===== GAME LOOP =====
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) {
    renderer.render(scene, camera);
    return;
  }

  if (player) {
    // Gravity
    velocityY += gravity;
    player.position.y += velocityY;

    if (player.position.y <= 1) {
      player.position.y = 1;
      velocityY = 0;
      onGround = true;
    }

    // Jump
    if (keys[" "] && onGround) {
      velocityY = jumpPower;
      onGround = false;
    }

    // Movement
    const speed = 0.05;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

    if (keys["w"]) player.position.addScaledVector(forward, speed);
    if (keys["s"]) player.position.addScaledVector(forward, -speed);
    if (keys["a"]) player.position.addScaledVector(right, -speed);
    if (keys["d"]) player.position.addScaledVector(right, speed);

    // Camera follow
    camera.position.set(
      player.position.x,
      player.position.y + 1.6,
      player.position.z
    );
    camera.rotation.set(pitch, yaw, 0);

    player.rotation.y = yaw;
  }

  renderer.render(scene, camera);
}

animate();

// ===== RESIZE =====
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
