// Procedural Three.js CRT Workstation (Concept 3 — Hybrid Enuhri Machine, Iteration 2)
// Loads pinned self-hosted Three.js dynamically so CSS/HTML fallback remains immune to WebGL failure.

import { createFloppyDiskCanvas } from './pixel-env.js';

const STATE_LIGHT_HEX = {
  standby: 0x6b7c3e,
  menu: 0x39ff14,
  live: 0x00e5ff,
  paused: 0xffbf00,
};

// Centralized fixed camera states (Desktop + Mobile Portrait + Mobile Short Landscape; zero cursor parallax)
export const CAMERA_POSES = {
  desktop: {
    standby: { pos: [0, 1.08, 3.45], target: [0, 0.68, 0.08], fov: 35, durationMs: 850 },
    boot: { pos: [0, 1.24, 2.84], target: [0, 0.80, 0.12], fov: 35, durationMs: 750 },
    menu: { pos: [0, 1.02, 2.60], target: [0, 0.90, 0.14], fov: 35, durationMs: 650 },
    embed: { pos: [0, 0.88, 2.13], target: [0, 0.77, 0.14], fov: 35, durationMs: 600 },
  },
  mobilePortrait: {
    standby: { pos: [0, 1.28, 5.75], target: [0, 0.72, 0.08], fov: 42, durationMs: 700 },
    boot: { pos: [0, 1.32, 5.30], target: [0, 0.82, 0.12], fov: 42, durationMs: 650 },
    menu: { pos: [0, 1.06, 5.40], target: [0, 0.86, 0.14], fov: 42, durationMs: 600 },
    embed: { pos: [0, 0.90, 4.35], target: [0, 0.77, 0.14], fov: 42, durationMs: 550 },
  },
  mobileLandscape: {
    standby: { pos: [0, 1.05, 4.05], target: [0, 0.70, 0.08], fov: 42, durationMs: 700 },
    boot: { pos: [0, 1.18, 3.45], target: [0, 0.82, 0.12], fov: 42, durationMs: 650 },
    menu: { pos: [0, 0.98, 3.15], target: [0, 0.86, 0.14], fov: 42, durationMs: 600 },
    embed: { pos: [0, 0.86, 2.52], target: [0, 0.76, 0.14], fov: 42, durationMs: 550 },
  },
};

function getPoseProfile(vw, vh, coarse) {
  if (vw < vh) {
    return CAMERA_POSES.mobilePortrait;
  }
  if (vw <= 639 || vh <= 560 || coarse) {
    return CAMERA_POSES.mobileLandscape;
  }
  return CAMERA_POSES.desktop;
}

