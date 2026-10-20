import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./ASCIIText.css";

const vertexShader = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 5.0;
    float waveFactor = uEnableWaves;

    vec3 transformed = position;
    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    float time = uTime;
    vec2 pos = vUv;
    
    float r = texture2D(uTexture, pos + cos(time * 2.0 - time + pos.x) * 0.01).r;
    float g = texture2D(uTexture, pos + tan(time * 0.5 + pos.x - time) * 0.01).g;
    float b = texture2D(uTexture, pos - cos(time * 2.0 + time + pos.y) * 0.01).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`;

function mapVal(n, start, stop, start2, stop2) {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
}

const PX_RATIO = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

class AsciiFilter {
  constructor(renderer, { fontSize = 10, fontFamily = '"IBM Plex Mono", monospace', charset, invert = true } = {}) {
    this.renderer = renderer;
    this.domElement = document.createElement("div");
    this.domElement.style.position = "absolute";
    this.domElement.style.inset = "0";
    this.domElement.style.width = "100%";
    this.domElement.style.height = "100%";
    this.domElement.style.pointerEvents = "none";
    this.domElement.style.overflow = "hidden";

    this.pre = document.createElement("pre");
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "none";
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.domElement.appendChild(this.canvas);

    this.deg = 0;
    this.invert = invert;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.charset = charset || ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

    if (this.context) {
      this.context.imageSmoothingEnabled = false;
    }

    this.width = 0;
    this.height = 0;
    this.center = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 };

    this.onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener("mousemove", this.onMouseMove, { passive: true });
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.reset();

    this.center = { x: width / 2, y: height / 2 };
    this.mouse = { x: this.center.x, y: this.center.y };
  }

  reset() {
    if (this.context && this.width > 0 && this.height > 0) {
      this.context.font = `${this.fontSize}px ${this.fontFamily}`;
      const charWidth = this.context.measureText("A").width || this.fontSize * 0.6;

      this.cols = Math.max(Math.floor(this.width / charWidth), 10);
      this.rows = Math.max(Math.floor(this.height / this.fontSize), 10);

      this.canvas.width = this.cols;
      this.canvas.height = this.rows;

      this.pre.style.fontFamily = this.fontFamily;
      this.pre.style.fontSize = `${this.fontSize}px`;
    }
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);

    const w = this.canvas.width;
    const h = this.canvas.height;
    if (this.context && w > 0 && h > 0) {
      this.context.clearRect(0, 0, w, h);
      this.context.drawImage(this.renderer.domElement, 0, 0, w, h);
      this.asciify(this.context, w, h);
      this.hue();
    }
  }

  onMouseMove(e) {
    this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO };
  }

  get dx() {
    return this.mouse.x - this.center.x;
  }

  get dy() {
    return this.mouse.y - this.center.y;
  }

  hue() {
    const deg = (Math.atan2(this.dy, this.dx) * 180) / Math.PI;
    this.deg += (deg - this.deg) * 0.075;
    this.domElement.style.filter = `hue-rotate(${this.deg.toFixed(1)}deg)`;
  }

  asciify(ctx, w, h) {
    if (w && h && ctx) {
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let str = "";
      const len = this.charset.length - 1;

      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = (x + y * w) * 4;
          const a = imgData[i + 3];

          if (a === 0) {
            str += " ";
            continue;
          }

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          let idx = Math.floor((1 - gray) * len);
          if (this.invert) idx = len - idx;
          str += this.charset[idx] || " ";
        }
        str += "\n";
      }
      this.pre.textContent = str;
    }
  }

  dispose() {
    window.removeEventListener("mousemove", this.onMouseMove);
  }
}

class CanvasTxt {
  constructor(txt, { fontSize = 200, fontFamily = '"IBM Plex Mono", monospace', color = "#ffffff" } = {}) {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.txt = txt;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.color = color;
    this.font = `600 ${this.fontSize}px ${this.fontFamily}`;
  }

  resize() {
    if (this.context) {
      this.context.font = this.font;
      const metrics = this.context.measureText(this.txt);
      const textWidth = Math.ceil(metrics.width) + 30;
      const ascent = metrics.actualBoundingBoxAscent || this.fontSize * 0.8;
      const descent = metrics.actualBoundingBoxDescent || this.fontSize * 0.2;
      const textHeight = Math.ceil(ascent + descent) + 30;

      this.canvas.width = Math.max(textWidth, 60);
      this.canvas.height = Math.max(textHeight, 60);
    }
  }

  render() {
    if (this.context && this.canvas.width > 0 && this.canvas.height > 0) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = this.color;
      this.context.font = this.font;

      const metrics = this.context.measureText(this.txt);
      const ascent = metrics.actualBoundingBoxAscent || this.fontSize * 0.8;
      const yPos = 15 + ascent;

      this.context.fillText(this.txt, 15, yPos);
    }
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  get texture() {
    return this.canvas;
  }
}

class CanvAscii {
  constructor(
    { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
    containerElem,
    width,
    height
  ) {
    this.textString = text;
    this.asciiFontSize = asciiFontSize;
    this.textFontSize = textFontSize;
    this.textColor = textColor;
    this.planeBaseHeight = planeBaseHeight;
    this.container = containerElem;
    this.width = width;
    this.height = height;
    this.enableWaves = enableWaves;

    this.camera = new THREE.PerspectiveCamera(45, this.width / Math.max(this.height, 1), 1, 1000);
    this.camera.position.z = 30;

    this.scene = new THREE.Scene();
    this.mouse = { x: this.width / 2, y: this.height / 2 };
    this.animationFrameId = 0;

    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async init() {
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ]);
      }
    } catch {
      /* noop */
    }
    this.setMesh();
    this.setRenderer();
  }

  setMesh() {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: '"IBM Plex Mono", monospace',
      color: this.textColor,
    });
    this.textCanvas.resize();
    this.textCanvas.render();

    this.texture = new THREE.CanvasTexture(this.textCanvas.texture);
    this.texture.minFilter = THREE.NearestFilter;

    const textAspect = this.textCanvas.width / Math.max(this.textCanvas.height, 1);
    const baseH = this.planeBaseHeight;
    const planeW = baseH * textAspect;
    const planeH = baseH;

    this.geometry = new THREE.PlaneGeometry(planeW, planeH, 36, 36);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 1.0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 },
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: this.asciiFontSize,
      invert: true,
    });

    this.container.appendChild(this.filter.domElement);
    this.setSize(this.width, this.height);

    this.container.addEventListener("mousemove", this.onMouseMove, { passive: true });
    this.container.addEventListener("touchmove", this.onMouseMove, { passive: true });
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;

    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();

    this.filter.setSize(w, h);
    this.center = { x: w / 2, y: h / 2 };
  }

  load() {
    this.animate();
  }

  onMouseMove(evt) {
    const e = evt.touches ? evt.touches[0] : evt;
    const bounds = this.container.getBoundingClientRect();
    this.mouse = {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };
  }

  animate() {
    const animateFrame = () => {
      this.animationFrameId = requestAnimationFrame(animateFrame);
      this.render();
    };
    animateFrame();
  }

  render() {
    const time = performance.now() * 0.001;

    this.textCanvas.render();
    this.texture.needsUpdate = true;

    if (this.mesh?.material) {
      this.mesh.material.uniforms.uTime.value = Math.sin(time);
    }

    this.updateRotation();
    this.filter.render(this.scene, this.camera);
  }

  updateRotation() {
    const x = mapVal(this.mouse.y, 0, this.height, 0.4, -0.4);
    const y = mapVal(this.mouse.x, 0, this.width, -0.4, 0.4);

    if (this.mesh) {
      this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.05;
      this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.05;
    }
  }

  clear() {
    this.scene.traverse((object) => {
      if (!object.isMesh) return;
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
      if (object.geometry) {
        object.geometry.dispose();
      }
    });
    this.scene.clear();
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.filter) {
      this.filter.dispose();
      if (this.filter.domElement?.parentNode) {
        this.container.removeChild(this.filter.domElement);
      }
    }
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("touchmove", this.onMouseMove);
    this.clear();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
    }
  }
}

export default function ASCIIText({
  text = "404",
  asciiFontSize = 8,
  textFontSize = 200,
  textColor = "#ffffff",
  planeBaseHeight = 8,
  enableWaves = true,
  textGradient,
  className = "",
}) {
  const containerRef = useRef(null);
  const asciiRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    let observer = null;
    let ro = null;

    const createAndInit = async (cont, w, h) => {
      const instance = new CanvAscii(
        { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
        cont,
        w,
        h
      );
      await instance.init();
      return instance;
    };

    const setup = async () => {
      const { width, height } = container.getBoundingClientRect();

      if (width === 0 || height === 0) {
        observer = new IntersectionObserver(
          async ([entry]) => {
            if (cancelled) return;
            if (entry.isIntersecting && entry.boundingClientRect.width > 0 && entry.boundingClientRect.height > 0) {
              const { width: w, height: h } = entry.boundingClientRect;
              observer?.disconnect();
              observer = null;

              if (!cancelled) {
                asciiRef.current = await createAndInit(container, w, h);
                if (!cancelled && asciiRef.current) {
                  asciiRef.current.load();
                }
              }
            }
          },
          { threshold: 0.1 }
        );
        observer.observe(container);
        return;
      }

      asciiRef.current = await createAndInit(container, width, height);
      if (!cancelled && asciiRef.current) {
        asciiRef.current.load();

        ro = new ResizeObserver((entries) => {
          if (!entries[0] || !asciiRef.current) return;
          const { width: w, height: h } = entries[0].contentRect;
          if (w > 0 && h > 0) {
            asciiRef.current.setSize(w, h);
          }
        });
        ro.observe(container);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (ro) ro.disconnect();
      if (asciiRef.current) {
        asciiRef.current.dispose();
        asciiRef.current = null;
      }
    };
  }, [text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves]);

  const defaultGradient =
    "linear-gradient(135deg, #1C44B6 0%, #2F6BFF 40%, #0284C7 80%, #38BDF8 100%)";

  return (
    <div
      ref={containerRef}
      className={`ascii-text-container ${className}`.trim()}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <style>{`
        .ascii-text-container pre {
          background-image: ${textGradient || defaultGradient};
        }
      `}</style>
    </div>
  );
}
