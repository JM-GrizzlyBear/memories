// A photo drawn as a background: while it loads, or if it can't load, the
// element's own background color shows, and no broken-image icon appears
export function Photo({ src, className }: { src: string; className: string }) {
  return (
    <div
      className={`bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url("${src}")` }}
    />
  );
}
