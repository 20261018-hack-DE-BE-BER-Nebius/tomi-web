import type { SVGProps } from "react";

const paths: Record<string, string> = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  send: "m6 12 6-6 6 6M12 6v14",
  plus: "M12 5v14M5 12h14",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-6v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  book: "M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3V4Zm9 2v15",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8",
  mute: "m3 3 18 18M9 9v3a3 3 0 0 0 5 2m1-5V6a3 3 0 0 0-5-2M5 10v2a7 7 0 0 0 12 5m2-5v-2m-7 9v3m-4 0h8",
  activity: "m2 12 5 0 3-8 4 16 3-8h5",
  stop: "M6 6h12v12H6Z",
  chevron: "m9 5 7 7-7 7",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  image: "M3 3h18v18H3Zm0 12 6-6 12 12M16 6h.01",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  logout: "M9 3H3v18h6m6-14 5 5-5 5m-8-5h13",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  spark: "m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z",
};
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  );
}
