let ctx: AudioContext | null = null;

/** Short two-tone notification. kind "sale" is brighter than "chat". */
export function playNotify(kind: "chat" | "sale" = "chat") {
  if (typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const notes = kind === "sale" ? [880, 1320, 1760] : [660, 990];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = "square";
      o.frequency.value = f;
      const t = ctx!.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g).connect(ctx!.destination);
      o.start(t);
      o.stop(t + 0.13);
    });
  } catch {
    /* audio blocked */
  }
}
