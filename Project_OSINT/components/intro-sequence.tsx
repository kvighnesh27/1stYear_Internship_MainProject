import { useState,useEffect } from "react";
const TOTAL_DURATION_MS = 3300;

// Points sampled evenly along the original 10-point star's perimeter —
// this is what lets the star be drawn as a constellation of neon dots
// instead of a solid stroked/filled polygon. Computed once, module scope.
const STAR_DOTS: [number, number][] = [
  [160.0, 92.0], [162.8, 100.5], [165.7, 109.1], [168.5, 117.6], [171.4, 126.2],
  [174.2, 134.7], [179.4, 140.0], [188.4, 140.0], [197.4, 140.0], [206.4, 140.0],
  [215.4, 140.0], [224.4, 140.0], [221.8, 143.8], [214.6, 149.1], [207.3, 154.4],
  [200.0, 159.7], [192.8, 165.0], [186.2, 170.6], [188.9, 179.2], [191.5, 187.8],
  [194.2, 196.3], [196.9, 204.9], [199.6, 213.5], [197.5, 215.5], [190.1, 210.3],
  [182.8, 205.1], [175.4, 199.9], [168.1, 194.7], [160.7, 189.5], [153.4, 193.7],
  [146.0, 198.9], [138.7, 204.1], [131.4, 209.3], [124.0, 214.5], [119.9, 215.3],
  [122.5, 206.7], [125.2, 198.1], [127.9, 189.5], [130.6, 180.9], [133.3, 172.3],
  [128.7, 166.1], [121.4, 160.8], [114.2, 155.5], [106.9, 150.2], [99.6, 144.9],
  [93.8, 140.0], [102.8, 140.0], [111.8, 140.0], [120.8, 140.0], [129.8, 140.0],
  [138.8, 140.0], [145.2, 136.4], [148.0, 127.9], [150.9, 119.3], [153.7, 110.8],
  [156.6, 102.3], [159.4, 93.7],
];

