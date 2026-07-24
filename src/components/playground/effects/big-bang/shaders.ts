// BIG BANG's two shader pieces (DEC-032), both driven by the impact pool in impact.ts.
//
// The effect renders the real chrome wordmark — the same GLB, rig and material as the
// home hero (PG-26) — and deforms it locally where it was clicked. That is the whole
// reason the first cut looked wrong: it never added the mesh to the scene at all, only a
// flat-coloured point cloud standing in for it.
//
// 1. CHROME_IMPACT_CHUNKS patch the stock MeshStandardMaterial through onBeforeCompile,
//    so the chrome keeps its PBR shading, environment map and tone mapping — only the
//    vertex positions move.
// 2. The debris pair draws the sparks each impact throws off.

import { MAX_CONCURRENT_IMPACTS } from "./impact";

/**
 * Injected into MeshStandardMaterial's vertex program. `uImpacts` carries one vec4 per
 * pool slot — xyz is the hit point in *this mesh's* local space, w is the current
 * strength from `burstEnvelope`. A spent slot has w = 0 and costs a single compare.
 *
 * Vertices are pushed away from the hit point rather than along their own normal: a
 * normal-only push inflates the patch evenly and reads as a blister, while pushing away
 * from the impact throws the near side outward the way something struck would go. The
 * normal is still mixed in so faces perpendicular to the blast do not shear flat.
 */
export const CHROME_IMPACT_CHUNKS = {
  declaration: /* glsl */ `
    uniform vec4 uImpacts[${MAX_CONCURRENT_IMPACTS}];
    uniform float uImpactRadius;
    uniform float uImpactAmplitude;
  `,
  displacement: /* glsl */ `
    vec3 transformed = vec3(position);

    for (int i = 0; i < ${MAX_CONCURRENT_IMPACTS}; i++) {
      float strength = uImpacts[i].w;
      if (strength <= 0.0) continue;

      vec3 away = transformed - uImpacts[i].xyz;
      float distance = length(away);
      if (distance > uImpactRadius) continue;

      // 1 at the hit point, 0 at the rim — smoothstep so the patch blends into the
      // untouched surface instead of leaving a visible crease around it.
      float falloff = 1.0 - smoothstep(0.0, uImpactRadius, distance);
      vec3 direction = normalize(mix(normal, away / max(distance, 0.0001), 0.75));
      transformed += direction * falloff * strength * uImpactAmplitude;
    }
  `,
};

/**
 * Debris. One burst is a Points cloud parked at the hit point, every particle flying
 * along its own direction at its own speed; `uProgress` runs 0→1 over the impact's life.
 * Particles carry their own brand colour so the sparks read as lemon/tangerine/paper
 * rather than as one flat wash.
 */
export const DEBRIS_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aDirection;
  attribute float aSpeed;
  attribute vec3 aColor;

  uniform float uProgress;
  uniform float uSpread;
  uniform float uPointSize;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Ease-out travel: sparks leave at the speed of the impact and coast to a stop.
    float travel = 1.0 - (1.0 - uProgress) * (1.0 - uProgress);
    vec3 pos = position + aDirection * aSpeed * uSpread * travel;

    // Full strength while they leave, gone by the time the surface has settled.
    vAlpha = 1.0 - smoothstep(0.45, 1.0, uProgress);
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    // Perspective attenuation: uPointSize is the on-screen size at one world unit away,
    // so a spark shrinks as it travels instead of ballooning across the viewport.
    gl_PointSize = uPointSize / max(-mvPosition.z, 0.001);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const DEBRIS_FRAGMENT_SHADER = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    float edge = smoothstep(0.5, 0.32, dist);
    gl_FragColor = vec4(vColor, edge * vAlpha);
  }
`;
