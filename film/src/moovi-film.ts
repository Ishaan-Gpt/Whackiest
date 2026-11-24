// Deterministic Moovi for films: the same SDF shader as the product, driven by an explicit pose at time t
// (no rAF, no easing state, no random blinks), so any frame can be rendered in any order.
import { HALO_TILT, HALO_Y } from '../../../../../ishaan-gpt/moovi/packages/character/src/halo';
import { fragmentShader, vertexShader } from '../../../../../ishaan-gpt/moovi/packages/character/src/moovi/shaders';
import { QUALITY } from '../../../../../ishaan-gpt/moovi/packages/character/src/moovi/quality';
import { lerp, lerp3, mul, rotX, rotY, rotZ, type Vec3 } from '../../../../../ishaan-gpt/moovi/packages/character/src/moovi/math';

const UNIFORMS = ['uRes', 'uTime', 'uCharRot', 'uBody', 'uSq', 'uShL', 'uShR', 'uHandL', 'uHandR', 'uHaloPos', 'uHaloRot',
  'uBead', 'uBridge', 'uMorph', 'uPlayPos', 'uPlayRot', 'uLook', 'uEyeH', 'uShadow'] as const;

export interface Pose {
  wave?: number; frame?: number; think?: number; morph?: number; direct?: number; celebrate?: number; squint?: number; lean?: number;
  look?: [number, number];   // -1..1
  blink?: number;            // 0 open .. 1 closed
  squash?: number;           // extra squash impulse (landing), -1..1
  hop?: number;              // extra lift in body units
  turn?: number;             // body yaw in radians
  shadow?: number;           // 0..1 contact shadow strength multiplier
}

/** blinks on a fixed pseudo-random rhythm, so a frame at t is always the same */
export function blinkAt(t: number) {
  const period = 3.7, ph = (t + 1.3) % period;
  const p = ph / 0.15; return p < 1 ? Math.sin(p * Math.PI) : 0;
}

export class MooviFilm {
  canvas: HTMLCanvasElement; gl: WebGL2RenderingContext;
  progs: Record<'base' | 'morph', { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }>;
  constructor(size = 512, quality: 'high' | 'medium' | 'low' = 'high') {
    this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = size;
    const gl = this.canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: false })!;
    this.gl = gl;
    const q = QUALITY[quality];
    const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Moovi shader: ' + gl.getShaderInfoLog(s)); return s; };
    const build = (morph: boolean) => {
      const p = gl.createProgram()!; gl.attachShader(p, compile(gl.VERTEX_SHADER, vertexShader));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragmentShader(q, true, morph).replace("2.3*ww", "1.95*ww").replace("ta = vec3(0., .45, 0.)", "ta = vec3(0., .62, 0.)"))); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Moovi program: ' + gl.getProgramInfoLog(p));
      const u: Record<string, WebGLUniformLocation | null> = {}; for (const n of UNIFORMS) u[n] = gl.getUniformLocation(p, n);
      gl.useProgram(p); gl.uniformMatrix3fv(u.uHaloRot, false, mul(rotZ(-0.10), rotX(HALO_TILT))); return { program: p, u };
    };
    this.progs = { base: build(false), morph: build(true) };
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.clearColor(0, 0, 0, 0);
  }

  /** draw Moovi at time t with an explicit pose; returns the canvas (transparent, premultiplied) */
  render(t: number, P: Pose = {}): HTMLCanvasElement {
    const gl = this.gl, S = Math.sin;
    const b = { wave: 0, frame: 0, think: 0, morph: 0, direct: 0, celebrate: 0, squint: 0, lean: 0, ...P };
    const look = P.look ?? [0, 0];
    const bounce = 0.5 + 0.5 * S(t * 2.4), amp = 1 + 1.5 * b.celebrate;
    const body: Vec3 = [0, -0.06 + 0.08 * bounce * amp + (P.hop ?? 0), 0];
    const sq = (1 + 0.06 * S(t * 4.8) * (1 + b.celebrate)) * (1 + 0.18 * (P.squash ?? 0));
    let hL: Vec3 = [-1.24, -0.20, 0.34];
    let hR: Vec3 = [1.08, 0.40 + 0.04 * S(t * 2), 0.26];
    hR = lerp3(hR, [1.16 + 0.10 * S(t * 9), 0.72 + 0.10 * S(t * 9 + 1), 0.30], b.wave);
    hR = lerp3(hR, [1.45 + 0.03 * S(t * 3), 0.22, 0.62], b.direct);
    hL = lerp3(hL, [-0.44, 0.24 + 0.03 * S(t * 3), 1.0], b.frame);
    hR = lerp3(hR, [0.44, 0.04 + 0.03 * S(t * 3 + 1), 1.0], b.frame);
    hL = lerp3(hL, [-1.0, 0.86 + 0.08 * S(t * 8), 0.2], b.celebrate);
    hR = lerp3(hR, [1.0, 0.86 + 0.08 * S(t * 8 + 1), 0.2], b.celebrate);
    const spinRate = 0.5 + 2.6 * b.think + 1.5 * b.celebrate;
    const steps = t * spinRate, whole = Math.floor(steps), fr = steps - whole;
    const e = fr < 0.35 ? 1 - Math.pow(1 - fr / 0.35, 3) * (1 - 0.15 * Math.sin(fr / 0.35 * Math.PI)) : 1;
    const spin = (whole + e) * Math.PI / 4;
    const blink = P.blink ?? blinkAt(t);
    const { program, u } = b.morph > 0.001 ? this.progs.morph : this.progs.base;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(program);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, t);
    gl.uniformMatrix3fv(u.uCharRot, false, mul(rotX(look[1] * 0.12 + 0.14 * b.lean), rotY(look[0] * 0.35 + (P.turn ?? 0))));
    gl.uniform3f(u.uBody, ...body); gl.uniform1f(u.uSq, sq);
    gl.uniform3f(u.uShL, body[0] - 0.80, body[1] - 0.10, 0.18); gl.uniform3f(u.uShR, body[0] + 0.80, body[1] - 0.05, 0.15);
    gl.uniform3f(u.uHandL, ...hL); gl.uniform3f(u.uHandR, ...hR);
    gl.uniform3f(u.uHaloPos, 0, HALO_Y + 0.05 * S(t * 1.7) + 0.08 * bounce * amp + (P.hop ?? 0), -0.05);
    gl.uniform3f(u.uBead, Math.cos(spin) * 0.62, 0, Math.sin(spin) * 0.62);
    gl.uniform1f(u.uBridge, 0.03 + 0.5 * b.think * (0.5 + 0.5 * S(t * 2)));
    gl.uniform1f(u.uMorph, b.morph);
    gl.uniform3f(u.uPlayPos, 0.10, 0.05 + 0.10 * bounce, 0);
    gl.uniformMatrix3fv(u.uPlayRot, false, rotY(-0.45 * S(t * 0.9)));
    gl.uniform2f(u.uLook, look[0], look[1]);
    gl.uniform1f(u.uEyeH, 0.165 * (1 - 0.93 * blink) * lerp(1, 0.55, b.squint) * (1 + 0.12 * b.lean));
    gl.uniform1f(u.uShadow, Math.max(0, 1 - 0.30 * bounce * amp) * (P.shadow ?? 1));
    gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    return this.canvas;
  }
}
