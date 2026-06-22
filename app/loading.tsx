export default function Loading() {
  return (
    <div
      aria-label="Chargement de la page"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-pine/10"
      role="status"
    >
      <span className="block h-full w-1/3 animate-pulse bg-pine" />
      <span className="sr-only">Chargement...</span>
    </div>
  );
}
