import React from "react";

// The signature visual motif of the app: a brass vault dial with tick marks,
// echoing a physical safe-deposit box. Used on the auth screens and empty states.
export default function VaultDial({ className = "", size = 220 }) {
  const ticks = Array.from({ length: 36 });
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="110" cy="110" r="104" stroke="#E3B94D" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="86" fill="#0F1B33" />
      <circle cx="110" cy="110" r="86" stroke="#C6952C" strokeWidth="2" />

      {ticks.map((_, i) => {
        const angle = (i / ticks.length) * 2 * Math.PI;
        const isMajor = i % 9 === 0;
        const rOuter = 86;
        const rInner = isMajor ? 72 : 78;
        const x1 = 110 + rOuter * Math.sin(angle);
        const y1 = 110 - rOuter * Math.cos(angle);
        const x2 = 110 + rInner * Math.sin(angle);
        const y2 = 110 - rInner * Math.cos(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isMajor ? "#E3B94D" : "#C6952C"}
            strokeOpacity={isMajor ? 0.9 : 0.4}
            strokeWidth={isMajor ? 2 : 1}
          />
        );
      })}

      <circle cx="110" cy="110" r="48" fill="#1B2A4A" stroke="#C6952C" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="6" fill="#E3B94D" />
      <line x1="110" y1="110" x2="110" y2="70" stroke="#E3B94D" strokeWidth="3" strokeLinecap="round" />
      <line x1="110" y1="110" x2="140" y2="122" stroke="#E3B94D" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
