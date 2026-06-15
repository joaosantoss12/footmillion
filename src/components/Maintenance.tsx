export default function Maintenance() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="flex max-w-md flex-col items-center">
        {/* Vercel-style triangle mark */}
        <svg
          aria-label="Logo"
          width="40"
          height="35"
          viewBox="0 0 76 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-10"
        >
          <path d="M37.527 0L75.054 65H0L37.527 0Z" fill="#fff" />
        </svg>

        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Down for maintenance
        </h1>

        <p className="text-base leading-relaxed text-neutral-400">
          We&apos;re currently performing scheduled maintenance. We&apos;ll be
          back online shortly. Thanks for your patience.
        </p>
      </div>

      <footer className="absolute bottom-6 text-xs text-neutral-600">
        503 — Service Temporarily Unavailable
      </footer>
    </main>
  );
}
