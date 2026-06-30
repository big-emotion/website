"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Brand book: "a looping logo animation acts as a load screen before the site, to
// introduce the content and give a real digital feel." Plays once per session so it
// frames the first impression without nagging on every navigation.
const HOLD_MS = 1700;

export function LoadScreen() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Already seen this session -> exit immediately; otherwise hold the intro.
    const seen = sessionStorage.getItem("be-loaded") === "1";
    const delay = seen ? 0 : reduce ? 300 : HOLD_MS;
    const t = setTimeout(() => {
      sessionStorage.setItem("be-loaded", "1");
      setVisible(false);
    }, delay);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="load"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-lemon"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          {!reduce && (
            <motion.div
              className="flex whitespace-nowrap"
              initial={{ x: "0%" }}
              animate={{ x: "-50%" }}
              transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="font-display px-3 text-[18vw] leading-none text-ink md:text-[12vw]"
                >
                  B!G
                </span>
              ))}
            </motion.div>
          )}
          {reduce && (
            <span className="font-display text-[18vw] leading-none text-ink">B!G</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
