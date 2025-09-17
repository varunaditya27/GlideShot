
// --- GlideShot Animated Landing Page ---

"use client";
import React from "react";

import { motion } from "framer-motion";
import Link from "next/link";
import { LayoutDashboard, Sparkles, MoonStar } from "lucide-react";

const headingFont = {
  fontFamily: "'Montserrat', 'Geist', 'Fira Sans', Arial, sans-serif",
};

export default function Home() {
  // Force dark mode for immersive experience
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Animated star/particle background (deterministic across SSR/Client)
  function mulberry32(seed: number) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const particles = React.useMemo(() => {
    const rand = mulberry32(0xDEADBEEF);
    return Array.from({ length: 36 }).map(() => ({
      left: `${rand() * 100}%`,
      top: `${rand() * 100}%`,
      size: rand() * 2 + 1,
      delay: rand() * 3,
      opacity: rand() * 0.5 + 0.3,
    }));
  }, []);

  return (
  <main className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[oklch(0.13_0.08_260)] via-[oklch(0.18_0.14_320)] to-[oklch(0.269_0_0)] transition-colors duration-700 overflow-hidden px-4 md:px-0">
      {/* Layered Animated Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Animated color overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[oklch(0.398_0.07_227.392_0.18)] via-[oklch(0.828_0.189_84.429_0.10)] to-transparent blur-2xl"
          animate={{ opacity: [0.7, 0.9, 0.7], filter: ["blur(32px)", "blur(48px)", "blur(32px)"] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />
        {/* Animated particles */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/80 dark:bg-white/60 shadow-lg"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size * 4}px`,
              height: `${p.size * 4}px`,
              opacity: p.opacity,
              filter: "blur(1.5px)",
            }}
            animate={{
              y: [0, -10 * p.size, 0],
              opacity: [p.opacity, p.opacity * 0.7, p.opacity],
            }}
            transition={{
              repeat: Infinity,
              duration: 3.5 + p.size,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
        {/* Central Glow */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[oklch(0.398_0.07_227.392_0.18)] via-[oklch(0.828_0.189_84.429_0.10)] to-transparent blur-3xl opacity-80 animate-pulse-slow"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        />
      </div>

      {/* Animated Title & Description */}
      <motion.h1
        style={headingFont}
        className="text-5xl md:text-7xl font-black text-center bg-gradient-to-r from-[oklch(0.398_0.07_227.392)] via-[oklch(0.828_0.189_84.429)] to-[oklch(0.769_0.188_70.08)] bg-clip-text text-transparent drop-shadow-[0_2px_32px_oklch(0.398_0.07_227.392_0.5)] tracking-tight mt-32 mb-6 font-montserrat animate-gradient-x"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        GlideShot
      </motion.h1>
      <motion.p
        className="text-xl md:text-2xl text-center font-semibold text-white/90 mb-3 font-montserrat animate-fade-in max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.7 }}
      >
        <span className="bg-gradient-to-r from-[oklch(0.828_0.189_84.429)] to-[oklch(0.398_0.07_227.392)] bg-clip-text text-transparent">The Art of Digital Mini-Golf</span>
      </motion.p>
      <motion.p
        className="text-base md:text-lg text-center text-muted-foreground max-w-2xl mb-12 font-montserrat animate-fade-in mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.7 }}
      >
        Glide through stunning, interactive 3D courses. Master the perfect shot with intuitive controls, mesmerizing visuals, and a soundtrack that flows with your every move.<br className="hidden md:block" />
        <span className="text-primary font-semibold">Challenge yourself. Compete globally. Redefine your game night.</span>
      </motion.p>

      {/* Call to Action Button */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        whileHover={{ scale: 1.08, boxShadow: "0 0 48px oklch(0.398_0.07_227.392_0.7)" }}
        whileTap={{ scale: 0.97 }}
        className="z-20 mb-16"
      >
        <Link
          href="/game"
          className="px-12 py-5 rounded-full bg-gradient-to-r from-[oklch(0.398_0.07_227.392)] via-[oklch(0.828_0.189_84.429)] to-[oklch(0.769_0.188_70.08)] text-white text-xl font-extrabold shadow-2xl hover:shadow-[0_0_64px_oklch(0.398_0.07_227.392_0.7)] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/60 border-2 border-white/10 backdrop-blur-md font-montserrat tracking-wide animate-glow"
        >
          Play Now
        </Link>
      </motion.div>

      {/* Features Section - Staggered, richer text, Lucide icons, improved spacing */}
      <motion.section
        className="mt-4 md:mt-10 max-w-5xl w-full z-20"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.18 } } }}
      >
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          <motion.li
            className="rounded-2xl bg-card/80 dark:bg-card/30 p-8 shadow-2xl border border-border backdrop-blur-2xl hover:scale-105 hover:shadow-[0_0_48px_oklch(0.398_0.07_227.392_0.3)] transition-transform duration-300 flex flex-col items-center min-h-[260px]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.7 }}
          >
            <LayoutDashboard size={40} className="text-primary mb-3" />
            <h3 className="mt-1 text-xl font-bold font-montserrat">Minimal, Intuitive UI</h3>
            <p className="text-muted-foreground text-base mt-3">A distraction-free interface that lets you focus on the game. Every detail is designed for clarity, beauty, and flow.</p>
          </motion.li>
          <motion.li
            className="rounded-2xl bg-card/80 dark:bg-card/30 p-8 shadow-2xl border border-border backdrop-blur-2xl hover:scale-105 hover:shadow-[0_0_48px_oklch(0.828_0.189_84.429_0.3)] transition-transform duration-300 flex flex-col items-center min-h-[260px]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.7 }}
          >
            <Sparkles size={40} className="text-primary mb-3" />
            <h3 className="mt-1 text-xl font-bold font-montserrat">Dynamic Animations</h3>
            <p className="text-muted-foreground text-base mt-3">Every shot, transition, and interaction is brought to life with smooth, playful motion and subtle feedback.</p>
          </motion.li>
          <motion.li
            className="rounded-2xl bg-card/80 dark:bg-card/30 p-8 shadow-2xl border border-border backdrop-blur-2xl hover:scale-105 hover:shadow-[0_0_48px_oklch(0.769_0.188_70.08_0.3)] transition-transform duration-300 flex flex-col items-center min-h-[260px]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.7 }}
          >
            <MoonStar size={40} className="text-primary mb-3" />
            <h3 className="mt-1 text-xl font-bold font-montserrat">Immersive Dark Mode</h3>
            <p className="text-muted-foreground text-base mt-3">A rich, modern palette that’s easy on the eyes—perfect for late-night sessions and deep focus.</p>
          </motion.li>
        </ul>
      </motion.section>

      {/* Footer - Glassmorphic, animated, fits dark theme */}
      <footer className="relative w-full mt-28 z-30">
        <motion.div
          className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[oklch(0.269_0_0)] via-[oklch(0.398_0.07_227.392_0.25)] to-transparent pointer-events-none rounded-t-3xl border-t-2 border-[oklch(0.398_0.07_227.392_0.18)] shadow-2xl backdrop-blur-2xl"
          animate={{ opacity: [0.95, 0.85, 0.95], y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col items-center justify-center gap-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.7, duration: 0.8 }}
            className="flex gap-8 mb-2"
          >
            <a href="https://github.com/varunaditya27/GlideShot" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:scale-110 transition-transform">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white/80 hover:text-primary">
                <path fill="currentColor" d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.687-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.594 1.028 2.687 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z"/>
              </svg>
            </a>
            <a href="mailto:hello@glideshot.com" aria-label="Email" className="hover:scale-110 transition-transform">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white/80 hover:text-primary">
                <path fill="currentColor" d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75Zm1.5 0v.511l8.25 6.188 8.25-6.188V6.75a.75.75 0 0 0-.75-.75h-15a.75.75 0 0 0-.75.75Zm17.25 1.822-7.728 5.797a1.5 1.5 0 0 1-1.794 0L3 8.572v8.678c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75V8.572Z"/>
              </svg>
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.9, duration: 0.8 }}
            className="text-base text-white/80 text-center font-montserrat"
          >
            &copy; {(() => { try { return new Date(2025, 0, 1).getFullYear(); } catch { return 2025; } })()} <span className="font-bold text-primary">GlideShot</span>. All rights reserved.<br />
            <span className="text-xs text-white/40">Crafted with Next.js, React Three Fiber, and a passion for play.</span>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
