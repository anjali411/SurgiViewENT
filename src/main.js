import { conditions } from './conditions.js';

const canvas = document.getElementById('viewer');
const conditionSelect = document.getElementById('conditionSelect');
const quickPicks = document.getElementById('quickPicks');
const description = document.getElementById('description');

function populateConditions() {
  conditions.forEach((condition) => {
    const option = document.createElement('option');
    option.value = condition.id;
    option.textContent = condition.label;
    conditionSelect.appendChild(option);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = condition.label;
    button.dataset.conditionId = condition.id;
    button.addEventListener('click', () => applyCondition(condition.id));
    quickPicks.appendChild(button);
  });
}

function setActiveQuickPick(id) {
  quickPicks.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', button.dataset.conditionId === id);
  });
}

function applyCondition(id) {
  const condition = conditions.find((entry) => entry.id === id) || conditions[0];
  conditionSelect.value = condition.id;
  description.textContent = condition.explanation;
  setActiveQuickPick(condition.id);

  const url = new URL(window.location.href);
  url.searchParams.set('condition', condition.id);
  history.replaceState({}, '', url);

  window.dispatchEvent(new CustomEvent('condition-selected', { detail: condition }));
}

conditionSelect.addEventListener('change', (event) => {
  applyCondition(event.target.value);
});

function getInitialConditionId() {
  const urlId = new URL(window.location.href).searchParams.get('condition');
  return conditions.some((c) => c.id === urlId) ? urlId : conditions[0].id;
}

async function setupThreeScene() {
  const THREE = await import('https://unpkg.com/three@0.161.0/build/three.module.js');
  const { OrbitControls } = await import(
    'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js'
  );

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#edf3fb');

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0.2, 1.4, 5.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0.8, 0);

  scene.add(new THREE.AmbientLight('#ffffff', 0.9));
  const keyLight = new THREE.DirectionalLight('#ffffff', 1.1);
  keyLight.position.set(4, 5, 5);
  scene.add(keyLight);

  const structureMaterials = {
    default: new THREE.MeshStandardMaterial({ color: '#7ec8ff', roughness: 0.35, metalness: 0.05 }),
    highlight: new THREE.MeshStandardMaterial({ color: '#ff6b6b', roughness: 0.3, metalness: 0.05 }),
  };

  const structures = {};
  const group = new THREE.Group();

  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 32, 24),
    new THREE.MeshStandardMaterial({ color: '#d8e2f0', transparent: true, opacity: 0.45 })
  );
  skull.scale.set(1, 1.1, 0.9);
  skull.position.y = 1;
  group.add(skull);

  const tympanicMembrane = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), structureMaterials.default);
  tympanicMembrane.position.set(-1.1, 1, 0.25);
  tympanicMembrane.rotation.y = Math.PI / 2.8;
  group.add(tympanicMembrane);

  const nasalSeptum = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.25), structureMaterials.default);
  nasalSeptum.position.set(0, 1.1, 1.15);
  group.add(nasalSeptum);

  const vocalCord = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.65, 4, 12), structureMaterials.default);
  vocalCord.position.set(0, 0.05, 0.9);
  vocalCord.rotation.z = Math.PI / 2;
  group.add(vocalCord);

  structures.tympanicMembrane = tympanicMembrane;
  structures.nasalSeptum = nasalSeptum;
  structures.vocalCord = vocalCord;
  scene.add(group);

  window.addEventListener('condition-selected', (event) => {
    Object.values(structures).forEach((mesh) => {
      mesh.material = structureMaterials.default;
    });

    event.detail.structures.forEach((name) => {
      if (structures[name]) {
        structures[name].material = structureMaterials.highlight;
      }
    });
  });

  function resizeRendererToDisplaySize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needsResize = canvas.width !== width || canvas.height !== height;

    if (needsResize) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  (function animate() {
    resizeRendererToDisplaySize();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();
}

function showFallback(error) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = '#edf3fb';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#234';
  ctx.font = '20px sans-serif';
  ctx.fillText('3D preview unavailable in this environment.', 24, 50);
  ctx.font = '14px sans-serif';
  ctx.fillText('Condition presets and explanations remain functional.', 24, 80);
  console.warn('Three.js setup failed:', error);
}

populateConditions();
applyCondition(getInitialConditionId());
setupThreeScene().catch(showFallback);
