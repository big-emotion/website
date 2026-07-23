// BIG BANG's attribute-driven Points shader (DEC-032): a single vertex/fragment pair
// drives both destruction and rebirth off one `uProgress` uniform (0 = assembled,
// 1 = fully exploded) — reassemble is just this same shader animated back down to 0,
// so there is no second "reassemble" shader to keep in sync with the first.
//
// Per-particle motion lives in vertex attributes computed once when the geometry is
// built (see big-bang-effect.tsx): `aTarget` is where MeshSurfaceSampler's sampled
// surface point ends up at full explode, `aDelay` staggers particles outward from the
// tap's impact point so the shatter reads as a shockwave rather than every particle
// moving in lockstep.

export const BIG_BANG_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aDelay;

  uniform float uProgress;
  uniform float uPointSize;
  uniform float uTime;

  varying float vAlpha;

  void main() {
    // Each particle's own 0..1 explode timeline is a slice of uProgress starting at
    // its delay, so particles further from the impact point (higher aDelay) lag
    // behind — the shockwave read.
    float local = clamp((uProgress - aDelay) / max(1.0 - aDelay, 0.0001), 0.0, 1.0);
    float eased = local * local * (3.0 - 2.0 * local); // smoothstep ease, no extra uniform

    vec3 pos = mix(position, aTarget, eased);
    // Subtle drift while scattered so fully-exploded particles don't freeze mid-air.
    pos += sin(uTime * 1.5 + aDelay * 6.2831853) * 0.002 * eased;

    vAlpha = 1.0 - 0.4 * eased;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const BIG_BANG_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;

  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    float edge = smoothstep(0.5, 0.35, dist);
    gl_FragColor = vec4(uColor, edge * vAlpha);
  }
`;
