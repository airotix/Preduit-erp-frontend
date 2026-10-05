import { useEffect, useRef, useState } from 'react';

/** Advances an index 0..length-1 on an interval; pausable. */
export function useCycle(length, ms, playing = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!playing || length < 2) return undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer;
    const update = () => {
      clearInterval(timer);
      if (!document.hidden && !motion.matches) timer = setInterval(() => setI(prev => (prev + 1) % length), ms);
    };
    update();
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); motion.removeEventListener('change', update); };
  }, [length, ms, playing]);
  return [i, setI];
}

/**
 * Scroll reveal. Elements carrying [data-reveal] below the fold start hidden
 * and fade/rise in as they enter the viewport; anything already visible on load
 * is never hidden, so the first paint is complete.
 */
export function useReveal(enabled = true) {
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const i = Number(el.getAttribute('data-i') || 0);
          const d = i * 55;
          el.style.transition =
            `opacity .6s cubic-bezier(0.22,1,0.36,1) ${d}ms, transform .6s cubic-bezier(0.22,1,0.36,1) ${d}ms`;
          el.style.opacity = '1';
          el.style.transform = 'none';
          const num = el.querySelector('[data-count]');
          if (num) countUp(num);
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach(el => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(22px)';
      }
      const sibs = Array.from(el.parentElement ? el.parentElement.children : []).filter(
        c => c.hasAttribute && c.hasAttribute('data-reveal')
      );
      el.setAttribute('data-i', String(Math.min(sibs.indexOf(el), 8)));
      io.observe(el);
    });
    return () => io.disconnect();
  }, [enabled]);
}

function countUp(node) {
  const target = Number(node.getAttribute('data-count'));
  if (Number.isNaN(target)) return;
  const suffix = (node.textContent.match(/[^0-9]+$/) || [''])[0];
  const t0 = performance.now();
  const dur = 1100;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur);
    node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Subtle mouse parallax on the hero app window. */
export function useTilt(hostId, enabled = true) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const host = document.getElementById(hostId);
    if (!host) return undefined;
    const onMove = e => {
      const el = ref.current;
      if (!el) return;
      const r = host.getBoundingClientRect();
      if (e.clientY < r.top - 60 || e.clientY > r.bottom + 60) {
        el.style.transform = 'none';
        return;
      }
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.transform = `rotateY(${(-x * 5).toFixed(2)}deg) rotateX(${(y * 4).toFixed(2)}deg) translateZ(0)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [hostId, enabled]);
  return ref;
}

/** Locks Escape-to-close + body scroll for the modal. */
export function useEscape(active, onEscape) {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = e => { if (e.key === 'Escape') onEscape(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [active, onEscape]);
}
