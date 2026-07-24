/**
 * Single source of truth for whether a real hero GLB ships (DEC-027).
 *
 * `GLTFLoader` succeeds on an empty placeholder scene exactly as it does on a
 * real model, so "the model loaded" was never evidence that there is anything to
 * look at. This gate is that evidence. While it is `false`, the hero renders the
 * static `<Logo>` lockup and the ~203 KB gzip Three.js/GSAP/Lenis runtime is never
 * fetched.
 *
 * SWBE-78 delivered the production model (`public/models/scene.glb`, 45,592 B
 * Draco), so the gate is open. Close it again if that file ever regresses to a
 * placeholder — an open gate with nothing to render is the exact cost DEC-027
 * set out to remove.
 */
export const HAS_HERO_MODEL = true;