function mergeBoxGeometries(THREE, specs) {
  const parts = specs.map((s) => {
    const g = new THREE.BoxGeometry(s.w, s.h, s.d);
    g.translate(s.x, s.y, s.z);
    return g;
  });

  let totalVerts = 0;
  let totalIdx = 0;
  for (const g of parts) {
    totalVerts += g.attributes.position.count;
    totalIdx += g.index.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint16Array(totalIdx);

  let vOffset = 0;
  let iOffset = 0;
  for (const g of parts) {
    const count = g.attributes.position.count;
    positions.set(g.attributes.position.array, vOffset * 3);
    normals.set(g.attributes.normal.array, vOffset * 3);
    uvs.set(g.attributes.uv.array, vOffset * 2);
    const idxArr = g.index.array;
    for (let i = 0; i < idxArr.length; i++) {
      indices[iOffset + i] = idxArr[i] + vOffset;
    }
    vOffset += count;
    iOffset += idxArr.length;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

function createQuantizedGradientTexture(THREE) {
  const bands = new Uint8Array([68, 114, 160, 206, 255]);
  const data = new Uint8Array(bands.length * 4);
  for (let i = 0; i < bands.length; i++) {
    const v = bands[i];
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, bands.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export async function createCrtScene({
  canvas,
  overlayContainer,
  pixelEnv,
  initialQuality,
  initialPixelMode = 'smooth',
  reducedMotion,
  coarsePointer = false,
  getViewportSize,
  onFatalFallback,
}) {
  const THREE = await import('./vendor/three.module.min.js');
  const readVp = () => (getViewportSize ? getViewportSize() : {
    w: Math.max(1, window.innerWidth),
    h: Math.max(1, window.innerHeight),
  });
  const initVp = readVp();
  let isCoarse = Boolean(coarsePointer);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
  } catch (err) {
    throw new Error('WebGLRenderer init failed: ' + (err?.message || String(err)));
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10);
  scene.fog = new THREE.Fog(0x0a0c10, 4.4, 9.2);

  const standbyPose = getPoseProfile(initVp.w, initVp.h, isCoarse).standby;
  const camera = new THREE.PerspectiveCamera(
    standbyPose.fov,
    Math.max(1, initVp.w) / Math.max(1, initVp.h),
    0.1,
    25
  );

  const curCamPos = new THREE.Vector3(...standbyPose.pos);
  const curLookAt = new THREE.Vector3(...standbyPose.target);
  let curFov = standbyPose.fov;
  let goalCamPos = curCamPos.clone();
  let goalLookAt = curLookAt.clone();
  let goalFov = standbyPose.fov;
  let cameraTweening = false;
  let cameraTweenStart = 0;
  let cameraTweenDuration = standbyPose.durationMs;
  let cameraFromPos = curCamPos.clone();
  let cameraFromTarget = curLookAt.clone();
  let cameraFromFov = standbyPose.fov;
  let currentPoseName = 'standby';

  // ---- Lighting (<= 1 shadow-casting light) ----
  const hemiLight = new THREE.HemisphereLight(0x283444, 0x0b0a09, 0.74);
  scene.add(hemiLight);

  const keyLight = new THREE.SpotLight(0xfff4e0, 4.2, 10, Math.PI * 0.28, 0.6, 1.4);
  keyLight.position.set(1.35, 3.1, 2.15);
  keyLight.target.position.set(0, 0.65, 0.1);
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.025;
  scene.add(keyLight);
  scene.add(keyLight.target);

  const screenBounceLight = new THREE.PointLight(STATE_LIGHT_HEX.standby, 0.22, 1.9, 1.8);
  screenBounceLight.position.set(0, 0.56, 0.56);
  scene.add(screenBounceLight);

  let targetLightColor = new THREE.Color(STATE_LIGHT_HEX.standby);
  let targetLightIntensity = 0.22;
  let targetGlassHex = 0x09160c;
  let targetGlassEmissive = 0.2;

  // ---- Material pairs (Smooth Retro default vs Quantized+Faceted comparison) ----
  const toonGrad = createQuantizedGradientTexture(THREE);

  const deskStdMat = new THREE.MeshStandardMaterial({ color: 0x171a20, roughness: 0.68, metalness: 0.08 });
  const deskToonMat = new THREE.MeshToonMaterial({ color: 0x1f242c, gradientMap: toonGrad, flatShading: true });

  const beigeStdMat = new THREE.MeshStandardMaterial({ color: 0xc8bfb0, roughness: 0.72, metalness: 0.04 });
  const beigeToonMat = new THREE.MeshToonMaterial({ color: 0xc8bfb0, gradientMap: toonGrad, flatShading: true });

  const bezelStdMat = new THREE.MeshStandardMaterial({ color: 0x26282b, roughness: 0.8, metalness: 0.08 });
  const bezelToonMat = new THREE.MeshToonMaterial({ color: 0x2c2f34, gradientMap: toonGrad, flatShading: true });

  const slotStdMat = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.88 });
  const slotToonMat = new THREE.MeshToonMaterial({ color: 0x181a1d, gradientMap: toonGrad, flatShading: true });

  const keyStdMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.04 });
  const keyToonMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad, flatShading: true });

  const floppyTex = new THREE.CanvasTexture(createFloppyDiskCanvas());
  floppyTex.colorSpace = THREE.SRGBColorSpace;
  floppyTex.magFilter = THREE.NearestFilter;
  floppyTex.minFilter = THREE.NearestFilter;
  floppyTex.generateMipmaps = false;

  const floppyStdMat = new THREE.MeshStandardMaterial({ map: floppyTex, roughness: 0.55, metalness: 0.12 });
  const floppyToonMat = new THREE.MeshToonMaterial({ map: floppyTex, gradientMap: toonGrad, flatShading: true });

  // Glass stays smooth across all visual modes
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x051015,
    emissive: new THREE.Color(0x09160c),
    emissiveIntensity: 0.2,
    roughness: 0.18,
    metalness: 0.14,
  });

  // ---- Layer 1 Geometry ----
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const workstationGroup = new THREE.Group();
  rootGroup.add(workstationGroup);

  const deskMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.6), deskStdMat);
  deskMesh.rotation.x = -Math.PI / 2;
  deskMesh.receiveShadow = true;
  rootGroup.add(deskMesh);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.92, metalness: 0.0 });
  const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(11, 6.2), wallMat);
  wallMesh.position.set(0, 2.1, -1.7);
  rootGroup.add(wallMesh);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0x16242c });
  const horizonMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.006), lineMat);
  horizonMesh.position.set(0, 0.28, -1.66);
  rootGroup.add(horizonMesh);

  // ---- Layer 2: 320x180 Pixel Environment Backdrop Plane (1 draw call) ----
  const pixelTexture = new THREE.CanvasTexture(pixelEnv.canvas);
  pixelTexture.colorSpace = THREE.SRGBColorSpace;
  pixelTexture.magFilter = THREE.NearestFilter;
  pixelTexture.minFilter = THREE.NearestFilter;
  pixelTexture.generateMipmaps = false;

  const pixelPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.48, 2.52),
    new THREE.MeshBasicMaterial({ map: pixelTexture })
  );
  pixelPlane.position.set(0, 1.32, -1.56);
  rootGroup.add(pixelPlane);

  // ---- Monitor & Stand ----
  const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.06, 0.76), beigeStdMat);
  footMesh.position.set(0, 0.03, -0.08);
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  workstationGroup.add(footMesh);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.14, 16), bezelStdMat);
  neckMesh.position.set(0, 0.11, -0.08);
  workstationGroup.add(neckMesh);

  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 0.84, -0.05);
  workstationGroup.add(monitorGroup);

  function makeRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  const outerShape = makeRoundedRectShape(1.68, 1.32, 0.07);
  const outerShellGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 2,
    curveSegments: 4,
  });
  outerShellGeo.translate(0, 0, -0.1);
  const outerShellMesh = new THREE.Mesh(outerShellGeo, beigeStdMat);
  outerShellMesh.castShadow = true;
  outerShellMesh.receiveShadow = true;
  monitorGroup.add(outerShellMesh);

  const rearGeo = new THREE.CylinderGeometry(0.62, 0.42, 0.62, 4, 1);
  rearGeo.rotateY(Math.PI / 4);
  rearGeo.rotateX(Math.PI / 2);
  rearGeo.scale(1.26, 0.98, 1.0);
  const rearMesh = new THREE.Mesh(rearGeo, beigeStdMat);
  rearMesh.position.set(0, 0.02, -0.42);
  rearMesh.castShadow = true;
  monitorGroup.add(rearMesh);

  const bezelShape = makeRoundedRectShape(1.48, 1.12, 0.045);
  bezelShape.holes.push(makeRoundedRectShape(1.30, 0.96, 0.03));
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 3,
  });
  bezelGeo.translate(0, 0.02, 0.148);
  const bezelMesh = new THREE.Mesh(bezelGeo, bezelStdMat);
  bezelMesh.receiveShadow = true;
  monitorGroup.add(bezelMesh);

  // Curved CRT glass mesh inside aperture
  const glassW = 1.32;
  const glassH = 0.98;
  const glassGeo = new THREE.PlaneGeometry(glassW, glassH, 18, 14);
  const posAttr = glassGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const gx = posAttr.getX(i) / (glassW / 2);
    const gy = posAttr.getY(i) / (glassH / 2);
    posAttr.setZ(i, 0.024 * Math.max(0, 1 - gx * gx) * Math.max(0, 1 - gy * gy));
  }
  glassGeo.computeVertexNormals();
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(0, 0.02, 0.155);
  monitorGroup.add(glassMesh);

  // Top ventilation slots (10 instanced slats = 1 draw call)
  const ventInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.02, 0.36), slotStdMat, 10);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 10; i++) {
    dummy.position.set(-0.42 + i * 0.092, 0.655, -0.08);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    ventInst.setMatrixAt(i, dummy.matrix);
  }
  ventInst.instanceMatrix.needsUpdate = true;
  monitorGroup.add(ventInst);

  // Physical Lower-Right Power Button & Status LED
  const pwrBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.048, 0.038), bezelStdMat);
  pwrBtnMesh.position.set(0.64, -0.582, 0.195);
  monitorGroup.add(pwrBtnMesh);

  const ledMat = new THREE.MeshBasicMaterial({ color: 0x6b7c3e });
  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), ledMat);
  ledMesh.position.set(0.55, -0.582, 0.205);
  monitorGroup.add(ledMesh);

  // ---- Physical Floppy-Disk Bay & Sliding Diskette Holder (3 draw calls, 72 tris) ----
  // Centered horizontally on monitor shell & front bezel (x = 0), well clear of lower-right LED/power
  const floppyBayGroup = new THREE.Group();
  floppyBayGroup.position.set(0, -0.578, 0.188);
  monitorGroup.add(floppyBayGroup);

  // Draw Call 1: Merged recessed slot housing (top lip, bottom lip w/ thumb recess, left/right cheeks)
  const driveHousingGeo = mergeBoxGeometries(THREE, [
    { x: 0, y: 0.027, z: 0, w: 0.42, h: 0.014, d: 0.034 },   // top frame bar
    { x: 0, y: -0.027, z: 0, w: 0.42, h: 0.014, d: 0.034 },  // bottom frame bar
    { x: -0.198, y: 0, z: 0, w: 0.024, h: 0.040, d: 0.034 }, // left stile
    { x: 0.198, y: 0, z: 0, w: 0.024, h: 0.040, d: 0.034 },  // right stile
  ]);
  const driveHousingMesh = new THREE.Mesh(driveHousingGeo, slotStdMat);
  floppyBayGroup.add(driveHousingMesh);

  // Draw Call 2: Sliding 3.5" diskette carrier with crisp 64x32 pixel label
  const floppyDiskMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.016, 0.22), floppyStdMat);
  floppyDiskMesh.position.set(0, 0.0, -0.075);
  floppyBayGroup.add(floppyDiskMesh);

  // Draw Call 3: Subtle bay activity LED immediately beside slot
  const driveLedMat = new THREE.MeshBasicMaterial({ color: 0x16383e });
  const driveLedMesh = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.014), driveLedMat);
  driveLedMesh.position.set(0.245, -0.002, 0.012);
  floppyBayGroup.add(driveLedMesh);

  // Projected Hardware Bounds Markers (Screen Aperture, Physical Power, Floppy Bay)
  const apW = 1.25;
  const apH = 0.91;
  const apCenterY = 0.02;
  const apZ = 0.168;
  const cornerTL = new THREE.Object3D();
  const cornerBR = new THREE.Object3D();
  cornerTL.position.set(-apW / 2, apCenterY + apH / 2, apZ);
  cornerBR.position.set(apW / 2, apCenterY - apH / 2, apZ);
  monitorGroup.add(cornerTL);
  monitorGroup.add(cornerBR);

  const powerTL = new THREE.Object3D();
  const powerBR = new THREE.Object3D();
  powerTL.position.set(0.60, -0.556, 0.214);
  powerBR.position.set(0.68, -0.608, 0.214);
  monitorGroup.add(powerTL);
  monitorGroup.add(powerBR);

  const diskTL = new THREE.Object3D();
  const diskBR = new THREE.Object3D();
  diskTL.position.set(-0.22, 0.04, 0.02);
  diskBR.position.set(0.22, -0.04, 0.02);
  floppyBayGroup.add(diskTL);
  floppyBayGroup.add(diskBR);

  // ---- Two-Tone Retro Keyboard (48 instanced keycaps = 1 draw call) ----
  const keyboardGroup = new THREE.Group();
  keyboardGroup.position.set(0, 0.035, 0.74);
  keyboardGroup.rotation.x = 0.085;
  workstationGroup.add(keyboardGroup);

  const kbBaseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.055, 0.52), beigeStdMat);
  kbBaseMesh.castShadow = true;
  kbBaseMesh.receiveShadow = true;
  keyboardGroup.add(kbBaseMesh);

  const keysInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.088, 0.028, 0.086), keyStdMat, 48);
  keysInst.castShadow = true;
  keysInst.receiveShadow = true;

  const alphaCol = new THREE.Color(0xcfc7b6);
  const modCol = new THREE.Color(0x7c7466);
  let kIdx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      dummy.position.set(-0.59 + col * 0.107, 0.04, -0.155 + row * 0.104);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      keysInst.setMatrixAt(kIdx, dummy.matrix);
      const isMod = col === 0 || col === 11 || (row === 3 && (col === 1 || col === 10));
      keysInst.setColorAt(kIdx, isMod ? modCol : alphaCol);
      kIdx++;
    }
  }
  keysInst.instanceMatrix.needsUpdate = true;
  if (keysInst.instanceColor) keysInst.instanceColor.needsUpdate = true;
  keyboardGroup.add(keysInst);

  // ---- 50 Dust Particles (HIGH tier only) ----
  const dustCount = 50;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = [];
  for (let i = 0; i < dustCount; i++) {
    const px = ((i * 73) % 240) / 100 - 1.2;
    const py = 0.25 + ((i * 31) % 160) / 100;
    const pz = ((i * 53) % 180) / 100 - 0.8;
    dustPos[i * 3] = px;
    dustPos[i * 3 + 1] = py;
    dustPos[i * 3 + 2] = pz;
    dustSeed.push({ bx: px, by: py, speed: 0.35 + (i % 5) * 0.12, phase: i * 0.7 });
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

  const dustCanvas = document.createElement('canvas');
  dustCanvas.width = 16;
  dustCanvas.height = 16;
  const dCtx = dustCanvas.getContext('2d');
  const grad = dCtx.createRadialGradient(8, 8, 1, 8, 8, 8);
  grad.addColorStop(0, 'rgba(232, 228, 216, 0.85)');
  grad.addColorStop(1, 'rgba(232, 228, 216, 0)');
  dCtx.fillStyle = grad;
  dCtx.fillRect(0, 0, 16, 16);

  const dustPoints = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      size: 0.022,
      map: new THREE.CanvasTexture(dustCanvas),
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    })
  );
  rootGroup.add(dustPoints);

  // ---- Runtime State ----
  let quality = initialQuality;
  let pixelMode = initialPixelMode; // 'smooth' | 'quantized' | 'lowres75' | 'lowres50'
  let isReduced = Boolean(reducedMotion);
  let isHidden = Boolean(document.hidden);
  let contextLost = false;
  let rafId = null;
  let lastFrameMs = performance.now();
  let lastActiveMs = performance.now();
  let idleThrottleAccum = 0;

  let curFloppyProgress = 0;
  let targetFloppyProgress = 0;
  let floppyLedState = 'idle'; // 'idle' | 'intent' | 'open'

  const metrics = {
    fps: 0,
    avgFrameMs: 0,
    maxFrameMs: 0,
    drawCalls: 0,
    triangles: 0,
    dpr: 1,
    renderScale: 1,
    pixelMode,
    cameraPose: currentPoseName,
    pixelTickMs: 0,
    pixelUploadsPerSec: 0,
    loopState: 'running',
  };
  let fpsCount = 0;
  let fpsWindowStart = performance.now();
  let frameTimeSamples = [];
  let slowFrameSamples = [];
  let uploadTimestamps = [];
  let isActive = true;
  let embedMode = false;
  let onAutoDowngrade = null;
  let onMetrics = null;
  let onProjection = null;

  function applyPixelMode(nextMode) {
    pixelMode = nextMode || 'smooth';
    metrics.pixelMode = pixelMode;
    const isQuantized = pixelMode === 'quantized';
    canvas.classList.toggle('canvas-pixelated', pixelMode === 'lowres75' || pixelMode === 'lowres50');

    deskMesh.material = isQuantized ? deskToonMat : deskStdMat;
    footMesh.material = isQuantized ? beigeToonMat : beigeStdMat;
    outerShellMesh.material = isQuantized ? beigeToonMat : beigeStdMat;
    rearMesh.material = isQuantized ? beigeToonMat : beigeStdMat;
    kbBaseMesh.material = isQuantized ? beigeToonMat : beigeStdMat;
    neckMesh.material = isQuantized ? bezelToonMat : bezelStdMat;
    bezelMesh.material = isQuantized ? bezelToonMat : bezelStdMat;
    pwrBtnMesh.material = isQuantized ? bezelToonMat : bezelStdMat;
    ventInst.material = isQuantized ? slotToonMat : slotStdMat;
    driveHousingMesh.material = isQuantized ? slotToonMat : slotStdMat;
    keysInst.material = isQuantized ? keyToonMat : keyStdMat;
    floppyDiskMesh.material = isQuantized ? floppyToonMat : floppyStdMat;

    renderer.shadowMap.type = isQuantized ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = true;

    applyQualitySettings(quality);
    if (quality !== 'low') renderSingleFrame();
  }

  let lastViewportW = initVp.w;
  let lastViewportH = initVp.h;

  function applyQualitySettings(nextQuality, explicitW = null, explicitH = null) {
    quality = nextQuality;
    const vp = readVp();
    const width = Math.max(1, explicitW || vp.w);
    const height = Math.max(1, explicitH || vp.h);
    lastViewportW = width;
    lastViewportH = height;

    let scale = 1;
    if (pixelMode === 'lowres75') scale = 0.75;
    else if (pixelMode === 'lowres50') scale = 0.5;
    metrics.renderScale = scale;

    const dprCap = scale < 1 ? 1 : quality === 'mobile' ? 1 : quality === 'high' ? 1.5 : 1.25;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    metrics.dpr = +dpr.toFixed(2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)), false);

    camera.aspect = width / height;
    if (!cameraTweening) {
      const poseSet = getPoseProfile(width, height, isCoarse);
      const curPose = poseSet[currentPoseName] || poseSet.menu;
      curCamPos.set(...curPose.pos);
      curLookAt.set(...curPose.target);
      curFov = curPose.fov;
      goalCamPos.copy(curCamPos);
      goalLookAt.copy(curLookAt);
      goalFov = curFov;
      camera.fov = curFov;
    }
    camera.updateProjectionMatrix();

    const useShadow = quality === 'high';
    renderer.shadowMap.enabled = useShadow;
    keyLight.castShadow = useShadow;
    dustPoints.visible = quality === 'high' && !isReduced && !embedMode;

    if (quality === 'low' || isReduced) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pixelEnv.renderStatic();
      pixelTexture.needsUpdate = true;
      metrics.fps = 0;
      metrics.loopState = quality === 'low' ? 'paused (0 FPS)' : 'static-3d (0 FPS)';
      if (quality !== 'low') renderSingleFrame();
      else if (onMetrics) onMetrics(metrics);
      return;
    }

    if (quality !== 'high') {
      pixelEnv.renderStatic();
      pixelTexture.needsUpdate = true;
    }

    lastActiveMs = performance.now();
    requestFrameOrLoop();
  }

  function projectBox(tlObj, brObj, minW = 0, minH = 0, pad = 0) {
    const vw = Math.max(1, (canvas && canvas.clientWidth > 10 ? canvas.clientWidth : lastViewportW));
    const vh = Math.max(1, (canvas && canvas.clientHeight > 10 ? canvas.clientHeight : lastViewportH));
    const midY = (tlObj.position.y + brObj.position.y) * 0.5;
    const midZ = (tlObj.position.z + brObj.position.z) * 0.5;
    const pMidL = new THREE.Vector3(tlObj.position.x, midY, midZ);
    const pMidR = new THREE.Vector3(brObj.position.x, midY, midZ);
    if (tlObj.parent) {
      tlObj.parent.localToWorld(pMidL);
      tlObj.parent.localToWorld(pMidR);
    }
    pMidL.project(camera);
    pMidR.project(camera);

    const vTL = new THREE.Vector3();
    const vBR = new THREE.Vector3();
    tlObj.getWorldPosition(vTL).project(camera);
    brObj.getWorldPosition(vBR).project(camera);

    const x1 = ((pMidL.x + 1) * 0.5) * vw;
    const x2 = ((pMidR.x + 1) * 0.5) * vw;
    const y1 = ((-vTL.y + 1) * 0.5) * vh;
    const y2 = ((-vBR.y + 1) * 0.5) * vh;

    const cx = (x1 + x2) * 0.5;
    const cy = (y1 + y2) * 0.5;
    const w = Math.max(minW, Math.round(Math.abs(x2 - x1) + pad));
    const h = Math.max(minH, Math.round(Math.abs(y2 - y1) + pad));
    return {
      x: Math.round(cx - w / 2),
      y: Math.round(cy - h / 2),
      w,
      h,
    };
  }

  function updateAllProjections() {
    if (!overlayContainer || !isActive || quality === 'low') return;
    const scr = projectBox(cornerTL, cornerBR, 0, 0, 0);
    overlayContainer.style.setProperty('--screen-x', `${scr.x}px`);
    overlayContainer.style.setProperty('--screen-y', `${scr.y}px`);
    overlayContainer.style.setProperty('--screen-w', `${scr.w}px`);
    overlayContainer.style.setProperty('--screen-h', `${scr.h}px`);

    const pwr = projectBox(powerTL, powerBR, 44, 44, 14);
    overlayContainer.style.setProperty('--power-hit-x', `${pwr.x}px`);
    overlayContainer.style.setProperty('--power-hit-y', `${pwr.y}px`);
    overlayContainer.style.setProperty('--power-hit-w', `${pwr.w}px`);
    overlayContainer.style.setProperty('--power-hit-h', `${pwr.h}px`);

    const disk = projectBox(diskTL, diskBR, 44, 44, 10);
    overlayContainer.style.setProperty('--disk-hit-x', `${disk.x}px`);
    overlayContainer.style.setProperty('--disk-hit-y', `${disk.y}px`);
    overlayContainer.style.setProperty('--disk-hit-w', `${disk.w}px`);
    overlayContainer.style.setProperty('--disk-hit-h', `${disk.h}px`);

    if (onProjection) onProjection(scr);
  }

  function applyFloppyPose(progress) {
    floppyDiskMesh.position.z = -0.075 + progress * 0.175;
    floppyDiskMesh.position.y = -progress * 0.006;
    floppyDiskMesh.rotation.x = progress * 0.14;
  }

  function setFloppyState({ progress = 0, led = 'idle' }) {
    targetFloppyProgress = Math.max(0, Math.min(1, progress));
    floppyLedState = led;
    if (led === 'open') driveLedMat.color.setHex(0x00e5ff);
    else if (led === 'intent') driveLedMat.color.setHex(0xffbf00);
    else driveLedMat.color.setHex(0x16383e);

    if (isReduced || quality === 'low') {
      curFloppyProgress = targetFloppyProgress;
      applyFloppyPose(curFloppyProgress);
      renderSingleFrame();
    } else {
      lastActiveMs = performance.now();
      requestFrameOrLoop();
    }
  }

  function setScreenState(stateName) {
    const hex = STATE_LIGHT_HEX[stateName] || STATE_LIGHT_HEX.menu;
    targetLightColor = new THREE.Color(hex);
    if (stateName === 'standby' || stateName === 'off') {
      targetLightIntensity = stateName === 'off' ? 0.04 : 0.22;
      targetGlassHex = stateName === 'off' ? 0x040709 : 0x09160c;
      targetGlassEmissive = stateName === 'off' ? 0.04 : 0.2;
      ledMat.color.setHex(stateName === 'off' ? 0x3b4424 : 0x6b7c3e);
    } else {
      targetLightIntensity = 0.42;
      targetGlassHex = hex;
      targetGlassEmissive = 0.22;
      ledMat.color.setHex(stateName === 'paused' ? 0xffbf00 : 0x39ff14);
    }
    if (isReduced || quality === 'low') {
      screenBounceLight.color.copy(targetLightColor);
      screenBounceLight.intensity = targetLightIntensity;
      glassMat.emissive.setHex(targetGlassHex);
      glassMat.emissiveIntensity = targetGlassEmissive;
      renderSingleFrame();
    } else {
      lastActiveMs = performance.now();
      requestFrameOrLoop();
    }
  }

  function setCameraState(poseName, durationOverrideMs = null) {
    const vp = readVp();
    const poseSet = getPoseProfile(vp.w, vp.h, isCoarse);
    const pose = poseSet[poseName] || poseSet.menu;
    currentPoseName = poseName;
    metrics.cameraPose = `${vp.w < vp.h || vp.w <= 639 || vp.h <= 560 || isCoarse ? 'mobile-' : ''}${poseName}`;
    goalCamPos.set(...pose.pos);
    goalLookAt.set(...pose.target);
    goalFov = pose.fov;

    if (isReduced || quality === 'low' || durationOverrideMs === 0) {
      curCamPos.copy(goalCamPos);
      curLookAt.copy(goalLookAt);
      curFov = goalFov;
      cameraTweening = false;
      renderSingleFrame();
    } else {
      cameraFromPos = curCamPos.clone();
      cameraFromTarget = curLookAt.clone();
      cameraFromFov = curFov;
      cameraTweenDuration = durationOverrideMs ?? pose.durationMs;
      cameraTweenStart = performance.now();
      cameraTweening = true;
      lastActiveMs = performance.now();
      requestFrameOrLoop();
    }
  }

  function renderSingleFrame() {
    if (!isActive || contextLost || quality === 'low') return;
    const frameStart = performance.now();
    camera.position.copy(curCamPos);
    camera.lookAt(curLookAt);
    if (Math.abs(camera.fov - curFov) > 0.01) {
      camera.fov = curFov;
      camera.updateProjectionMatrix();
    }
    workstationGroup.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    updateAllProjections();
    renderer.render(scene, camera);

    const frameDur = performance.now() - frameStart;
    metrics.drawCalls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;
    metrics.avgFrameMs = +frameDur.toFixed(2);
    if (onMetrics) onMetrics(metrics);
  }

  function tick(now) {
    rafId = null;
    if (!isActive || isHidden || contextLost || quality === 'low' || isReduced) {
      metrics.fps = 0;
      metrics.loopState = isHidden ? 'hidden (0 FPS)' : isReduced ? 'static-3d (0 FPS)' : 'paused (0 FPS)';
      if (onMetrics) onMetrics(metrics);
      return;
    }

    const dt = Math.min(0.1, (now - lastFrameMs) / 1000);
    lastFrameMs = now;

    const floppyMoving = Math.abs(curFloppyProgress - targetFloppyProgress) > 0.004;
    const lightSettling =
      Math.abs(screenBounceLight.intensity - targetLightIntensity) > 0.005 ||
      Math.abs(screenBounceLight.color.r - targetLightColor.r) > 0.01 ||
      Math.abs(screenBounceLight.color.g - targetLightColor.g) > 0.01 ||
      Math.abs(screenBounceLight.color.b - targetLightColor.b) > 0.01;

    if (cameraTweening || floppyMoving || lightSettling) {
      lastActiveMs = now;
    }

    const settleDelay = embedMode ? 120 : quality === 'mobile' ? 400 : 2600;
    const isIdle = !cameraTweening && !floppyMoving && !lightSettling && (now - lastActiveMs > settleDelay);

    if (embedMode && isIdle) {
      dustPoints.visible = false;
      metrics.loopState = 'embed-asleep (0 FPS)';
      metrics.fps = 0;
      if (onMetrics) onMetrics(metrics);
      return;
    }

    if ((quality === 'medium' || quality === 'mobile') && isIdle) {
      metrics.loopState = 'idle-asleep (0 FPS)';
      metrics.fps = 0;
      if (onMetrics) onMetrics(metrics);
      return;
    }

    if (quality === 'high' && isIdle) {
      idleThrottleAccum += dt;
      if (idleThrottleAccum < 1 / 14) {
        metrics.loopState = 'idle-14fps';
        rafId = requestAnimationFrame(tick);
        return;
      }
      idleThrottleAccum = 0;
      metrics.loopState = 'idle-14fps';
    } else {
      metrics.loopState = 'active';
    }

    const frameWorkStart = performance.now();

    // 1. Fixed camera state transition (restrained cubic ease-out, zero overshoot)
    if (cameraTweening) {
      const p = Math.min(1, (now - cameraTweenStart) / Math.max(1, cameraTweenDuration));
      const ease = 1 - Math.pow(1 - p, 3);
      curCamPos.lerpVectors(cameraFromPos, goalCamPos, ease);
      curLookAt.lerpVectors(cameraFromTarget, goalLookAt, ease);
      curFov = cameraFromFov + (goalFov - cameraFromFov) * ease;
      if (p >= 1) cameraTweening = false;
    }

    // 2. Smooth mechanical floppy tray extension (~1.25s stroke)
    if (floppyMoving) {
      const step = dt / 1.25;
      if (curFloppyProgress < targetFloppyProgress) {
        curFloppyProgress = Math.min(targetFloppyProgress, curFloppyProgress + step);
      } else {
        curFloppyProgress = Math.max(targetFloppyProgress, curFloppyProgress - step * 1.6);
      }
      applyFloppyPose(curFloppyProgress);
    }

    // 3. Smooth state bounce light & glass glow
    screenBounceLight.color.lerp(targetLightColor, Math.min(1, dt * 8));
    screenBounceLight.intensity += (targetLightIntensity - screenBounceLight.intensity) * Math.min(1, dt * 8);
    glassMat.emissive.lerp(new THREE.Color(targetGlassHex), Math.min(1, dt * 8));
    glassMat.emissiveIntensity += (targetGlassEmissive - glassMat.emissiveIntensity) * Math.min(1, dt * 8);

    // 4. Stepped 320x180 pixel environment (HIGH animated only; capped <= 15 uploads/sec)
    if (quality === 'high' && !isReduced) {
      if (pixelEnv.step(dt, true)) {
        pixelTexture.needsUpdate = true;
        uploadTimestamps.push(now);
      }
      const posArr = dustGeo.attributes.position.array;
      const tSec = now * 0.00045;
      for (let i = 0; i < dustCount; i++) {
        const sd = dustSeed[i];
        posArr[i * 3] = sd.bx + Math.sin(tSec * sd.speed + sd.phase) * 0.06;
        posArr[i * 3 + 1] = sd.by + Math.cos(tSec * 0.8 * sd.speed + sd.phase) * 0.04;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    // 5. Render scene and update screen + projected bezel controls
    camera.position.copy(curCamPos);
    camera.lookAt(curLookAt);
    if (Math.abs(camera.fov - curFov) > 0.01) {
      camera.fov = curFov;
      camera.updateProjectionMatrix();
    }
    workstationGroup.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    updateAllProjections();
    renderer.render(scene, camera);

    // 6. Telemetry & adaptive quality guard
    const frameDur = performance.now() - frameWorkStart;
    fpsCount++;
    frameTimeSamples.push(frameDur);
    if (frameTimeSamples.length > 60) frameTimeSamples.shift();

    if (!isIdle && (quality === 'high' || quality === 'mobile')) {
      slowFrameSamples.push(frameDur);
      const limitFrames = quality === 'mobile' ? 30 : 45;
      const thresholdMs = quality === 'mobile' ? 29 : 24;
      if (slowFrameSamples.length > limitFrames) slowFrameSamples.shift();
      if (slowFrameSamples.length === limitFrames) {
        const slowAvg = slowFrameSamples.reduce((a, b) => a + b, 0) / limitFrames;
        if (slowAvg > thresholdMs && onAutoDowngrade) {
          slowFrameSamples = [];
          onAutoDowngrade(quality === 'mobile' ? '2d-fallback' : 'medium', slowAvg);
        }
      }
    }

    uploadTimestamps = uploadTimestamps.filter((ts) => now - ts <= 1000);
    if (now - fpsWindowStart >= 500) {
      metrics.fps = Math.round((fpsCount * 1000) / (now - fpsWindowStart));
      fpsCount = 0;
      fpsWindowStart = now;
    }
    const avg = frameTimeSamples.reduce((a, b) => a + b, 0) / frameTimeSamples.length;
    metrics.avgFrameMs = +avg.toFixed(2);
    metrics.maxFrameMs = +Math.max(...frameTimeSamples).toFixed(2);
    metrics.drawCalls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;
    metrics.pixelTickMs = +pixelEnv.lastTickMs.toFixed(2);
    metrics.pixelUploadsPerSec = uploadTimestamps.length;
    if (onMetrics) onMetrics(metrics);

    rafId = requestAnimationFrame(tick);
  }

  function requestFrameOrLoop() {
    if (!isActive || isHidden || contextLost || quality === 'low' || isReduced) return;
    if (!rafId) {
      lastFrameMs = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  const onVisibility = () => {
    isHidden = Boolean(document.hidden);
    if (!isActive || quality === 'low') return;
    if (isHidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      metrics.loopState = 'hidden (0 FPS)';
      metrics.fps = 0;
      if (onMetrics) onMetrics(metrics);
    } else if (quality !== 'low') {
      lastActiveMs = performance.now();
      requestFrameOrLoop();
    }
  };

  const onContextLost = (e) => {
    e.preventDefault();
    contextLost = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (onFatalFallback) onFatalFallback('webglcontextlost');
  };

  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);

  applyPixelMode(pixelMode);
  applyQualitySettings(quality, initVp.w, initVp.h);
  renderSingleFrame();

  return {
    setActive(val) {
      isActive = Boolean(val);
      if (!isActive && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    setEmbedMode(val) {
      embedMode = Boolean(val);
      dustPoints.visible = quality === 'high' && !isReduced && !embedMode;
      if (!embedMode && isActive && !isReduced && quality !== 'low') {
        lastActiveMs = performance.now();
        requestFrameOrLoop();
      } else if (embedMode && !cameraTweening && !rafId) {
        metrics.loopState = 'embed-asleep (0 FPS)';
        metrics.fps = 0;
        if (onMetrics) onMetrics(metrics);
      }
    },
    setQuality(nextQ) {
      applyQualitySettings(nextQ);
    },
    resizeViewport(w, h) {
      applyQualitySettings(quality, w, h);
      if (isActive && quality !== 'low') renderSingleFrame();
    },
    setCoarsePointer(val) {
      isCoarse = Boolean(val);
    },
    setPixelMode(nextMode) {
      applyPixelMode(nextMode);
    },
    setReducedMotion(val) {
      isReduced = Boolean(val);
      dustPoints.visible = quality === 'high' && !isReduced && !embedMode;
      if (isReduced) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        pixelEnv.renderStatic();
        pixelTexture.needsUpdate = true;
        metrics.fps = 0;
        metrics.loopState = 'static-3d (0 FPS)';
        renderSingleFrame();
      } else {
        lastActiveMs = performance.now();
        requestFrameOrLoop();
      }
    },
    syncBeforeShow(poseName) {
      fpsCount = 0;
      fpsWindowStart = performance.now();
      frameTimeSamples = [];
      pixelTexture.needsUpdate = true;
      setCameraState(poseName, 0);
    },
    renderSingleFrame,
    setCameraState,
    setScreenState,
    setFloppyState,
    setCallbacks({ autoDowngrade, metricsCb, projectionCb }) {
      onAutoDowngrade = autoDowngrade;
      onMetrics = metricsCb;
      onProjection = projectionCb || null;
    },
    getMetrics() {
      return { ...metrics };
    },
    dispose() {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
    },
  };
}
