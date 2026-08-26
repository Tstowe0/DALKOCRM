export default function EnquiryPage() {
  return (
    <Placeholder
      title="Enquiry"
      note="Under More per Appearance spec. Improvements backlog asks to rename to Opportunity."
    />
  );
}

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded border border-[var(--color-blue)]/15 bg-white p-8 shadow-sm">
      <h1
        className="text-2xl font-bold text-[var(--color-blue)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-blue)]/70">{note}</p>
      <p className="mt-4 text-sm text-[var(--color-blue)]/50">
        Placeholder only — section not built yet.
      </p>
    </div>
  );
}