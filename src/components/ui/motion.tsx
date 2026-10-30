"use client";
import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade/slide-up when scrolled into view. Honours prefers-reduced-motion (via MotionConfig + guard). */
export function Reveal({ children, delay = 0, y = 18, className, once = true, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number; once?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Masked line-by-line headline reveal. */
export function RevealLines({
  lines, className, lineClassName, delay = 0, as: Tag = "h1", italicLines = [],
}: { lines: string[]; className?: string; lineClassName?: string; delay?: number; as?: "h1" | "h2" | "h3" | "p"; italicLines?: number[] }) {
  const reduce = useReducedMotion();
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={`${line}-${i}`} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className={cn("block", lineClassName, italicLines.includes(i) && "italic")}
            initial={reduce ? false : { y: "108%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: delay + i * 0.11, ease }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function FadeIn({ children, delay = 0, className, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay, ease }} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, gap = 0.08, ...props }: HTMLMotionProps<"div"> & { gap?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 16, ...props }: HTMLMotionProps<"div"> & { y?: number }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }} className={className} {...props}>
      {children}
    </motion.div>
  );
}
