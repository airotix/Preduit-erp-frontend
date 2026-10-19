"use client";

import { useEffect } from "react";

/** Wheel edits stay on the focused number field, including fields in portalled forms. */
export function NumberInputWheel() {
  useEffect(() => {
    const setNativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    const onWheel = (event: WheelEvent) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "number"
          || document.activeElement !== input || input.disabled || input.readOnly
          || event.defaultPrevented || event.ctrlKey || event.shiftKey
          || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)
          || !event.cancelable) return;

      // This listener must be non-passive: React's delegated wheel listener
      // cannot reliably cancel the browser's page/ancestor scrolling.
      event.preventDefault();
      if (!setNativeValue || input.validity.badInput) return;
      const direction = event.deltaY < 0 ? 1 : -1;
      let next: string;
      if (input.dataset.wheelStep === "1") {
        // Whole-number wheel values; typed decimal prices remain supported.
        const current = input.value === "" ? 0 : input.valueAsNumber;
        if (!Number.isFinite(current) || Math.abs(current) >= Number.MAX_SAFE_INTEGER) return;
        const minValue = input.min === "" ? -Infinity : Number(input.min);
        const maxValue = input.max === "" ? Infinity : Number(input.max);
        const min = Number.isNaN(minValue) ? -Infinity : Math.ceil(minValue);
        const max = Number.isNaN(maxValue) ? Infinity : Math.floor(maxValue);
        if (min > max) return;
        const candidate = direction > 0 ? Math.floor(current) + 1 : Math.ceil(current) - 1;
        const bounded = Math.min(max, Math.max(min, candidate));
        // Clamping must never reverse the user's requested direction.
        if ((direction > 0 && bounded <= current) || (direction < 0 && bounded >= current)) return;
        next = String(bounded);
      } else {
        // Let native number stepping handle precision, min/max and step alignment
        // without temporarily changing the actual React-controlled input.
        const probe = input.cloneNode(false) as HTMLInputElement;
        probe.value = input.value;
        if (probe.step === "any") probe.step = "1";
        try { probe.stepUp(direction); } catch { return; }
        next = probe.value;
      }
      if (next === input.value) return;
      // Bypass React's value tracker so its normal onChange (and form state)
      // receives the change exactly as it does for a keyboard edit.
      setNativeValue.call(input, next);
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    };
    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", onWheel, true);
  }, []);
  return null;
}
