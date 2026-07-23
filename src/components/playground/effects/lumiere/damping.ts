// Exponential decay for the trackball's inertial spin (DEC-035's hand-rolled
// trackball, not OrbitControls): applies one timestep of exponential decay to an
// angular velocity so a released drag eases out instead of stopping dead. `halfLife`
// is how many seconds it takes the velocity to halve, independent of frame rate.
export function applyDamping(velocity: number, dt: number, halfLife: number): number {
  return velocity * Math.pow(0.5, dt / halfLife);
}
