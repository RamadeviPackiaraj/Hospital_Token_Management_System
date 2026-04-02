import Link from "next/link";
import { Card } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="ui-body text-[#0EA5A4]">404</p>
        <h1 className="mt-2 ui-page-title">Page not found</h1>
        <p className="mt-3 ui-body-secondary">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="focus-ring mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-[#0EA5A4] bg-[#0EA5A4] px-4 text-sm font-medium leading-5 text-white transition hover:border-[#0b8b8b] hover:bg-[#0b8b8b]"
        >
          Back to Home
        </Link>
      </Card>
    </main>
  );
}
