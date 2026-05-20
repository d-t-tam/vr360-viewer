import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── 1. RENDERER ─────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ─── 2. SCENE & CAMERA ───────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1100
);
camera.position.set(0, 0, 0.01);

// ─── 3. SPHERE VR360 ─────────────────────────────────────────────────────────
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1); // mặt trong quay vào camera

const material = new THREE.MeshBasicMaterial();
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// ─── 4. ĐỊNH NGHĨA CÁC SCENE & HOTSPOT ──────────────────────────────────────
// Thêm ảnh panorama thứ 2 vào public/ với tên temple360_2.jpg
// Vị trí hotspot (x, y, z) = điểm trên mặt cầu, điều chỉnh cho khớp cửa
const SCENES = [
  {
    texture: '/temple360.jpg',
    hotspots: [
      {
        position: new THREE.Vector3(-350, -100, -420),
        targetScene: 1,
        label: 'Vào phòng kế',
      },
    ],
  },
  {
    texture: '/temple360_2.png',
    hotspots: [
      {
        position: new THREE.Vector3(800, 100, 500),
        targetScene: 0,
        label: 'Quay lại',
      },
    ],
  },
];

// Thông tin của từng scene (hiển thị qua nút HTML)
const SCENE_INFO = [
  {
    title: '🏚️ Nhà bỏ hoang ven biển (mùa đông)',
    body: [
      '📍 Vị trí: Khung cảnh ven biển phủ tuyết qua khung cửa',
      '🏚️ Tình trạng: Công trình bị bỏ hoang, tường và giấy dán tường bong tróc',
      '🔥 Chi tiết nội thất: Lò sưởi cũ, đồ đạc hỏng (ghế, tủ), sàn phủ băng/tuyết',
      '🌬️ Môi trường: Ánh sáng lạnh, không khí hoang vắng, dấu hiệu thời tiết khắc nghiệt',
      '📷 Ghi chú: Ảnh panorama 360° chụp nội thất để tham quan thực địa',
      '⚠️ Lưu ý: Cảnh hoang phế, không an toàn để vào thực tế',
    ],
  },
  null, // scene 2 không có thông tin
];

// ─── 5. TẠO SPRITE MŨI TÊN ───────────────────────────────────────────────────
function createHotspotSprite(label) {
  const W = 280, H = 140;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Nền pill tối
  ctx.beginPath();
  ctx.roundRect(4, 4, W - 8, H - 8, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();

  // Viền vàng phát sáng
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Mũi tên lên (↑) chỉ hướng đi
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 54px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('↑', W / 2, H * 0.42);

  // Nhãn chữ
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px Arial';
  ctx.fillText(label, W / 2, H * 0.82);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(70, 35, 1);
  return sprite;
}

// ─── 6. HOTSPOT MANAGER ──────────────────────────────────────────────────────
const hotspots = [];

function clearHotspots() {
  hotspots.forEach(({ sprite }) => scene.remove(sprite));
  hotspots.length = 0;
}

// ─── 7. FADE OVERLAY ─────────────────────────────────────────────────────────
const overlay = document.createElement('div');
overlay.style.cssText = `
  position:fixed; inset:0; background:#000; opacity:0;
  pointer-events:none; transition:opacity 0.45s ease; z-index:100;
`;
document.body.appendChild(overlay);

function fade(toBlack) {
  overlay.style.opacity = toBlack ? '1' : '0';
}

// ─── 8. LOAD SCENE ───────────────────────────────────────────────────────────
const loader = new THREE.TextureLoader();
let currentScene = 0;

function loadScene(index) {
  currentScene = index;
  fade(true);

  setTimeout(() => {
    // dispose previous texture to avoid caching/display issues
    if (material.map) {
      try { material.map.dispose(); } catch (e) { }
      material.map = null;
    }

    loader.load(
      SCENES[index].texture,
      (tex) => {
        // ensure correct color encoding and force update
        if (tex) {
          if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
          else if ('encoding' in tex) tex.encoding = THREE.sRGBEncoding;
          tex.needsUpdate = true;
        }
        material.map = tex;
        material.needsUpdate = true;
        console.log('Loaded panorama:', SCENES[index].texture);

        clearHotspots();
        SCENES[index].hotspots.forEach((h) => {
          const sprite = createHotspotSprite(h.label);
          const pos = h.position.clone().normalize().multiplyScalar(200);
          sprite.position.copy(pos);
          sprite.userData.targetScene = h.targetScene;
          sprite.userData.baseY = pos.y;
          scene.add(sprite);
          hotspots.push({ sprite, targetScene: h.targetScene });
        });

        // Hiện/ẩn nút thông tin HTML theo scene
        const infoBtn = document.getElementById('btn-info');
        if (infoBtn) infoBtn.style.display = SCENE_INFO[index] ? 'flex' : 'none';

        fade(false);
      },
      undefined,
      (err) => {
        console.error('❌ Không load được ảnh:', SCENES[index].texture, err);
        fade(false);
      }
    );
  }, 480);
}

// ─── 9. ORBIT CONTROLS (mouse/touch drag only) ───────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = Math.PI * 0.1;
controls.maxPolarAngle = Math.PI * 0.9;
controls.rotateSpeed = -0.4; // âm = đảo chiều kéo chuột (VR look-around)

// ─── Camera spherical state (dùng cho keyboard/button, KHÔNG qua OrbitControls) ─
const camSpherical = new THREE.Spherical();
camSpherical.setFromVector3(camera.position.clone().negate()); // bắt đầu từ vị trí hiện tại
// Phi (trục dọc) bị giới hạn theo minPolarAngle/maxPolarAngle của controls
const PHI_MIN = controls.minPolarAngle;
const PHI_MAX = controls.maxPolarAngle;

// Sync OrbitControls target → camSpherical sau mỗi lần drag chuột xong
controls.addEventListener('end', () => {
  // Lấy hướng camera hiện tại, đổi sang spherical để keyboard tiếp tục đúng góc
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  camSpherical.setFromVector3(dir);
  camSpherical.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, camSpherical.phi));
});

