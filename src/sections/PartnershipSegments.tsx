export const partnershipSegments = [
  "Research institutions",
  "Clinical validation partners",
  "Hospital innovation teams",
  "Strategic and investor partners"
];

export function PartnershipSegments() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {partnershipSegments.map((segment) => (
        <a
          className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 text-sm font-semibold text-slate-200 transition hover:border-clinical-teal/60 hover:bg-white/[0.08] hover:text-white"
          href="#contact"
          key={segment}
        >
          {segment}
        </a>
      ))}
    </div>
  );
}
