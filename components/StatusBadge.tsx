import { clsx } from "clsx";

const tones: Record<string, string> = {
  hot: "bg-[#fee2e2] text-[#991b1b]",
  high: "bg-[#fee2e2] text-[#991b1b]",
  urgent: "bg-[#fee2e2] text-[#991b1b]",
  qualified: "bg-[#dcfce7] text-[#166534]",
  available: "bg-[#dcfce7] text-[#166534]",
  validated: "bg-[#dcfce7] text-[#166534]",
  pending: "bg-[#fef3c7] text-[#92400e]",
  incomplete: "bg-[#fef3c7] text-[#92400e]",
  detected: "bg-[#dbeafe] text-[#1e40af]",
  proposed: "bg-[#dbeafe] text-[#1e40af]",
  failed: "bg-[#fee2e2] text-[#991b1b]",
  archived: "bg-gray-100 text-gray-600",
  default: "bg-gray-100 text-gray-700"
};

export function StatusBadge({ label, tone }: { label: string; tone?: string }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", tones[tone ?? label] ?? tones.default)}>
      {label}
    </span>
  );
}
