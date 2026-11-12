// hero3d.js: the user's own character (cut-out rig from short-1899/kit/sheet.jpg) standing in the 3D world
// as a camera-facing 2D cut-out, lip-synced to the voice envelope (window.ENV, dB per frame from envelope.js).
// The rig scripts are evaluated in a private scope (their helper names clash with neon.js globals).
import * as K from './core3d.js';
const { THREE } = K;
const RIG = new URL('../../short-1899/kit/', import.meta.url).href;

function readText(url) { const x = new XMLHttpRequest(); x.open('GET', url, false); x.send(); return x.responseText; }

// hero({ height }) -> { obj, set(t, opts) }   opts: { up, wave, headRot, pose: 'front'|'chinta' }
export async function hero({ height = 4.2, fps = 30 } = {}) {
  window.SHEET_URL = RIG + 'sheet.jpg';
  const api = new Function(readText(RIG + 'common.js') + '\n' + readText(RIG + 'rigcore.js') +
    '\nreturn { prepareSheet, buildRig, drawFront, drawChinta, shadow };')();
  api.buildRig(await api.prepareSheet());
  const cw = 640, ch = 1160, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const w = height * cw / ch;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, toneMapped: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, height), mat); plane.position.y = height / 2;
  const obj = new THREE.Group(); obj.add(plane); K.scene.add(obj);
  // soft contact shadow on the ground
  const sh = new THREE.Mesh(new THREE.CircleGeometry(w * 0.32, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; sh.scale.y = 0.35; obj.add(sh);
  const mouthAt = t => {
    const E = window.ENV || [], i = Math.round(t * fps); if (i < 0 || i >= E.length) return 0;
    const v = j => E[Math.max(0, Math.min(E.length - 1, j))], db = (v(i - 1) + 2 * v(i) + v(i + 1)) / 4;
    return Math.max(0, Math.min(1, (db + 44) / 22)) * (0.7 + 0.3 * Math.abs(Math.sin(t * 17)));
  };
  return {
    obj,
    set(t, o = {}) {
      g.clearRect(0, 0, cw, ch);
      api.drawFront(g, cw / 2, ch - 12, 1, Object.assign({ t, mouth: mouthAt(t) }, o));
      tex.needsUpdate = true;
      // face the camera around the vertical axis only (stays planted on the ground)
      const c = K.camera.position; obj.rotation.y = Math.atan2(c.x - obj.position.x, c.z - obj.position.z);
    },
  };
}
