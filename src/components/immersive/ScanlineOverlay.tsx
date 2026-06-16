export function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[30] opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay scanlines"
      aria-hidden
    />
  );
}
