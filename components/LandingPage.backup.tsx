import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import ConstellationMap from '@/components/ConstellationMap'
import WaitlistForm from '@/components/WaitlistForm'

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06091A] flex flex-col overflow-hidden">

      {/* ── Top navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-10 md:px-14 py-6">
        {/* Logo — large, upper left */}
        <div className="flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="3" fill="#DFA832" />
            <line x1="9" y1="9" x2="2"  y2="3"  stroke="#DFA832" strokeWidth="1.2" strokeOpacity="0.7" />
            <line x1="9" y1="9" x2="16" y2="3"  stroke="#DFA832" strokeWidth="1.2" strokeOpacity="0.55" />
            <line x1="9" y1="9" x2="17" y2="10" stroke="#DFA832" strokeWidth="1.2" strokeOpacity="0.6" />
            <line x1="9" y1="9" x2="3"  y2="15" stroke="#DFA832" strokeWidth="1.2" strokeOpacity="0.5" />
          </svg>
          <span className="text-[#EAE5D8] text-[1.3rem] font-semibold uppercase tracking-[0.2em]"
            style={{ fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
            Skillosophy
          </span>
        </div>

        {/* Sign In — upper right */}
        <Link
          href="/login"
          className="text-[#EAE5D8] text-sm font-medium tracking-wide border border-white/15 px-5 py-2 hover:border-[#DFA832] hover:text-[#DFA832] transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* ── Main content ── */}
      <div className="relative flex-1 flex flex-col md:flex-row">

        {/* ── Left panel ── */}
        <div className="relative z-10 flex flex-col justify-center px-10 md:px-14 py-12 md:py-0 md:w-[42%]">

          {/* Headline */}
          <div className="mb-6 mt-4">
            <h1 className={`${playfair.className} text-[#EAE5D8] text-4xl md:text-5xl leading-[1.15] font-normal`}>
              There&apos;s more in you
              <br />
              than you{' '}
              <em className="text-[#DFA832] italic">think.</em>
            </h1>
          </div>

          {/* Body copy */}
          <p className="text-[#6B7FA0] text-sm leading-relaxed mb-10 max-w-xs">
            A career clarity engine. Maps your skills and credentials to paths
            you never knew were yours. Launching in Canada.
          </p>

          {/* CTA */}
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#DFA832] opacity-60" />
              <span className="text-[#DFA832] text-[10px] uppercase tracking-[0.2em] font-medium">
                Get Early Access
              </span>
            </div>
            <WaitlistForm />
          </div>

          <p className="text-[#3A4A60] text-xs mt-3">
            No spam. Just your map, when it&apos;s ready.
          </p>
        </div>

        {/* ── Right panel — constellation ── */}
        <div className="relative md:w-[58%] h-[50vh] md:h-full">
          <div className="hidden md:block absolute left-0 top-[15%] bottom-[15%] w-px bg-white/[0.03]" />
          <ConstellationMap />
        </div>

      </div>
    </div>
  )
}
