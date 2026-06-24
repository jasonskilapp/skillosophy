'use client'

const CX = 490
const CY = 300

const PRIMARY = [
  { label: 'POLICY ANALYST',  x: 338, y: 155, tx: 14,  ty: 4,  anchor: 'start' },
  { label: 'CAREER ADVISOR',  x: 198, y: 300, tx: -14, ty: 4,  anchor: 'end'   },
  { label: 'COMMUNITY LEAD',  x: 372, y: 428, tx: 14,  ty: 4,  anchor: 'start' },
  { label: 'PRODUCT LEAD',    x: 685, y: 210, tx: 14,  ty: 4,  anchor: 'start' },
  { label: 'UX RESEARCHER',   x: 655, y: 115, tx: 14,  ty: 4,  anchor: 'start' },
]

const SECONDARY = [
  { label: 'GRANT WRITER',    x: 262, y: 105, tx: 10,  ty: 4,  anchor: 'start' },
  { label: 'DATA STRATEGY',   x: 462, y: 50,  tx: 0,   ty: -10, anchor: 'middle' },
  { label: 'CURRICULUM DEV',  x: 788, y: 76,  tx: -10, ty: 4,  anchor: 'end'   },
  { label: 'OPS STRATEGIST',  x: 790, y: 290, tx: -12, ty: 4,  anchor: 'end'   },
  { label: 'LEARNING DESIGN', x: 700, y: 392, tx: -12, ty: 4,  anchor: 'end'   },
  { label: 'NONPROFIT DIR.',  x: 575, y: 452, tx: 0,   ty: 14, anchor: 'middle' },
  { label: 'HR SPECIALIST',   x: 308, y: 455, tx: 10,  ty: 4,  anchor: 'start' },
  { label: 'CAREER GUIDANCE', x: 720, y: 450, tx: -12, ty: 4,  anchor: 'end'   },
]

export default function ConstellationMap() {
  return (
    <svg
      viewBox="0 0 920 580"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#DFA832" stopOpacity="0.45" />
          <stop offset="55%"  stopColor="#DFA832" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#DFA832" stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="ag" cx="53%" cy="52%" r="48%">
          <stop offset="0%"   stopColor="#DFA832" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#06091A" stopOpacity="0"    />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient glow */}
      <rect width="920" height="580" fill="url(#ag)" />

      {/* Grid */}
      {[150, 270, 390, 510, 630, 750, 870].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="580" stroke="#0D1629" strokeWidth="1" />
      ))}
      {[95, 190, 285, 380, 475, 570].map(y => (
        <line key={y} x1="150" y1={y} x2="920" y2={y} stroke="#0D1629" strokeWidth="1" />
      ))}

      {/* Contour rings */}
      {[{ rx: 62,  ry: 48,  opacity: 0.22 },
        { rx: 130, ry: 100, opacity: 0.13 },
        { rx: 215, ry: 165, opacity: 0.07 }].map((r, i) => (
        <ellipse key={i} cx={CX} cy={CY} rx={r.rx} ry={r.ry}
          fill="none" stroke="#DFA832" strokeWidth="1"
          strokeOpacity={r.opacity}
          transform={`rotate(-14 ${CX} ${CY})`} />
      ))}

      {/* Lines to secondary nodes */}
      {SECONDARY.map((n, i) => (
        <line key={i} x1={CX} y1={CY} x2={n.x} y2={n.y}
          stroke="#4E6898" strokeWidth="0.7" strokeOpacity="0.28" />
      ))}

      {/* Lines to primary nodes */}
      {PRIMARY.map((n, i) => (
        <line key={i} x1={CX} y1={CY} x2={n.x} y2={n.y}
          stroke="#DFA832" strokeWidth="1.3" strokeOpacity="0.48" />
      ))}

      {/* Secondary nodes */}
      {SECONDARY.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="4.5" fill="#4E6898" opacity="0.72" />
          <text x={n.x + n.tx} y={n.y + n.ty}
            fill="#4E6898" fontSize="8" letterSpacing="0.08em"
            fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
            textAnchor={n.anchor as 'start' | 'end' | 'middle'} opacity="0.72">
            {n.label}
          </text>
        </g>
      ))}

      {/* Primary nodes */}
      {PRIMARY.map((n, i) => (
        <g key={i} className={`pnode pnode-${i}`}>
          <circle cx={n.x} cy={n.y} r="18" fill="#DFA832" opacity="0.07" filter="url(#glow)" />
          <circle cx={n.x} cy={n.y} r="7.5" fill="#DFA832" opacity="0.88" />
          <text x={n.x + n.tx} y={n.y + n.ty}
            fill="#EAE5D8" fontSize="9.5" letterSpacing="0.1em" fontWeight="500"
            fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
            textAnchor={n.anchor as 'start' | 'end' | 'middle'}>
            {n.label}
          </text>
        </g>
      ))}

      {/* Center glow area */}
      <circle cx={CX} cy={CY} r="65" fill="url(#cg)" />

      {/* Pulse rings */}
      <circle cx={CX} cy={CY} r="22" fill="none" stroke="#DFA832" strokeWidth="1.5" className="pr1" />
      <circle cx={CX} cy={CY} r="22" fill="none" stroke="#DFA832" strokeWidth="1.5" className="pr2" />

      {/* Center node */}
      <circle cx={CX} cy={CY} r="11" fill="#DFA832" filter="url(#glow)" />

      {/* YOU label */}
      <text x={CX} y={CY - 20}
        fill="#EAE5D8" fontSize="9" letterSpacing="0.18em" textAnchor="middle"
        fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" opacity="0.9">
        YOU
      </text>

      {/* Coordinates */}
      <text x={CX} y={CY + 28}
        fill="#DFA832" fontSize="7.5" letterSpacing="0.08em" textAnchor="middle"
        fontFamily="ui-monospace,monospace" opacity="0.55">
        47°N 82°W
      </text>

      {/* Counter */}
      <text x="195" y="562"
        fill="#4E6898" fontSize="8" letterSpacing="0.14em"
        fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" opacity="0.6">
        13 PATHS MAPPED
      </text>

      <style>{`
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.28; }
          100% { transform: scale(2.8); opacity: 0;    }
        }
        @keyframes nodeBreath {
          0%, 100% { opacity: 0.88; }
          50%       { opacity: 1;    }
        }
        .pr1 {
          transform-box: fill-box;
          transform-origin: center;
          animation: pulseRing 3s ease-out infinite;
        }
        .pr2 {
          transform-box: fill-box;
          transform-origin: center;
          animation: pulseRing 3s ease-out infinite 1.5s;
        }
        .pnode { animation: nodeBreath 4s ease-in-out infinite; }
        .pnode-0 { animation-delay: 0s;    }
        .pnode-1 { animation-delay: 0.8s;  }
        .pnode-2 { animation-delay: 1.6s;  }
        .pnode-3 { animation-delay: 0.4s;  }
        .pnode-4 { animation-delay: 1.2s;  }
      `}</style>
    </svg>
  )
}
