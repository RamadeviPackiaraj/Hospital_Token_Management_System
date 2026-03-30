import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-[#0EA5A4]">404</p>
        <h1 className="mt-2 text-2xl font-medium text-[#0F172A]">Page not found</h1>
        <p className="mt-3 text-sm text-[#64748B]">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="focus-ring mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#0EA5A4] px-5 text-sm font-medium text-white transition hover:bg-[#0d9488]"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
