import { FullWidthNavbar, type FullWidthNavbarItem } from "@/components/navigation/FullWidthNavbar";

const menuItems: FullWidthNavbarItem[] = [
  { label: "Pricing", href: "#pricing" },
  { label: "Services", href: "#services", hasDropdown: true },
  { label: "Explore", href: "#explore", hasDropdown: true },
  { label: "Support", href: "#support", hasDropdown: true }
];

export default function FullWidthNavbarPage() {
  return (
    <div className="h-screen flex flex-col">
      <FullWidthNavbar items={menuItems} />

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Full-Width SaaS Navbar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              This page demonstrates a clean professional full-width navbar that stretches edge to edge,
              stays sticky, and uses light content spacing below.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Pricing</h2>
              <p className="mt-2 text-sm text-slate-600">Simple section block to show the full-width layout shell.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Services</h2>
              <p className="mt-2 text-sm text-slate-600">Content area uses only internal page padding, not a centered wrapper.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Support</h2>
              <p className="mt-2 text-sm text-slate-600">The navbar touches the screen edges and matches modern SaaS patterns.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
