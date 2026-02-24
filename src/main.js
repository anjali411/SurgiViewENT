import { conditions } from './conditions.js';

const canvas = document.getElementById('viewer');
const conditionSelect = document.getElementById('conditionSelect');
const quickPicks = document.getElementById('quickPicks');
const description = document.getElementById('description');
const viewControls = document.getElementById('viewControls');
const renderMode = document.getElementById('renderMode');
const ctx = canvas.getContext('2d');

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

function createRenderer() {
  const state = {
    yaw: -0.58,
    pitch: -0.18,
    distance: 10.5,
    target: { x: 0, y: 1.2, z: 0 },
    activeCondition: 'normal',
    activeStructures: [],
  };

  const presets = {
    overview: { yaw: -0.58, pitch: -0.18, distance: 10.5, target: { x: 0, y: 1.2, z: 0 } },
    ear: { yaw: -1.05, pitch: -0.06, distance: 7.2, target: { x: -2.3, y: 1.4, z: 0.8 } },
    nose: { yaw: -0.02, pitch: -0.03, distance: 6.2, target: { x: 0, y: 1.35, z: 1.5 } },
    larynx: { yaw: -0.02, pitch: 0.12, distance: 6.3, target: { x: 0, y: 0.25, z: 1.1 } },
  };

  function setPreset(name) {
    const preset = presets[name] || presets.overview;
    state.yaw = preset.yaw;
    state.pitch = preset.pitch;
    state.distance = preset.distance;
    state.target = { ...preset.target };

    if (viewControls) {
      viewControls.querySelectorAll('button').forEach((button) => {
        button.classList.toggle('active', button.dataset.view === name);
      });
    }
  }

  if (viewControls) {
    viewControls.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => setPreset(button.dataset.view));
    });
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function viewProject(point) {
    const px = point.x - state.target.x;
    const py = point.y - state.target.y;
    const pz = point.z - state.target.z;

    const cy = Math.cos(state.yaw);
    const sy = Math.sin(state.yaw);
    const x1 = cy * px - sy * pz;
    const z1 = sy * px + cy * pz;

    const cp = Math.cos(state.pitch);
    const sp = Math.sin(state.pitch);
    const y2 = cp * py - sp * z1;
    const z2 = sp * py + cp * z1;

    const depth = z2 + state.distance;
    const focal = Math.min(canvas.width, canvas.height) * 0.95;
    const scale = focal / Math.max(depth, 0.2);

    return {
      x: canvas.width * 0.5 + x1 * scale,
      y: canvas.height * 0.5 - y2 * scale,
      depth,
      scale,
    };
  }

  function drawBall(part) {
    const p = viewProject(part.center);
    if (p.depth <= 0) return null;
    const rx = part.radiusX * p.scale;
    const ry = part.radiusY * p.scale;
    const g = ctx.createRadialGradient(p.x - rx * 0.35, p.y - ry * 0.35, 2, p.x, p.y, rx * 1.05);
    g.addColorStop(0, part.colorLight);
    g.addColorStop(1, part.colorDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, part.tilt || 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#16324d55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, part.tilt || 0, 0, Math.PI * 2);
    ctx.stroke();
    return p;
  }

  function anatomyParts() {
    const highlight = new Set(state.activeStructures);
    const septumShift = state.activeCondition === 'deviated-septum' ? 0.18 : 0;

    return [
      { id: 'head', center: { x: 0, y: 1.45, z: 0 }, radiusX: 2.8, radiusY: 3.2, colorLight: '#f7fbff88', colorDark: '#c9d8ea55' },
      { id: 'earCanal', center: { x: -2.3, y: 1.35, z: 0.7 }, radiusX: 0.52, radiusY: 0.3, colorLight: '#a7ddff', colorDark: '#6cb9ee' },
      {
        id: 'tympanicMembrane',
        center: { x: -1.88, y: 1.35, z: 0.7 },
        radiusX: 0.26,
        radiusY: 0.26,
        colorLight: highlight.has('tympanicMembrane') ? '#ff9da7' : '#95d6ff',
        colorDark: highlight.has('tympanicMembrane') ? '#ff5c6f' : '#58ace9',
      },
      { id: 'noseShell', center: { x: 0, y: 1.35, z: 1.45 }, radiusX: 0.95, radiusY: 1.2, colorLight: '#a9ddff', colorDark: '#66b6eb' },
      {
        id: 'nasalSeptum',
        center: { x: septumShift, y: 1.35, z: 1.46 },
        radiusX: 0.14,
        radiusY: 1,
        colorLight: highlight.has('nasalSeptum') ? '#ffa9b1' : '#9ad8ff',
        colorDark: highlight.has('nasalSeptum') ? '#ff6073' : '#5db1eb',
      },
      { id: 'larynxRing', center: { x: 0, y: 0.22, z: 1.05 }, radiusX: 0.92, radiusY: 0.68, colorLight: '#99d5ff', colorDark: '#5aa9df' },
      {
        id: 'vocalCordL',
        center: { x: -0.24, y: 0.22, z: 1.1 },
        radiusX: 0.3,
        radiusY: 0.11,
        colorLight: highlight.has('vocalCord') ? '#ff9fa8' : '#9ad9ff',
        colorDark: highlight.has('vocalCord') ? '#ff5f72' : '#58afe9',
      },
      {
        id: 'vocalCordR',
        center: { x: 0.24, y: 0.22, z: 1.1 },
        radiusX: 0.3,
        radiusY: 0.11,
        colorLight: highlight.has('vocalCord') ? '#ff9fa8' : '#9ad9ff',
        colorDark: highlight.has('vocalCord') ? '#ff5f72' : '#58afe9',
      },
    ];
  }

  function drawPathologyMarkers(projectedById) {
    if (state.activeCondition === 'tympanic-membrane-perforation' && projectedById.tympanicMembrane) {
      const p = projectedById.tympanicMembrane;
      ctx.strokeStyle = '#ff2f49';
      ctx.lineWidth = Math.max(2, p.scale * 0.035);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.scale * 0.07, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.activeCondition === 'vocal-cord-polyp' && projectedById.vocalCordR) {
      const p = projectedById.vocalCordR;
      ctx.fillStyle = '#ff2f49';
      ctx.beginPath();
      ctx.arc(p.x + p.scale * 0.08, p.y - p.scale * 0.05, p.scale * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGuides(projectedById) {
    ctx.fillStyle = '#15344f';
    ctx.font = '600 13px sans-serif';

    const labels = [
      ['Ear', projectedById.tympanicMembrane],
      ['Nasal cavity', projectedById.noseShell],
      ['Larynx', projectedById.larynxRing],
    ];

    labels.forEach(([label, p]) => {
      if (!p) return;
      const lx = p.x + 16;
      const ly = p.y - 14;
      ctx.strokeStyle = '#15344f66';
      ctx.beginPath();
      ctx.moveTo(p.x + 5, p.y - 5);
      ctx.lineTo(lx - 4, ly + 4);
      ctx.stroke();
      ctx.fillText(label, lx, ly);
    });
  }

  function render() {
    resize();
    ctx.fillStyle = '#edf3fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const projected = {};
    const drawQueue = anatomyParts().map((part) => {
      const p = viewProject(part.center);
      return { part, depth: p.depth };
    }).sort((a, b) => b.depth - a.depth);

    drawQueue.forEach(({ part }) => {
      projected[part.id] = drawBall(part);
    });

    drawPathologyMarkers(projected);
    drawGuides(projected);

    requestAnimationFrame(render);
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    state.yaw += dx * 0.008;
    state.pitch = Math.max(-1.1, Math.min(1.1, state.pitch + dy * 0.006));
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.distance = Math.max(4.5, Math.min(15, state.distance + e.deltaY * 0.01));
  }, { passive: false });

  window.addEventListener('condition-selected', (event) => {
    state.activeCondition = event.detail.id;
    state.activeStructures = event.detail.structures || [];

    if (event.detail.id === 'tympanic-membrane-perforation') setPreset('ear');
    else if (event.detail.id === 'deviated-septum') setPreset('nose');
    else if (event.detail.id === 'vocal-cord-polyp') setPreset('larynx');
    else setPreset('overview');
  });

  setPreset('overview');
  render();
}

populateConditions();
applyCondition(getInitialConditionId());

if (ctx) {
  if (renderMode) {
    renderMode.textContent = 'Interactive local 3D mode (no CDN dependency)';
    renderMode.classList.remove('fallback');
  }
  createRenderer();
} else if (renderMode) {
  renderMode.textContent = 'Canvas unavailable';
  renderMode.classList.add('fallback');
}
