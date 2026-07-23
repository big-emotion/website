// The shared gesture-reporting seam every Playground effect calls into. Counter
// transport (aggregating/persisting these) is a separate story — this module only
// dispatches a DOM event so that story's listener can subscribe without this effect
// needing to know how, or whether, interactions end up counted.

export type PlaygroundInteraction = "grab" | "throw" | "bounce";

export type PlaygroundInteractionDetail = {
  effectId: string;
  interaction: PlaygroundInteraction;
};

export const PLAYGROUND_INTERACTION_EVENT = "playground:interaction";

export function reportInteraction(effectId: string, interaction: PlaygroundInteraction): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<PlaygroundInteractionDetail>(PLAYGROUND_INTERACTION_EVENT, {
      detail: { effectId, interaction },
    }),
  );
}