// Time helper for frame-independent motion
const clock = new THREE.Clock();

// ─── 15. KEYBOARD CONTROL (trực tiếp xoay camera, không qua OrbitControls) ───
const moveState = { left: false, right: false, up: false, down: false };
const KEY_ROTATE_SPEED = 1.2; // radians/giây

// Keyboard arrows support
window.addEventListener('keydown', (e) => {
  const key = e.key || '';
  const code = e.code || '';
  if (key === 'ArrowLeft' || code === 'ArrowLeft') { moveState.left = true; e.preventDefault(); }
  if (key === 'ArrowRight' || code === 'ArrowRight') { moveState.right = true; e.preventDefault(); }
  if (key === 'ArrowUp' || code === 'ArrowUp') { moveState.up = true; e.preventDefault(); }
  if (key === 'ArrowDown' || code === 'ArrowDown') { moveState.down = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  const key = e.key || '';
  const code = e.code || '';
  if (key === 'ArrowLeft' || code === 'ArrowLeft') moveState.left = false;
  if (key === 'ArrowRight' || code === 'ArrowRight') moveState.right = false;
  if (key === 'ArrowUp' || code === 'ArrowUp') moveState.up = false;
  if (key === 'ArrowDown' || code === 'ArrowDown') moveState.down = false;
});

// Clear movement state when window loses focus to avoid sticky keys
window.addEventListener('blur', () => {
  moveState.left = moveState.right = moveState.up = moveState.down = false;
});

// ─── 10. ZOOM BẰNG FOV ───────────────────────────────────────────────────────
const FOV_MIN = 30, FOV_MAX = 90;
let targetFov = camera.fov;
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  targetFov += e.deltaY * 0.05;
  targetFov = Math.max(FOV_MIN, Math.min(FOV_MAX, targetFov));
}, { passive: false });

// ─── 11. RAYCASTING – CLICK HOTSPOT ──────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Kiểm tra click vào navigation hotspot
  const hits = raycaster.intersectObjects(hotspots.map(h => h.sprite));
  if (hits.length > 0) {
    loadScene(hits[0].object.userData.targetScene);
  }
});

// Con trỏ đổi khi hover hotspot / info
renderer.domElement.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(hotspots.map(h => h.sprite));
  renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
});

// ─── 12. ANIMATION LOOP ──────────────────────────────────────────────────────
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();

  // ── Keyboard: xoay camera trực tiếp qua spherical coordinates ──
  const anyKey = moveState.left || moveState.right || moveState.up || moveState.down;
  if (anyKey) {
    const step = KEY_ROTATE_SPEED * delta;
    if (moveState.left) camSpherical.theta += step; // nhìn sang trái
    if (moveState.right) camSpherical.theta -= step; // nhìn sang phải
    if (moveState.up) camSpherical.phi -= step; // nhìn lên
    if (moveState.down) camSpherical.phi += step; // nhìn xuống
    // Giữ phi trong giới hạn
    camSpherical.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, camSpherical.phi));
    // Áp dụng lên camera target của OrbitControls
    const targetPos = new THREE.Vector3().setFromSpherical(camSpherical);
    controls.target.copy(targetPos);
    controls.update();
  } else {
    controls.update();
  }

  // FOV smooth lerp
  if (Math.abs(camera.fov - targetFov) > 0.01) {
    camera.fov += (targetFov - camera.fov) * 0.1;
    camera.updateProjectionMatrix();
  }

  // Hotspot bob lên xuống nhẹ
  const t = performance.now() * 0.001;
  hotspots.forEach(({ sprite }, i) => {
    sprite.position.y = sprite.userData.baseY + Math.sin(t * 1.8 + i * 1.5) * 2.5;
  });

  renderer.render(scene, camera);
});

// ─── 13. RESIZE ──────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── 14. HINT ────────────────────────────────────────────────────────────────
setTimeout(() => {
  const hint = document.getElementById('hint');
  if (hint) hint.style.opacity = '0';
}, 4000);

// ─── 16. INFO POPUP ──────────────────────────────────────────────────────────
function showInfoPopup(info) {
  const popup = document.getElementById('info-popup');
  const title = document.getElementById('info-title');
  const body  = document.getElementById('info-body');
  if (!popup || !info) return;
  title.textContent = info.title;
  body.innerHTML = info.body.map(line => `<li>${line}</li>`).join('');
  popup.classList.add('visible');
}

function hideInfoPopup() {
  const popup = document.getElementById('info-popup');
  if (popup) popup.classList.remove('visible');
}
window.hideInfoPopup = hideInfoPopup;

// Nút thông tin HTML bấm thì mở popup với data của scene hiện tại
window.openSceneInfo = () => {
  const info = SCENE_INFO[currentScene];
  if (info) showInfoPopup(info);
};

// Click vào backdrop đóng popup
document.getElementById('info-popup')?.addEventListener('click', (e) => {
  if (e.target.id === 'info-popup') hideInfoPopup();
});

// ─── KHỞI ĐỘNG ───────────────────────────────────────────────────────────────
loadScene(0);
