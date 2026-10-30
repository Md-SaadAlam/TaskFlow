import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { workspaceApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';

const STATUS_COLORS = { Done: '#5dd18b', 'In Progress': '#69baf4', 'To Do': '#9ca8a1', Overdue: '#ff7770' };

function HtmlBars({ items }) {
  const maximum = Math.max(1, ...items.map((item) => item.count));
  return <div className="report-fallback" aria-label="Task counts chart">
    {items.map((item) => <div className="report-fallback-row" key={item.label}>
      <span>{item.label}</span><div className="report-fallback-track"><i style={{ width: `${item.count ? Math.max(4, item.count / maximum * 100) : 0}%`, background: STATUS_COLORS[item.label] || '#69baf4' }} /></div><b>{item.count}</b>
    </div>)}
  </div>;
}

function ThreeBars({ items }) {
  const hostRef = useRef(null);
  const [unavailable, setUnavailable] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    setUnavailable(false);
    setTooltip(null);
    let renderer;
    let resizeObserver;
    let resizeHandler;
    let frame = 0;
    let disposed = false;
    let visible = !document.hidden;
    let controls;
    let raycaster;
    let pointer;
    const meshes = [];
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    scene.add(group);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 2.1));
      const key = new THREE.DirectionalLight(0xffffff, 3.2);
      key.position.set(-3, 7, 6);
      scene.add(key);

      const maximum = Math.max(1, ...items.map((item) => item.count));
      const spacing = items.length > 5 ? 1.05 : 1.55;
      const geometry = new THREE.BoxGeometry(0.62, 1, 0.62);
      items.forEach((item, index) => {
        const targetHeight = item.count ? Math.max(0.18, item.count / maximum * 2.8) : 0.1;
        const material = new THREE.MeshStandardMaterial({ color: STATUS_COLORS[item.label] || '#69baf4', roughness: 0.3, metalness: 0.12, emissive: STATUS_COLORS[item.label] || '#69baf4', emissiveIntensity: 0.12 });
        const bar = new THREE.Mesh(geometry, material);
        bar.userData = { ...item, targetHeight };
        bar.scale.y = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? targetHeight : 0.015;
        bar.position.set((index - (items.length - 1) / 2) * spacing, bar.scale.y / 2, 0);
        group.add(bar);
        meshes.push(bar);
      });

      const base = new THREE.Mesh(new THREE.BoxGeometry(Math.max(5.5, items.length * spacing + 1), 0.06, 1.45), new THREE.MeshStandardMaterial({ color: '#26372f', roughness: 0.55 }));
      base.position.y = -0.04;
      group.add(base);

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
      camera.position.set(0, 5.2, Math.max(10, items.length * 1.15));
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI * 0.28;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.target.set(0, 1, 0);
      controls.update();
      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();

      resizeHandler = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const pick = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(meshes)[0];
        setTooltip(hit ? { label: hit.object.userData.label, count: hit.object.userData.count, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
      };
      const clearPick = () => setTooltip(null);
      const onVisibility = () => {
        visible = !document.hidden;
        if (visible && !frame) frame = requestAnimationFrame(draw);
        if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
      };
      let animationStart = performance.now();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function draw(now = performance.now()) {
        frame = 0;
        if (disposed || !visible) return;
        if (!reducedMotion) {
          const progress = Math.min(1, (now - animationStart) / 700);
          const eased = 1 - (1 - progress) ** 3;
          meshes.forEach((bar) => {
            bar.scale.y = Math.max(0.015, bar.userData.targetHeight * eased);
            bar.position.y = bar.scale.y / 2;
          });
        }
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(draw);
      }
      resizeHandler();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resizeHandler);
        resizeObserver.observe(host);
      }
      window.addEventListener('resize', resizeHandler);
      renderer.domElement.addEventListener('pointermove', pick);
      renderer.domElement.addEventListener('pointerleave', clearPick);
      document.addEventListener('visibilitychange', onVisibility);
      if (visible) frame = requestAnimationFrame(draw);

      return () => {
        disposed = true;
        if (frame) cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        window.removeEventListener('resize', resizeHandler);
        document.removeEventListener('visibilitychange', onVisibility);
        renderer.domElement.removeEventListener('pointermove', pick);
        renderer.domElement.removeEventListener('pointerleave', clearPick);
        controls?.dispose();
        scene.traverse((object) => {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material?.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    } catch {
      setUnavailable(true);
    }

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      controls?.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [items]);

  return <div className="report-chart-wrap">
    {unavailable ? <HtmlBars items={items} /> : <div className="report-three" ref={hostRef} role="img" aria-label={`3D chart: ${items.map((item) => `${item.label} ${item.count}`).join(', ')}`}>
      {tooltip && <div className="report-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.label}: {tooltip.count}</div>}
    </div>}
    {!unavailable && <div className="report-chart-labels">{items.map((item) => <span key={item.label}><i style={{ background: STATUS_COLORS[item.label] || '#69baf4' }} />{item.label}<b>{item.count}</b></span>)}</div>}
  </div>;
}

function Skeleton() { return <div className="glass-lg report-skeleton" role="status">Loading task report…</div>; }

export default function TaskReport3D({ workspaceId, workspaces = [], onWorkspaceChange }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(Boolean(workspaceId));
  const [error, setError] = useState('');
  const [view, setView] = useState('status');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!workspaceId) { setReport(null); setLoading(false); return undefined; }
    setLoading(true);
    setError('');
    workspaceApi.taskReport(workspaceId).then((data) => {
      if (!cancelled) setReport(data.report);
    }).catch((err) => {
      if (!cancelled) setError(getErrorMessage(err));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [workspaceId, retry]);

  const statusItems = useMemo(() => report ? [
    { label: 'Done', count: report.done },
    { label: 'In Progress', count: report.inProgress },
    { label: 'To Do', count: report.todo },
    { label: 'Overdue', count: report.overdue },
  ] : [], [report]);
  const dayItems = useMemo(() => (report?.last7Days || []).map((day) => ({
    label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
    count: day.completed,
  })), [report]);
  const notDone = report ? report.todo + report.inProgress : 0;

  if (loading) return <Skeleton />;
  if (!workspaceId) return <section className="glass-lg report-empty">Select or create a workspace to view task progress.</section>;
  if (error) return <section className="glass-lg report-error" role="alert"><p>{error}</p><button className="btn-secondary" onClick={() => setRetry((n) => n + 1)}>Retry</button></section>;
  if (!report || report.total === 0) return <section className="glass-lg report-empty"><b>No tasks yet</b><span>Create tasks in this workspace to see the report.</span></section>;

  return <section className="glass-lg task-report" aria-labelledby="task-report-title">
    <header className="report-header">
      <div><span className="pulse-kicker">WORK, IN MOTION</span><h2 id="task-report-title">Task report</h2><p>Rotate the chart by dragging. Counts update from this workspace.</p>
        {workspaces.length > 1 && <label className="report-workspace-label">Workspace <select className="input report-workspace-select" value={workspaceId} onChange={(event) => onWorkspaceChange?.(event.target.value)}>{workspaces.map((workspace) => <option key={workspace._id} value={workspace._id}>{workspace.name}</option>)}</select></label>}
      </div>
      <div className="report-completion"><strong>{report.completionPercent}<small>%</small></strong><span>complete</span></div>
    </header>
    <div className="report-stats">
      {[['Total', report.total], ['Done', report.done], ['Not done', notDone], ['Overdue', report.overdue]].map(([label, value]) => <div className="glass-sm report-stat" key={label}><span>{label}</span><b>{value}</b></div>)}
    </div>
    <div className="report-toolbar">
      <div className="report-legend">{(view === 'status' ? statusItems : dayItems).map((item) => <span key={item.label}><i style={{ background: STATUS_COLORS[item.label] || '#69baf4' }} />{item.label}</span>)}</div>
      <div className="report-toggle" role="group" aria-label="Chart view">
        <button className={view === 'status' ? 'active' : ''} onClick={() => setView('status')}>Status</button>
        <button className={view === 'days' ? 'active' : ''} onClick={() => setView('days')}>Last 7 days</button>
      </div>
    </div>
    <ThreeBars items={view === 'status' ? statusItems : dayItems} />
  </section>;
}
