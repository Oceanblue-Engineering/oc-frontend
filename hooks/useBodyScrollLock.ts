import { useEffect } from "react";

let lockCount = 0;
let saved = { overflow: "", paddingRight: "" };

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const body = document.body;
    if (lockCount === 0) {
      saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount === 0) {
        body.style.overflow = saved.overflow;
        body.style.paddingRight = saved.paddingRight;
      }
    };
  }, [locked]);
}
