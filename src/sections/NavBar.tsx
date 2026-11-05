import { LogoLockup } from "@/components/ui/Logo";
import { DashboardMenu } from "@/sections/DashboardMenu";

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Technology", href: "#technology" },
  { label: "Validation", href: "#validation" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Contact", href: "#contact" }
];

export function NavBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(7,17,31,0.9)] shadow-[0_16px_44px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a className="flex items-center transition duration-300 hover:opacity-90" href="#home" aria-label="Neuvara home">
          <LogoLockup />
        </a>
        <div className="flex items-center gap-5 lg:gap-7">
          <div className="hidden items-center gap-5 md:flex lg:gap-7">
            {navItems.map((item) => (
              <a
                className="nav-link text-sm font-medium text-slate-300 transition duration-300 hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
          <DashboardMenu />
        </div>
      </nav>
      <div className="border-t border-white/10 md:hidden">
        <nav
          aria-label="Mobile navigation"
          className="mx-auto flex max-w-7xl justify-between gap-2 overflow-x-auto px-3 py-3 text-[0.56rem] font-semibold uppercase tracking-[0.04em] text-slate-300 sm:px-8"
        >
          {navItems.map((item) => (
            <a
              className="shrink-0 transition duration-300 hover:text-white focus-visible:text-white focus-visible:outline-none"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
