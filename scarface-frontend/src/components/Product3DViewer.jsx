import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Reveal from "./Reveal";
import { chargerModels } from "../data/imageAssets";

const ROTATION_INTERVAL = 2000;
const RESUME_DELAY = 5000;

export default function Product3DViewer() {
  const reduce = useReducedMotion();
  const viewerRef = useRef(null);
  const isInView = useInView(viewerRef, { amount: 0.3 });
  const [modelId, setModelId] = useState(chargerModels[0].id);
  const [viewIndex, setViewIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedAngle, setSelectedAngle] = useState(null);
  const [selection, setSelection] = useState(null);
  const [failedView, setFailedView] = useState(null);
  const dragStart = useRef(null);
  const resumeTimer = useRef(null);
  const model = chargerModels.find(({ id }) => id === modelId);
  const view = model.views[viewIndex];
  const autoRotating = isInView && !reduce && !paused && !interacting;
  const viewKey = `${model.id}-${viewIndex}`;

  useEffect(() => {
    if (!autoRotating || selection) return undefined;
    const timer = window.setInterval(() => {
      setViewIndex((index) => (index + 1) % model.views.length);
    }, ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [autoRotating, model.views.length, selection]);

  useEffect(() => {
    if (!selection) return undefined;
    let elapsed = 0;
    const cycleTransitions = model.views.length * 2;
    const timer = window.setInterval(() => {
      elapsed += 1;
      setViewIndex((currentIndex) => {
        if (elapsed <= cycleTransitions) {
          return (currentIndex + 1) % model.views.length;
        }
        const distance = (selection.targetIndex - currentIndex + model.views.length) % model.views.length;
        if (distance === 0) {
          window.clearInterval(timer);
          setSelection(null);
          setSelectedAngle(selection.angle);
          return currentIndex;
        }
        return (currentIndex + 1) % model.views.length;
      });
    }, ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [selection, model.views.length]);

  useEffect(() => {
    setFailedView(null);
  }, [viewKey]);

  useEffect(() => {
    if (!autoRotating) return undefined;
    const nextView = model.views[(viewIndex + 1) % model.views.length];
    const image = new Image();
    image.src = nextView.src;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [autoRotating, model, viewIndex]);

  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  const registerInteraction = () => {
    if (reduce || paused || !isInView) return;
    setInteracting(true);
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setInteracting(false), RESUME_DELAY);
  };

  const selectView = (index) => {
    setSelection(null);
    setSelectedAngle(null);
    setViewIndex(index);
    registerInteraction();
  };

  const selectAngle = (angle) => {
    const targetIndex = model.views.findIndex((item) => item.angle === angle);
    if (targetIndex < 0) return;
    setSelection({
      angle,
      targetIndex,
      modelId: model.id,
    });
    setInteracting(false);
  };

  const moveView = (direction) => {
    setSelection(null);
    setSelectedAngle(null);
    setViewIndex((index) => (index + direction + model.views.length) % model.views.length);
    registerInteraction();
  };

  const togglePause = () => {
    window.clearTimeout(resumeTimer.current);
    setSelection(null);
    setInteracting(false);
    setPaused((value) => !value);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    registerInteraction();
  };

  const onPointerMove = (event) => {
    if (dragStart.current === null) return;
    const distance = event.clientX - dragStart.current;
    if (Math.abs(distance) < 44) return;
    dragStart.current = event.clientX;
    moveView(distance < 0 ? 1 : -1);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveView(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveView(-1);
    }
  };

  return (
    <section className="dark" id="viewer">
      <div className="wrap two">
        <Reveal>
          <div className="eyebrow">Explore</div>
          <h2>See it from every angle</h2>
          <p className="lead">Browse the supplied product photos. This is an image-based viewer, not a 3D model.</p>
          <div className="viewer-models" role="group" aria-label="Charger model">
            {chargerModels.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={model.id === item.id}
                className={`btn ghost sm${model.id === item.id ? " selected" : ""}`}
                onClick={() => {
                  setSelection(null);
                  setSelectedAngle(null);
                  setModelId(item.id);
                  setViewIndex(0);
                  registerInteraction();
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="vctl">
            <div className="viewer-controls">
              <button
                type="button"
                className="btn ghost sm"
                onClick={togglePause}
                disabled={Boolean(reduce)}
                aria-label={reduce
                  ? "Automatic rotation disabled by reduced-motion setting"
                  : paused ? "Resume automatic rotation" : "Pause automatic rotation"}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
                {reduce ? "Auto-rotation off" : paused ? "Resume" : "Pause"}
              </button>
              <span className="viewer-count" aria-live="polite">
                {viewIndex + 1} / {model.views.length} · {view.label}
              </span>
            </div>
            <div className="viewer-navigation" aria-label="Choose a charger view">
              <button type="button" className="view-arrow" aria-label="Previous view" onClick={() => moveView(-1)}>
                <ChevronLeft size={18} />
              </button>
              <div className="view-dots">
                {model.views.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`view-dot${index === viewIndex ? " active" : ""}`}
                    aria-label={`Show ${item.label} view`}
                    aria-pressed={index === viewIndex}
                    onClick={() => selectView(index)}
                  />
                ))}
              </div>
              <button type="button" className="view-arrow" aria-label="Next view" onClick={() => moveView(1)}>
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="angle-controls" role="group" aria-label="Choose product viewing angle">
              {["Front", "Side", "Back"].map((angle) => {
                const available = model.views.some((item) => item.angle === angle);
                return (
                  <button
                    key={angle}
                    type="button"
                    className={`angle-button${selectedAngle === angle ? " active" : ""}`}
                    aria-pressed={selectedAngle === angle}
                    disabled={!available}
                    onClick={() => selectAngle(angle)}
                  >
                    {angle.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <div className="zoom-control">
              <label htmlFor="viewer-zoom">Zoom</label>
              <input
                id="viewer-zoom"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                aria-valuetext={`${Math.round(zoom * 100)} percent`}
              />
              <output htmlFor="viewer-zoom">{Math.round(zoom * 100)}%</output>
            </div>
            <p className="viewer-note">
              {reduce
                ? "Automatic rotation is disabled by your reduced-motion setting."
                : "Each supplied view is shown for 2 seconds. Drag or use the controls to browse."}
            </p>
          </div>
        </Reveal>
        <div
          className="stage3d"
          ref={viewerRef}
          data-model={model.id}
          data-view-index={viewIndex}
          role="group"
          aria-label={`${model.name} photos. Drag left or right to change view.`}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => { dragStart.current = null; }}
          onPointerCancel={() => { dragStart.current = null; }}
          onKeyDown={onKeyDown}
        >
          <AnimatePresence initial={false} mode="sync">
            {failedView !== viewKey ? (
              <motion.img
                key={viewKey}
                className="viewer-image"
                style={{ transform: `scale(${zoom})` }}
                src={view.src}
                alt={`ScarfaceEV ${model.name}: ${view.label} view`}
                loading={viewIndex === 0 && isInView ? "eager" : "lazy"}
                decoding="async"
                draggable="false"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: "easeInOut" }}
                onError={() => setFailedView(viewKey)}
              />
            ) : (
              <div key={viewKey} className="viewer-error" role="alert">
                This product photo could not be loaded.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
