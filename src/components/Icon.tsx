import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const Icon = {
  pin: (p: P) => (<svg {...base(p)}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>),
  flag: (p: P) => (<svg {...base(p)}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>),
  clock: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  user: (p: P) => (<svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>),
  bag: (p: P) => (<svg {...base(p)}><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></svg>),
  plane: (p: P) => (<svg {...base(p)}><path d="M10.5 13.5 3 11l1.5-1.5 7 1 4-4.5c1-1 2.5-1.3 3-.8s.2 2-.8 3l-4.5 4 1 7L12.7 21l-2.2-7.5z" /></svg>),
  car: (p: P) => (<svg {...base(p)}><path d="M5 16V11l2-5h10l2 5v5M3 16h18v3h-3M6 19H3" /><circle cx="7.5" cy="16" r="1.5" /><circle cx="16.5" cy="16" r="1.5" /></svg>),
  crown: (p: P) => (<svg {...base(p)}><path d="m3 8 4 4 5-7 5 7 4-4-2 11H5L3 8z" /></svg>),
  briefcase: (p: P) => (<svg {...base(p)}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></svg>),
  users: (p: P) => (<svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3" /></svg>),
  route: (p: P) => (<svg {...base(p)}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" /></svg>),
  shield: (p: P) => (<svg {...base(p)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></svg>),
  star: (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" /></svg>),
  check: (p: P) => (<svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>),
  arrow: (p: P) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  phone: (p: P) => (<svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>),
  headset: (p: P) => (<svg {...base(p)}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg>),
  menu: (p: P) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>),
  close: (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  wifi: (p: P) => (<svg {...base(p)}><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="1" /></svg>),
  sparkle: (p: P) => (<svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>),
  locate: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></svg>),
  swap: (p: P) => (<svg {...base(p)}><path d="m7 10-4-4 4-4M3 6h18M17 14l4 4-4 4M21 18H3" /></svg>),
  logout: (p: P) => (<svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
};
