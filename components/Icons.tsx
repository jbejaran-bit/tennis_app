import { SVGProps } from "react";
export type IconName =
  | "overview"
  | "racket"
  | "matches"
  | "training"
  | "lessons"
  | "video"
  | "arrow"
  | "plus"
  | "check"
  | "download"
  | "close";
const paths: Record<IconName, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  racket: (
    <>
      <ellipse cx="14" cy="9" rx="6" ry="7" transform="rotate(35 14 9)" />
      <path d="m10 15-3 3m-1-1-3 4 2 1 3-4M11 5l7 6M9 8l7 6m0-10-6 9m8-7-6 9" />
    </>
  ),
  matches: (
    <>
      <path d="M5 4h14v16H5zM5 9h14M5 15h14M12 4v16M3 12h18" />
    </>
  ),
  training: (
    <>
      <path d="m4 7 4-3 4 3-4 3zM8 10v9m8-15 4 3-4 3-4-3m4 3v9M5 20h6m2 0h6" />
    </>
  ),
  lessons: (
    <>
      <path d="M12 6c-3-3-7-3-9-2v15c4-1 7 0 9 2 2-2 5-3 9-2V4c-2-1-6-1-9 2Zm0 0v15" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="13" height="14" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
};
export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
