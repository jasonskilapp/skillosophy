"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";
import styles from "./LandingPage.module.css";

const PATH_SETS = [
  {
    copy: "Example matches from the skills on the left.",
    nodes: [
      ["Health Tech", "Support patients and care teams."],
      ["Research Support", "Help studies run smoothly."],
      ["Client Success", "Help clients get results."],
    ],
  },
  {
    copy: "Same skills, different paths.",
    nodes: [
      ["Climate Work", "Support outreach and projects."],
      ["Policy Work", "Turn research into insight."],
      ["Partnerships", "Work with people and communities."],
    ],
  },
  {
    copy: "Different angle, new options.",
    nodes: [
      ["Finance Risk", "Spot details and reduce risk."],
      ["User Research", "Organize interviews and insights."],
      ["Program Support", "Keep projects moving."],
    ],
  },
];

const COLORS = ["#35f2d0", "#4aa3ff", "#8b7dff", "#ff5c8a", "#ffd166", "#b6ff6a"];

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const colorWheelRef = useRef<HTMLDivElement>(null);
  const mapPanelRef = useRef<HTMLElement>(null);

  const [pathIndex, setPathIndex] = useState(0);
  const [shuffleLocked, setShuffleLocked] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [wheelHue, setWheelHue] = useState(174);
  const [skills, setSkills] = useState(["Retail", "Psychology", "Club Finance", "Mentoring"]);

  const currentSet = PATH_SETS[pathIndex];
  const filledSkills = skills.filter(Boolean);
  const mapCopy = filledSkills.length > 0 ? `Using ${filledSkills.join(", ")}.` : currentSet.copy;

  // Override body background for landing page
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#05070c";
    return () => { document.body.style.background = prev; };
  }, []);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string; phase: number };
    const points: Particle[] = [];
    let pointer = { x: 0.68, y: 0.42 };
    let canvasWidth = 0;
    let canvasHeight = 0;
    let canvasActive = true;
    let lastFrame = 0;
    let rafId = 0;
    let resizeRaf = 0;
    const frameInterval = 1000 / 20;

    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvasWidth = canvas!.clientWidth;
      canvasHeight = canvas!.clientHeight;
      canvas!.width = Math.floor(canvasWidth * dpr);
      canvas!.height = Math.floor(canvasHeight * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      points.length = 0;
      const count = Math.min(24, Math.max(14, Math.floor(window.innerWidth / 58)));
      for (let i = 0; i < count; i++) {
        points.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1.4 + Math.random() * 2.7,
          color: COLORS[i % 6],
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(time = 0) {
      rafId = requestAnimationFrame(draw);
      if (!canvasActive || document.hidden || window.innerWidth <= 680) return;
      if (time - lastFrame < frameInterval) return;
      lastFrame = time;

      ctx!.clearRect(0, 0, canvasWidth, canvasHeight);
      const pullX = pointer.x * canvasWidth;
      const pullY = pointer.y * canvasHeight;

      for (const p of points) {
        p.x += p.vx + Math.sin(time / 1100 + p.phase) * 0.1;
        p.y += p.vy + Math.cos(time / 1400 + p.phase) * 0.08;
        const dx = pullX - p.x;
        const dy = pullY - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 240) { p.x += (dx / dist) * 0.12; p.y += (dy / dist) * 0.12; }
        if (p.x < -30) p.x = canvasWidth + 30;
        if (p.x > canvasWidth + 30) p.x = -30;
        if (p.y < -30) p.y = canvasHeight + 30;
        if (p.y > canvasHeight + 30) p.y = -30;
      }

      ctx!.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 130) {
          ctx!.globalAlpha = (1 - dist / 130) * 0.2;
          ctx!.strokeStyle = a.color;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      for (const p of points) {
        ctx!.globalAlpha = 0.82;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function onPointerMove(e: PointerEvent) {
      pointer = { x: e.clientX / Math.max(window.innerWidth, 1), y: e.clientY / Math.max(window.innerHeight, 1) };
    }
    function onPointerLeave() { pointer = { x: 0.68, y: 0.42 }; }
    function onResize() {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => { sizeCanvas(); seed(); });
    }

    sizeCanvas();
    seed();
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    const hero = heroRef.current;
    let idleObserver: IntersectionObserver | null = null;
    if (hero) {
      idleObserver = new IntersectionObserver(
        ([e]) => { canvasActive = e.isIntersecting; },
        { threshold: 0.05 }
      );
      idleObserver.observe(hero);
    }

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      idleObserver?.disconnect();
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.inView); }),
      { threshold: 0.16 }
    );
    document.querySelectorAll(`.${styles.reveal}, .${styles.miniStep}`).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Color wheel
  useEffect(() => {
    const wheel = colorWheelRef.current;
    if (!wheel) return;

    function updateHue(clientX: number, clientY: number) {
      const rect = wheel!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = clientX - cx;
      const y = clientY - cy;
      const dist = Math.hypot(x, y);
      const outer = rect.width / 2;
      if (dist < outer * 0.36 || dist > outer + 10) return;
      const hue = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
      setWheelHue(Math.round(hue));
    }

    function onDown(e: PointerEvent) { wheel!.setPointerCapture(e.pointerId); updateHue(e.clientX, e.clientY); }
    function onMove(e: PointerEvent) { if (e.buttons) updateHue(e.clientX, e.clientY); }
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowUp")   { e.preventDefault(); setWheelHue((h) => ((h + 18) % 360 + 360) % 360); }
      if (e.key === "ArrowLeft"  || e.key === "ArrowDown") { e.preventDefault(); setWheelHue((h) => ((h - 18) % 360 + 360) % 360); }
    }

    wheel.addEventListener("pointerdown", onDown);
    wheel.addEventListener("pointermove", onMove);
    wheel.addEventListener("keydown", onKey);
    return () => {
      wheel.removeEventListener("pointerdown", onDown);
      wheel.removeEventListener("pointermove", onMove);
      wheel.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleShuffle() {
    if (shuffleLocked) return;
    setShuffleLocked(true);
    setIsShuffling(true);
    setTimeout(() => {
      setPathIndex((i) => (i + 1) % PATH_SETS.length);
      setIsShuffling(false);
    }, 230);
    setTimeout(() => setShuffleLocked(false), 520);
  }

  const mp = `${styles.mapPanel}${isShuffling ? ` ${styles.isShuffling}` : ""}`;

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className={styles.nav} aria-label="Primary">
        <a className={styles.brand} href="#top" aria-label="Skillosophy home">
          <span className={styles.brandMark} aria-hidden="true" />
          <span>Skillosophy</span>
        </a>
        <div className={styles.navLinks} aria-label="Page sections">
          <a href="#paths">Paths</a>
          <a href="#preview">Examples</a>
          <a href="#start">Join</a>
        </div>
        <div className={styles.navActions}>
          <a className={styles.navCta} href="#start">
            Early Access
            <span className={styles.arrow} aria-hidden="true">›</span>
          </a>
          <Link className={styles.navSignIn} href="/login">Sign In</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className={styles.hero} id="top" ref={heroRef}>
        <canvas className={styles.pathCanvas} ref={canvasRef} aria-hidden="true" />
        <div className={styles.ambientField} aria-hidden="true">
          <span className={`${styles.lightBeam} ${styles.one}`} />
          <span className={`${styles.lightBeam} ${styles.two}`} />
          <span className={`${styles.comet} ${styles.one}`} />
          <span className={`${styles.comet} ${styles.two}`} />
          <span className={styles.dataRain} />
          <span className={styles.glassOrbit} />
        </div>
        <div className={styles.heroVignette} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={`${styles.heroCopy} ${styles.reveal}`}>
            <p className={styles.eyebrow}>Careers from Your Skills</p>
            <h1 className={styles.h1}>The groundwork is done before the session starts.</h1>
            <p>
              Skillosophy turns jobs, classes, projects, and volunteering into career
              directions that are easy to miss.
            </p>
            <div className={styles.heroActions}>
              <a className={`${styles.button} ${styles.primary}`} href="#start">
                Start Exploring
                <span className={styles.arrow} aria-hidden="true">›</span>
              </a>
              <a className={`${styles.button} ${styles.secondary}`} href="#preview">
                See Examples
              </a>
            </div>
            <div className={styles.heroProof} aria-label="Product promises">
              <span className={styles.chip}>Use Your Skills</span>
              <span className={styles.chip}>Find New Paths</span>
              <span className={styles.chip}>Know What to Try</span>
            </div>
          </div>

          <div className={styles.pathOrb} aria-label="Animated career preview">
            <div className={styles.orbRing} aria-hidden="true" />
            <div className={`${styles.orbRing} ${styles.orbRingTwo}`} aria-hidden="true" />
            <div className={`${styles.orbRing} ${styles.orbRingThree}`} aria-hidden="true" />

            <div className={`${styles.floatingWord} ${styles.one}`}>
              Your Skills<small>What You Have</small>
            </div>
            <div className={`${styles.floatingWord} ${styles.two}`}>
              New Roles<small>What Fits</small>
            </div>
            <div className={`${styles.floatingWord} ${styles.three}`}>
              New Fields<small>Where to Look</small>
            </div>
            <div className={`${styles.floatingWord} ${styles.four}`}>
              Next Steps<small>What to Try</small>
            </div>

            <section className={styles.discoveryCard}>
              <div className={styles.cardTop}>
                <div className={styles.dots} aria-hidden="true">
                  <span /><span /><span />
                </div>
                <span>Example Search</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.inputRow} aria-label="Example skills">
                  <span className={styles.skillPill}>Support</span>
                  <span className={styles.skillPill}>Research</span>
                  <span className={styles.skillPill}>Coordination</span>
                </div>
                <div className={styles.matchPath} aria-hidden="true">
                  <span className={`${styles.node} ${styles.one}`} />
                  <span className={`${styles.node} ${styles.two}`} />
                  <span className={`${styles.node} ${styles.three}`} />
                  <span className={`${styles.pathLabel} ${styles.one}`}>Skills</span>
                  <span className={`${styles.pathLabel} ${styles.two}`}>Paths</span>
                </div>
                <div className={styles.resultStack}>
                  <article className={styles.result}>
                    <span className={styles.resultDot} aria-hidden="true" />
                    <div><strong>Research Support</strong><span>Help studies run</span></div>
                    <span className={styles.fit}>Match</span>
                  </article>
                  <article className={`${styles.result} ${styles.two}`}>
                    <span className={`${styles.resultDot} ${styles.two}`} aria-hidden="true" />
                    <div><strong>Client Success</strong><span>Help clients win</span></div>
                    <span className={styles.fit}>Match</span>
                  </article>
                  <article className={`${styles.result} ${styles.three}`}>
                    <span className={`${styles.resultDot} ${styles.three}`} aria-hidden="true" />
                    <div><strong>Program Support</strong><span>Keep work moving</span></div>
                    <span className={styles.fit}>Match</span>
                  </article>
                </div>
              </div>
            </section>
          </div>
        </div>

        <a className={styles.scrollCue} href="#paths" aria-label="Scroll">↓</a>
      </header>

      {/* ── Marquee ── */}
      <section className={styles.marquee} aria-label="Example industries">
        <div className={styles.marqueeTrack}>
          {[
            "Health Tech","Climate Work","Policy Work","Client Success",
            "Research Support","Finance Risk","Program Support","User Research",
            "Health Tech","Climate Work","Policy Work","Client Success",
            "Research Support","Finance Risk","Program Support","User Research",
          ].map((item, i) => <span key={i}>{item}</span>)}
        </div>
      </section>

      <main>
        {/* ── How It Works ── */}
        <section className={styles.section} id="paths">
          <div className={styles.sectionInner}>
            <div className={`${styles.sectionHeading} ${styles.reveal}`}>
              <div>
                <p className={styles.kicker}>How It Works</p>
                <h2 className={styles.h2}>Put in Your Skills. Get New Career Ideas.</h2>
              </div>
              <p>No long quiz. No career boxes. Just clearer options to explore.</p>
            </div>
            <div className={styles.miniFlow} aria-label="Simple product flow">
              <article className={styles.miniStep}>
                <div className={styles.stepIndex}>01</div>
                <h3 className={styles.h3}>Add Experience</h3>
                <p>Work, school, projects, volunteering. It all counts.</p>
              </article>
              <article className={styles.miniStep}>
                <div className={styles.stepIndex}>02</div>
                <h3 className={styles.h3}>See Matches</h3>
                <p>Find roles and industries you may not know.</p>
              </article>
              <article className={styles.miniStep}>
                <div className={styles.stepIndex}>03</div>
                <h3 className={styles.h3}>Pick a Path</h3>
                <p>Choose what to learn, search, or try next.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── Examples / Wayfinder ── */}
        <section className={styles.section} id="preview">
          <div className={styles.sectionInner}>
            <div className={styles.wayfinder}>
              <aside className={`${styles.inputPanel} ${styles.reveal}`}>
                <div>
                  <p className={styles.kicker}>Examples</p>
                  <h3 className={styles.h3}>Same Skills. More Paths.</h3>
                  <p>Type a few skills. Shuffle the ideas.</p>
                </div>
                <div className={styles.promptStack} aria-label="Example inputs">
                  {[
                    { hint: "People",   label: "Experience one" },
                    { hint: "Research", label: "Experience two" },
                    { hint: "Money",    label: "Experience three" },
                    { hint: "Coaching", label: "Experience four" },
                  ].map(({ hint, label }, i) => (
                    <label key={i} className={styles.prompt}>
                      <input
                        value={skills[i]}
                        onChange={(e) => {
                          const next = [...skills];
                          next[i] = e.target.value;
                          setSkills(next);
                        }}
                        aria-label={label}
                      />
                      <span>{hint}</span>
                    </label>
                  ))}
                </div>
                <button className={styles.shuffle} type="button" onClick={handleShuffle}>
                  Shuffle Ideas
                </button>
              </aside>

              <section
                className={mp}
                ref={mapPanelRef as React.RefObject<HTMLElement>}
                style={{ "--wheel-hue": `${wheelHue}deg` } as React.CSSProperties}
                aria-label="Animated career ideas map"
              >
                <div className={styles.mapTitle}>
                  <div>
                    <h3 className={styles.h3}>Career Ideas</h3>
                    <p>{mapCopy}</p>
                  </div>
                  <span className={styles.liveBadge}>Live</span>
                </div>
                <div className={styles.mapGrid}>
                  <div className={styles.bigRoute} aria-hidden="true" />
                  <div className={`${styles.bigRoute} ${styles.bigRouteTwo}`} aria-hidden="true" />
                  <article className={styles.industryNode}>
                    <strong>{currentSet.nodes[0][0]}</strong>
                    <span>{currentSet.nodes[0][1]}</span>
                  </article>
                  <article className={`${styles.industryNode} ${styles.nodeTwo}`}>
                    <strong>{currentSet.nodes[1][0]}</strong>
                    <span>{currentSet.nodes[1][1]}</span>
                  </article>
                  <article className={`${styles.industryNode} ${styles.nodeThree}`}>
                    <strong>{currentSet.nodes[2][0]}</strong>
                    <span>{currentSet.nodes[2][1]}</span>
                  </article>
                  <div
                    className={styles.centerSignal}
                    ref={colorWheelRef}
                    role="button"
                    tabIndex={0}
                    aria-label="Color wheel — drag to change the map accent color"
                  />
                </div>
              </section>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className={styles.final} id="start">
          <div className={`${styles.finalInner} ${styles.reveal}`}>
            <p className={styles.kicker}>Join Skillosophy</p>
            <h2 className={styles.h2}>Stop Searching by Title. Start Searching by Fit.</h2>
            <p>
              Built for people who know there is more out there, but do not know what
              to search next.
            </p>
            <div className={styles.heroActions} style={{ justifyContent: "center", marginTop: 32 }}>
              <WaitlistForm />
            </div>
            <a className={styles.backTop} href="#top">Back to Top</a>
          </div>
        </section>
      </main>
    </div>
  );
}
