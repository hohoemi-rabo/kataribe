export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span
        aria-label="読み込み中"
        className="h-8 w-8 animate-spin rounded-full border-2 border-mute-dark border-t-transparent motion-reduce:animate-none"
      />
    </div>
  );
}
