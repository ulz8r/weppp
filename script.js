// ===== Interface interactions =====
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');
menuBtn.addEventListener('click', () => {
  const open = navMenu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? '✕' : '☰';
});
navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navMenu.classList.remove('open');
  menuBtn.textContent = '☰';
  menuBtn.setAttribute('aria-expanded', 'false');
}));

const cursorGlow = document.getElementById('cursorGlow');
window.addEventListener('pointermove', (e) => {
  cursorGlow.style.left = `${e.clientX}px`;
  cursorGlow.style.top = `${e.clientY}px`;
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// 3D-like card tilt
if (matchMedia('(pointer:fine)').matches) {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(850px) rotateY(${x * 6}deg) rotateX(${y * -6}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });
}

// Skill inspector
const chips = document.querySelectorAll('.skill-chip');
const skillName = document.getElementById('skillName');
const skillInfo = document.getElementById('skillInfo');
chips.forEach(chip => chip.addEventListener('click', () => {
  chips.forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  skillName.textContent = chip.dataset.skill;
  skillInfo.textContent = chip.dataset.info;
}));

// ===== Three.js interactive hero =====
const canvas = document.getElementById('scene3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.1, 8.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const root = new THREE.Group();
scene.add(root);

// Main wireframe sculpture
const knotGeo = new THREE.TorusKnotGeometry(1.58, .48, 180, 24, 2, 3);
const knotMat = new THREE.MeshPhysicalMaterial({
  color: 0x54dfff,
  metalness: .5,
  roughness: .22,
  transmission: .18,
  transparent: true,
  opacity: .73,
  wireframe: true
});
const knot = new THREE.Mesh(knotGeo, knotMat);
knot.position.set(2.7, .15, 0);
knot.rotation.set(.35, -.4, .15);
root.add(knot);

const coreGeo = new THREE.IcosahedronGeometry(.82, 2);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x111d4f,
  emissive: 0x4258ff,
  emissiveIntensity: .55,
  metalness: .8,
  roughness: .2,
  wireframe: false
});
const core = new THREE.Mesh(coreGeo, coreMat);
core.position.copy(knot.position);
root.add(core);

// Orbital rings
for (let i = 0; i < 3; i++) {
  const ringGeo = new THREE.TorusGeometry(2.25 + i * .32, .008, 8, 130);
  const ringMat = new THREE.MeshBasicMaterial({ color: i === 1 ? 0xa066ff : 0x48d7ff, transparent:true, opacity:.35 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(knot.position);
  ring.rotation.set(1 + i * .45, .3 + i * .65, .2 + i * .3);
  root.add(ring);
}

// Floating skill nodes
const nodeData = [
  ['C++', [-.1, 2.65, -.5]], ['PY', [4.8, 2.3, -.7]], ['C#', [5.15, -1.7, .2]],
  ['WEB', [.55, -2.3, -.8]], ['DB', [3.1, 3.15, -1.8]], ['JS', [1.0, 1.2, 1.0]]
];
const nodeMeshes = [];
const nodeGeo = new THREE.OctahedronGeometry(.16, 0);
nodeData.forEach(([, pos], index) => {
  const m = new THREE.MeshBasicMaterial({ color: index % 2 ? 0xa066ff : 0x5ef0ba, wireframe:true });
  const node = new THREE.Mesh(nodeGeo, m);
  node.position.set(...pos);
  root.add(node);
  nodeMeshes.push(node);
});

// Star/particle field
const particleCount = innerWidth < 700 ? 550 : 1100;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i*3] = (Math.random() - .5) * 22;
  positions[i*3+1] = (Math.random() - .5) * 13;
  positions[i*3+2] = (Math.random() - .5) * 14;
}
const pointsGeo = new THREE.BufferGeometry();
pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const points = new THREE.Points(pointsGeo, new THREE.PointsMaterial({ color:0x7394c8, size:.018, transparent:true, opacity:.6 }));
scene.add(points);

// Lighting
scene.add(new THREE.AmbientLight(0x8ba9ff, .65));
const key = new THREE.PointLight(0x48d7ff, 18, 12);
key.position.set(4, 3, 5);
scene.add(key);
const fill = new THREE.PointLight(0xa066ff, 10, 10);
fill.position.set(-2, -2, 4);
scene.add(fill);

let pointerX = 0, pointerY = 0;
window.addEventListener('pointermove', e => {
  pointerX = (e.clientX / innerWidth - .5) * 2;
  pointerY = (e.clientY / innerHeight - .5) * 2;
});

let scrollRatio = 0;
window.addEventListener('scroll', () => {
  scrollRatio = Math.min(scrollY / innerHeight, 1.4);
});

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  knot.rotation.x = .35 + t * .09 + pointerY * .08;
  knot.rotation.y = -.4 + t * .13 + pointerX * .14;
  core.rotation.x = -t * .18;
  core.rotation.y = t * .22;

  root.children.forEach((obj, i) => {
    if (obj.geometry?.type === 'TorusGeometry') obj.rotation.z += .0008 * (i + 1);
  });
  nodeMeshes.forEach((node, i) => {
    node.rotation.x += .008;
    node.rotation.y += .011;
    node.position.y += Math.sin(t * 1.1 + i) * .0009;
  });
  points.rotation.y = t * .008;
  root.rotation.z = -scrollRatio * .12;
  root.position.y = scrollRatio * .35;

  camera.position.x += ((pointerX * .18) - camera.position.x) * .025;
  camera.position.y += ((-.1 - pointerY * .12) - camera.position.y) * .025;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Reposition 3D object for mobile so it remains visible above text.
  if (w < 900) {
    knot.position.set(0, 1.75, -1.2);
    core.position.copy(knot.position);
    root.children.forEach(obj => {
      if (obj.geometry?.type === 'TorusGeometry') obj.position.copy(knot.position);
    });
    root.scale.setScalar(.72);
  } else {
    knot.position.set(2.7, .15, 0);
    core.position.copy(knot.position);
    root.children.forEach(obj => {
      if (obj.geometry?.type === 'TorusGeometry') obj.position.copy(knot.position);
    });
    root.scale.setScalar(1);
  }
}
window.addEventListener('resize', resize);
resize();
