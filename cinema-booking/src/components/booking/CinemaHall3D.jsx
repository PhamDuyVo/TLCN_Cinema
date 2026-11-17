import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { adaptSeatLayout } from './seatLayoutAdapter';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { canSelectSeat } from '../../utils/booking';
import { formatCurrency } from '../../utils/format';

export default function CinemaHall3D({ seats, selectedIds, onToggle, disabled }) {
  const host = useRef(null);
  const sceneState = useRef(null);
  const [focusedId, setFocusedId] = useState(selectedIds.at(-1) ?? null);
  const [failed, setFailed] = useState(false);
  const [pov, setPov] = useState(false);
  const [assetError, setAssetError] = useState('');
  const [quality, setQuality] = useState('high');
  const focused = seats.find(s => s.id === focusedId);
  // Only geometry changes rebuild the scene; polling and selection keep the camera intact.
  const layout = JSON.stringify(seats.map(({ id, seatRow, seatCol, layoutCol, seatType }) => ({ id, seatRow, seatCol, layoutCol, seatType })));
  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { queueMicrotask(() => setFailed(true)); return; }
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#181818');
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    const positions = adaptSeatLayout(JSON.parse(layout));
    let disposed = false;
    const resources = [];
    const rows = [...new Set(positions.map(s => s.seatRow))].sort();
    const columns = Math.max(1, ...positions.map(s => s.layoutCol ?? s.seatCol));
    const width = columns * 1.9;
    const depth = Math.max(6, rows.length * 1.8 + 3);
    camera.position.set(width * .6, depth * .9, depth + 5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, depth / 2); controls.maxPolarAngle = Math.PI / 2; controls.minDistance = .5; controls.maxDistance = depth * 4; controls.update();
    const overview = camera.position.clone();
    scene.add(new THREE.HemisphereLight(0xffe4ce, 0x15101a, 1.5));
    const glow = new THREE.DirectionalLight(0xe0eaff, 2); glow.position.set(0, 6, -2); scene.add(glow);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const screen = new THREE.Mesh(new THREE.BoxGeometry(width + 2, 4, .15), new THREE.MeshBasicMaterial({ color: '#dddddd' }));
    screen.position.set(0, 3, -2); scene.add(screen);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width + 4, .15, depth + 5), new THREE.MeshStandardMaterial({ color: '#292929' }));
    floor.position.set(0, -.25, depth / 2); scene.add(floor);
    const meshes = [];
    function block(size, position, color, emissive = false) {
      const material = emissive ? new THREE.MeshBasicMaterial({color}) : new THREE.MeshStandardMaterial({color, roughness: .9});
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.position.set(...position); scene.add(mesh); return mesh;
    }
    rows.forEach((row, index) => {
      const y = index * .24;
      block([width + 3, y + .2, 1.8], [0, (y - .2)/2, 2.6 + index*1.8], '#201d23');
      for (const side of [-1,1]) {
        block([.8, y + .08, .9], [side*(width/2+1), (y-.08)/2, 2.15+index*1.8], '#30242a');
        block([.6,.025,.04],[side*(width/2+1),y+.015,2.2+index*1.8],'#ffb45a',true);
      }
    });
    block([width+2.5,4.5,.2],[0,3,-2.15],'#08080a');
    block([width+3, .2, .3], [0, .1, -2], '#101014');
    for (const side of [-1,1]) {
      block([.2,5,depth+5],[side*(width/2+1.8),2.3,depth/2],'#17141c');
      for (let z=0;z<depth;z+=1.8) block([.12,3,1.3],[side*(width/2+1.65),2.5,z],'#34212a');
    }
    // Back wall is low in overview so it doesn't obscure seats.
    block([width+3,1,.2],[0,.5,depth+1],'#17141c');
    const loader = new GLTFLoader();
    Promise.all(['standard','vip','couple'].map(async type => [type, (await loader.loadAsync(`/models/cinema/${type}.glb`)).scene])).then(entries => {
      const templates = Object.fromEntries(entries);
      for (const template of Object.values(templates)) template.traverse(o => { if (o.isMesh) resources.push(o); });
      if (disposed) { resources.forEach(o => { o.geometry.dispose(); o.material.dispose(); }); return; }
      positions.forEach(seat => {
        const kind = /couple|đôi/i.test(seat.seatType) ? 'couple' : /vip/i.test(seat.seatType) ? 'vip' : 'standard';
        const model = templates[kind].clone(true); model.rotation.y = Math.PI;
        model.position.set(...seat.position);
        model.traverse(o => { if (o.isMesh) { o.material=o.material.clone(); o.userData.seatId=seat.id; } });
        scene.add(model);
        const anchor = new THREE.Mesh(new THREE.BoxGeometry(kind==='couple'?1.7:1.1,1.5,1),new THREE.MeshBasicMaterial({visible:false}));
        anchor.position.set(seat.position[0], seat.position[1]+.75,seat.position[2]);anchor.userData.seatId=seat.id;anchor.userData.model=model;scene.add(anchor);meshes.push(anchor);
      });
      sceneState.current?.updateColors?.(); render();
    }).catch(() => { if (!disposed) setAssetError('Không tải được model ghế. Vui lòng dùng sơ đồ 2D hoặc tải lại trang.'); });
    renderer.setPixelRatio(quality === 'low' ? 1 : Math.min(window.devicePixelRatio, 1.5)); container.appendChild(renderer.domElement);
    const render = () => renderer.render(scene, camera);
    const resize = new ResizeObserver(() => { const w = container.clientWidth; renderer.setSize(w, 380); camera.aspect = w / 380; camera.updateProjectionMatrix(); render(); });
    resize.observe(container); controls.addEventListener('change', render);
    let down, lastPointer;
    const onMove = e => {
      const state = sceneState.current;
      if (state?.pov && down && lastPointer) {
        const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        rotation.y -= (e.clientX-lastPointer[0])*.004;
        rotation.x = THREE.MathUtils.clamp(rotation.x-(e.clientY-lastPointer[1])*.004,-.7,.7);
        camera.quaternion.setFromEuler(rotation); render();
      }
      lastPointer = [e.clientX,e.clientY];
    };
    const onDown = e => { down = [e.clientX, e.clientY]; lastPointer = down; };
    const onClick = e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) { down = null; return; }
      down = null;
      const rect = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = ray.intersectObjects(meshes)[0]; if (hit) setFocusedId(hit.object.userData.seatId);
    };
    renderer.domElement.addEventListener('pointermove', onMove); renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onClick);
    sceneState.current = { camera, controls, meshes, render, overview, depth };
    render();
    return () => {
      disposed = true;
      sceneState.current?.cancelCamera?.();
      sceneState.current = null;
      resources.forEach(o => { o.geometry.dispose(); o.material.dispose(); }); resize.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onMove); renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onClick);
      scene.traverse(object => { object.geometry?.dispose(); if (object.material) object.material.dispose(); });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [layout, quality]);
  useEffect(() => {
    const state = sceneState.current; if (!state) return;
    state.updateColors = () => state.meshes.forEach(mesh => {
      const seat = seats.find(s => s.id === mesh.userData.seatId); if (!seat) return;
      mesh.userData.model.traverse(o => { if (o.isMesh) { o.material.emissive?.set(selectedIds.includes(seat.id) ? '#12432a' : seat.id === focusedId ? '#302020' : '#000000'); o.material.color.set(canSelectSeat(seat,selectedIds) ? (/Metal/.test(o.material.name) ? '#24242a' : '#67192b') : '#44444a'); } });
    });
    state.updateColors();
    state.render();
  }, [seats, selectedIds, focusedId, layout, quality]);
  function viewFromSeat() {
    const state = sceneState.current; const mesh = state?.meshes.find(m => m.userData.seatId === focusedId); if (!mesh) return;
    state.cancelCamera?.(); state.controls.enabled = false; state.pov = true;
    const from = state.camera.position.clone(), destination = mesh.position.clone().add(new THREE.Vector3(0,.45,-.15));
    const began = performance.now(); let frame;
    function animate(time) { const t = Math.min(1,(time-began)/700), eased = t*t*(3-2*t); state.camera.position.lerpVectors(from,destination,eased); state.camera.lookAt(0,3,-2); state.render(); if(t<1) frame=requestAnimationFrame(animate); }
    frame=requestAnimationFrame(animate); state.cancelCamera=()=>cancelAnimationFrame(frame);
     state.controls.target.set(0, 3, -2); state.controls.enablePan = false; state.controls.enableZoom = false; state.render(); setPov(true);
  }
  function resetView() { const s = sceneState.current; if (!s) return; s.cancelCamera?.(); s.controls.enabled = true; s.pov = false; s.camera.position.copy(s.overview); s.controls.target.set(0, 0, s.depth / 2); s.controls.enablePan = true; s.controls.enableZoom = true; s.controls.update(); s.render(); setPov(false); }
  return <div><label className="block text-sm mb-3">Chất lượng <select className="bg-zinc-900 p-2 rounded" value={quality} onChange={e => { setQuality(e.target.value); setPov(false); }}><option value="high">Tiêu chuẩn</option><option value="low">Tiết kiệm GPU</option></select></label>{assetError && <p role="alert">{assetError}</p>}<div ref={host} className="w-full h-[380px] rounded-lg overflow-hidden" aria-label="Mô phỏng phòng chiếu 3D" />{failed && <p role="alert" className="text-amber-400">Thiết bị không hỗ trợ WebGL. Vui lòng chuyển sang sơ đồ 2D.</p>}
    <p className="text-xs text-zinc-400 mt-3">Sơ đồ ghế lấy từ phòng đang đặt. Kích thước, độ cao và góc nhìn là mô phỏng ước lượng, chưa phải số đo thực tế. Bấm ghế để xem thông tin; kéo để xoay, cuộn để phóng to.</p>
    <label className="block mt-4 text-sm">Ghế xem trước <select value={focusedId ?? ''} onChange={e => setFocusedId(Number(e.target.value))} className="bg-zinc-900 border border-zinc-700 rounded p-2 ml-2"><option value="" disabled>Chọn ghế</option>{seats.map(s => <option key={s.id} value={s.id}>{s.seatNumber}</option>)}</select></label>
    {focused && <p className="my-3 text-sm">{focused.seatNumber} · {focused.seatType} · {formatCurrency(focused.finalPrice)} · {focused.status}</p>}
    <div className="flex flex-wrap gap-3 mt-3"><button disabled={!focused || failed} onClick={viewFromSeat} className="bg-zinc-700 px-4 py-2 rounded disabled:opacity-40">Xem POV</button><button disabled={!focused || disabled || !canSelectSeat(focused, selectedIds)} onClick={() => onToggle(focused)} className="bg-[#e71a0f] px-4 py-2 rounded disabled:opacity-40">{selectedIds.includes(focusedId) ? 'Bỏ chọn ghế' : 'Chọn ghế'}</button><button onClick={resetView} className="border border-zinc-600 px-4 py-2 rounded">{pov ? 'Thoát POV' : 'Toàn cảnh'}</button></div>
  </div>;
}
