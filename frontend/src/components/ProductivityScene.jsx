import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// The chart is loaded as a separate chunk so the rest of the app does not pay the WebGL download cost.
export default function ProductivityScene({ days }) {
  const hostRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    setFallback(false);
    let renderer;
    let observer;
    let pointerFrame = 0;
    let disposed = false;
    let draw;
    let handleMove;
    let handleLeave;
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    scene.add(group);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 2.15));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
      keyLight.position.set(-4, 8, 6);
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x9ed9b7, 18, 15);
      fillLight.position.set(3, 3, 4);
      scene.add(fillLight);

      const maxCount = Math.max(1, ...days.map((day) => day.count));
      const boxGeometry = new THREE.BoxGeometry(0.48, 1, 0.48);
      days.forEach((day, index) => {
        // Keep a readable 3D column for zero days too; the live count is printed below each bar.
        const height = day.count ? Math.max(0.3, (day.count / maxCount) * 2.2) : 0.24;
        const material = new THREE.MeshStandardMaterial({
          color: day.count ? 0x70d596 : 0x477357,
          roughness: 0.29,
          metalness: 0.05,
        });
        const bar = new THREE.Mesh(boxGeometry, material);
        bar.scale.y = height;
        bar.position.set((index - (days.length - 1) / 2) * 0.91, height / 2, 0);
        group.add(bar);
      });

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.045, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x26392e, roughness: 0.55, metalness: 0.02 })
      );
      base.position.set(0, -0.025, 0);
      group.add(base);

      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
      camera.position.set(0, 5.4, 11.6);
      camera.lookAt(0, 0.9, 0);
      draw = () => {
        if (disposed) return;
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };

      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(draw);
        observer.observe(host);
      } else {
        window.addEventListener('resize', draw);
      }
      draw();

      handleMove = (event) => {
        const rect = host.getBoundingClientRect();
        group.rotation.y = ((event.clientX - rect.left) / rect.width - 0.5) * 0.16;
        group.rotation.x = ((event.clientY - rect.top) / rect.height - 0.5) * -0.06;
        if (!pointerFrame) pointerFrame = requestAnimationFrame(() => { pointerFrame = 0; draw(); });
      };
      handleLeave = () => {
        group.rotation.set(0, 0, 0);
        if (pointerFrame) cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
        draw();
      };
      host.addEventListener('pointermove', handleMove, { passive: true });
      host.addEventListener('pointerleave', handleLeave);
    } catch {
      setFallback(true);
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      if (draw) window.removeEventListener('resize', draw);
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      if (handleMove) host.removeEventListener('pointermove', handleMove);
      if (handleLeave) host.removeEventListener('pointerleave', handleLeave);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [days]);

  const maxCount = Math.max(1, ...days.map((day) => day.count));
  return (
    <div className="pulse-scene-wrap">
      <div className="pulse-three" ref={hostRef} />
      {fallback && (
        <div className="pulse-fallback-bars" aria-hidden="true">
          {days.map((day) => <span key={day.date} title={`${day.count} completed`} style={{ height: `${Math.max(5, day.count ? (day.count / maxCount) * 100 : 5)}%` }} />)}
        </div>
      )}
      <div className="pulse-axis" aria-hidden="true">
        {days.map((day) => <span key={day.date}><b>{day.count}</b><small>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })}</small></span>)}
      </div>
      <div className="pulse-legend"><i /> Completed tasks <span className="pulse-interaction">{fallback ? '3D unavailable; compatible chart shown' : 'Move pointer to explore'}</span></div>
    </div>
  );
}