export default function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Respect reduced-motion users: skip straight through, no spectacle.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const exitTimer = setTimeout(() => setExiting(true), TOTAL_DURATION_MS - 500);
    const doneTimer = setTimeout(() => onComplete(), TOTAL_DURATION_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#05070a",
        opacity: exiting ? 0 : 1,
        transition: "opacity 500ms ease",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* Inner row is centered as a whole by the outer wrapper. The star
          sits at fixed width; the OSINT wrapper starts at width:0, so the
          star is alone and dead-center. As OSINT's wrapper grows, the row
          widens and the outer centering naturally shifts the star left. */}
      <div style={{ display: "flex", alignItems: "center" }}>
      <style>{`
        @keyframes aegis-neon-dot-core-in {
          0%   { opacity: 0; transform: scale(0.2); }
          60%  { opacity: 1; transform: scale(1.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes aegis-neon-dot-bloom-in {
          0%   { opacity: 0; transform: scale(0.3); }
          60%  { opacity: 0.95; transform: scale(1.8); }
          100% { opacity: 0.85; transform: scale(1); }
        }
        @keyframes aegis-neon-bloom-pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        .aegis-neon-dot-core {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation-name: aegis-neon-dot-core-in;
          animation-duration: 260ms;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        .aegis-neon-dot-bloom {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation-name: aegis-neon-dot-bloom-in;
          animation-duration: 320ms;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes aegis-star-glow-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.08); }
        }
        @keyframes aegis-star-halo-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes aegis-star-halo-fade {
          from { opacity: 0; }
          to   { opacity: 0.6; }
        }
        @keyframes aegis-star-core-flash {
          0%   { opacity: 0; transform: scale(0.3); }
          40%  { opacity: 1; transform: scale(2.2); }
          100% { opacity: 0; transform: scale(3.4); }
        }
        @keyframes aegis-label-in {
          0%   { opacity: 0; letter-spacing: 0.5em; transform: scale(0.92); }
          100% { opacity: 1; letter-spacing: 0.12em; transform: scale(1); }
        }
        .aegis-fade-target {
          animation: aegis-label-in 700ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 1600ms;
          opacity: 0;
        }
        @keyframes aegis-osint-wrap-grow {
          0%   { width: 0; }
          100% { width: 340px; }
        }
        .aegis-osint-wrap {
          width: 0;
          overflow: hidden;
          animation: aegis-osint-wrap-grow 700ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 1500ms;
        }
        @media (prefers-reduced-motion: reduce) {
          .aegis-anim-all { animation: none !important; }
        }
      `}</style>

      <svg
        className="aegis-anim-all"
        viewBox="0 0 320 320"
        width="220"
        height="220"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <radialGradient id="aegis-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <filter id="aegis-neon-blur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
          </filter>
          <filter id="aegis-neon-blur-soft" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="9" result="blur" />
          </filter>
        </defs>

        {/* STAR — draws itself in, then holds (stays visible once OSINT appears) */}
        <g
          style={{
            transformOrigin: "160px 160px",
          }}
        >
          {/* outer soft glow behind the star while it holds */}
          <circle
            cx="160" cy="160" r="85"
            fill="url(#aegis-glow)"
            style={{
              transformOrigin: "160px 160px",
              animation: "aegis-star-glow-pulse 1200ms ease-in-out",
              animationDelay: "950ms",
              opacity: 0,
            }}
          />

          {/* thin rotating halo ring, settles in alongside the glow */}
          <circle
            cx="160" cy="160" r="68"
            fill="none"
            stroke="#5eead4"
            strokeWidth="0.75"
            strokeDasharray="3 7"
            style={{
              transformOrigin: "160px 160px",
              animation: "aegis-star-halo-spin 6000ms linear infinite, aegis-star-halo-fade 600ms ease-out forwards",
              animationDelay: "850ms, 850ms",
              opacity: 0,
            }}
          />

          {/* original 10-point star, now traced as a neon dot constellation */}
          <g>
            {/* outer soft bloom pass — heavily blurred, big neon halo per dot */}
            <g filter="url(#aegis-neon-blur-soft)">
              {STAR_DOTS.map(([x, y], i) => (
                <circle
                  key={`bloom-${i}`}
                  cx={x} cy={y} r="3.4"
                  fill="#5eead4"
                  className="aegis-neon-dot-bloom"
                  style={{ animationDelay: `${50 + (i / STAR_DOTS.length) * 700}ms` }}
                />
              ))}
            </g>
            {/* mid glow pass — tighter blur, saturated neon color */}
            <g filter="url(#aegis-neon-blur)">
              {STAR_DOTS.map(([x, y], i) => (
                <circle
                  key={`glow-${i}`}
                  cx={x} cy={y} r="2.8"
                  fill="#22d3ee"
                  className="aegis-neon-dot-bloom"
                  style={{ animationDelay: `${50 + (i / STAR_DOTS.length) * 700}ms` }}
                />
              ))}
            </g>
            {/* sharp core pass — crisp bright dot on top, no blur */}
            {STAR_DOTS.map(([x, y], i) => (
              <circle
                key={`core-${i}`}
                cx={x} cy={y} r="1.6"
                fill="#f4fffd"
                className="aegis-neon-dot-core"
                style={{ animationDelay: `${50 + (i / STAR_DOTS.length) * 700}ms` }}
              />
            ))}
          </g>

          {/* hot core flash right at the center */}
          <circle
            cx="160" cy="160" r="5"
            fill="#f8fffc"
            filter="url(#aegis-neon-blur)"
            style={{
              transformOrigin: "160px 160px",
              animation: "aegis-star-core-flash 500ms ease-out forwards",
              animationDelay: "780ms",
              opacity: 0,
            }}
          />
        </g>
      </svg>

      <div className="aegis-osint-wrap">
        <div
          className="aegis-fade-target"
          style={{
            fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
            fontSize: "56px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#eafffb",
            whiteSpace: "nowrap",
            paddingLeft: "28px",
            textShadow: `
              0 0 4px #ffffff,
              0 0 11px #9ff3e8,
              0 0 22px #22d3ee,
              0 0 42px #22d3ee,
              0 0 80px #0e9b8a
            `,
          }}
        >
          OSINT
        </div>
      </div>
      </div>
    </div>
  );
}