/**
 * Single source of truth for whether a real hero GLB ships (DEC-027).
 *
 * `public/models/scene.glb` is currently a 92-byte placeholder scene on which
 * `GLTFLoader` still succeeds — so without this gate the page would report the
 * scene "ready" and pay the ~203 KB gzip Three.js/GSAP/Lenis cost to render an
 * empty canvas. While this is `false`, the hero renders the static `<Wordmark>`
 * instead and the 3D runtime is never fetched.
 *
 * SWBE-78 flips this to `true` once the production model is committed — that
 * one-line change is the entire hand-off, no other code needs to change.
 */
export const HAS_HERO_MODEL = false;
