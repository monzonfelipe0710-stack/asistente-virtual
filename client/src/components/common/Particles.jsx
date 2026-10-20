import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh } from "ogl";

const defaultColors = ["#2f6bff", "#60a5fa", "#93c5fd"];

const hexToRgb = (hex) => {
  if (!hex) return [1, 1, 1];
  const clean = hex.replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(int)) return [1, 1, 1];
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uScrollY;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  uniform float uFrustumHalfH;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position;
    
    // Suave oscilación orbital horizontal
    pos.x += sin(uTime * 0.4 + random.z * 6.28318) * 0.25;
    
    // Wrap-around infinito en toda la altura con deriva natural continua y paralaje de scroll
    float totalH = uFrustumHalfH * 2.6;
    float drift = uTime * 0.1;
    float py = pos.y + drift - uScrollY * (0.65 + random.w * 0.45);
    py = mod(py + totalH * 0.5, totalH) - totalH * 0.5;
    pos.y = py + cos(uTime * 0.35 + random.x * 6.28318) * 0.2;
    
    vec4 mvPos = viewMatrix * modelMatrix * vec4(pos, 1.0);
    
    // Centelleo orgánico suave
    vTwinkle = 0.8 + 0.2 * sin(uTime * 1.7 + random.y * 6.28318);
    
    // Tamaño con atenuación de perspectiva sin desbordar
    float pSize = uBaseSize * (0.85 + uSizeRandomness * random.x);
    gl_PointSize = clamp(pSize * (18.0 / -mvPos.z), 3.0, 36.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    // Núcleo nítido y halo radiante sin 'discard' para evitar penalización de GPU
    float core = clamp(1.0 - d * 3.0, 0.0, 1.0);
    float aura = clamp(1.0 - d * 2.0, 0.0, 1.0);
    float alpha = (core * 0.55 + aura * aura * 0.45) * vTwinkle;
    
    gl_FragColor = vec4(vColor, alpha * 0.85);
  }
`;

export default function Particles({
  particleCount = 280,
  speed = 0.06,
  particleColors,
  moveParticlesOnHover = true,
  particleHoverFactor = 0.5,
  particleBaseSize = 16,
  sizeRandomness = 0.75,
  cameraDistance = 18,
  disableRotation = false,
  pixelRatio = 1,
  className = "",
}) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const meshRef = useRef(null);
  const colorsRef = useRef(particleColors);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const effectiveDpr = pixelRatio || 1;
    let renderer;
    try {
      renderer = new Renderer({
        dpr: effectiveDpr,
        depth: false,
        stencil: false,
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return undefined;
    }

    const gl = renderer.gl;
    if (!gl) return undefined;

    gl.canvas.style.position = "absolute";
    gl.canvas.style.inset = "0";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.pointerEvents = "none";
    gl.canvas.style.transform = "translateZ(0)";
    gl.canvas.style.willChange = "transform";
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 30 });
    camera.position.set(0, 0, cameraDistance);

    const calcFrustumHalfH = () => cameraDistance * Math.tan((30 * Math.PI) / 360);

    const resize = () => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      renderer.setSize(width, height);
      camera.perspective({ fov: 30, aspect: width / height });
      if (program?.uniforms?.uFrustumHalfH) {
        program.uniforms.uFrustumHalfH.value = calcFrustumHalfH();
      }
    };

    window.addEventListener("resize", resize, { passive: true });

    // Coordenadas normalizadas pasivas para cero layout thrashing
    const handleMouseMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseRef.current.targetX = (e.clientX / w) * 2 - 1;
      mouseRef.current.targetY = -((e.clientY / h) * 2 - 1);
    };

    if (moveParticlesOnHover) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    let targetScrollY = typeof window !== "undefined" ? window.scrollY || 0 : 0;
    const handleScroll = () => {
      targetScrollY = window.scrollY || 0;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    const palette = colorsRef.current && colorsRef.current.length > 0 ? colorsRef.current : defaultColors;

    const aspect = (window.innerWidth || 1) / (window.innerHeight || 1);
    const frustumHalfH = calcFrustumHalfH();
    const frustumHalfW = frustumHalfH * Math.max(aspect, 1.25);

    for (let i = 0; i < count; i += 1) {
      // Distribución uniforme exacta en el frustum visible de la cámara
      const x = (Math.random() * 2 - 1) * frustumHalfW * 1.25;
      const y = (Math.random() * 2 - 1) * frustumHalfH * 1.35;
      const z = (Math.random() * 2 - 1) * 2.8;
      
      positions.set([x, y, z], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
      colors.set(col, i * 3);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: colors, usage: gl.DYNAMIC_DRAW },
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uScrollY: { value: targetScrollY * 0.0022 },
        uFrustumHalfH: { value: frustumHalfH },
        uBaseSize: { value: particleBaseSize * effectiveDpr },
        uSizeRandomness: { value: sizeRandomness },
      },
      transparent: true,
      depthTest: false,
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    meshRef.current = { particles, geometry, palette };

    resize();

    let animationFrameId;
    let lastTime = performance.now();
    let elapsed = 0;
    let currentScrollY = targetScrollY;

    const update = (t) => {
      if (document.hidden) {
        lastTime = t;
        if (!reducedMotion) {
          animationFrameId = requestAnimationFrame(update);
        }
        return;
      }
      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(update);
      }
      const delta = Math.min(t - lastTime, 100);
      lastTime = t;
      elapsed += delta * speed;

      program.uniforms.uTime.value = elapsed * 0.001;

      // Lerp suave del paralaje de scroll
      currentScrollY += (targetScrollY - currentScrollY) * 0.08;
      program.uniforms.uScrollY.value = currentScrollY * 0.0022;

      if (moveParticlesOnHover) {
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
        particles.position.x = -mouseRef.current.x * particleHoverFactor;
        particles.position.y = -mouseRef.current.y * particleHoverFactor;
      } else {
        particles.position.x = 0;
        particles.position.y = 0;
      }

      if (!disableRotation) {
        particles.rotation.x = Math.sin(elapsed * 0.00015) * 0.06;
        particles.rotation.y = Math.cos(elapsed * 0.00025) * 0.08;
        particles.rotation.z += 0.004 * speed;
      }

      renderer.render({ scene: particles, camera });
    };

    if (reducedMotion) {
      update(performance.now());
    } else {
      animationFrameId = requestAnimationFrame(update);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (moveParticlesOnHover) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
      meshRef.current = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    particleCount,
    speed,
    moveParticlesOnHover,
    particleHoverFactor,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    disableRotation,
    pixelRatio,
  ]);

  // Actualización ultra-fluida de la paleta en el buffer GPU sin destruir el contexto WebGL
  useEffect(() => {
    colorsRef.current = particleColors;
    if (!meshRef.current?.geometry) return;
    const { geometry } = meshRef.current;
    const colorAttr = geometry.attributes.color;
    if (!colorAttr?.data) return;

    const palette = particleColors && particleColors.length > 0 ? particleColors : defaultColors;
    const colors = colorAttr.data;
    const count = colors.length / 3;

    for (let i = 0; i < count; i += 1) {
      const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];
    }
    colorAttr.needsUpdate = true;
  }, [particleColors]);

  return (
    <div
      ref={containerRef}
      style={{ contain: "strict" }}
      className={`relative w-full h-full pointer-events-none ${className}`}
    />
  );
}
