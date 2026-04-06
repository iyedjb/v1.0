import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_KEY = (path: string) => `vuro_scroll:${path}`;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathname.current;
    prevPathname.current = pathname;

    const leavingProduct = prev?.startsWith("/product/");
    const enteringProduct = pathname.startsWith("/product/");

    // Save scroll before entering a product page
    if (enteringProduct && prev && !leavingProduct) {
      sessionStorage.setItem(SCROLL_KEY(prev), String(Math.round(window.scrollY)));
    }

    // Coming back from product page → restore scroll
    if (leavingProduct && !enteringProduct) {
      const saved = sessionStorage.getItem(SCROLL_KEY(pathname));
      if (saved) {
        const target = parseInt(saved, 10);
        // Try multiple times to handle async content rendering
        let attempts = 0;
        const tryRestore = () => {
          window.scrollTo({ top: target, behavior: "instant" });
          attempts++;
          if (attempts < 8) {
            setTimeout(tryRestore, 80);
          }
        };
        setTimeout(tryRestore, 50);
        return;
      }
    }

    // Normal navigation (not to/from product) → scroll to top
    if (!enteringProduct && !leavingProduct) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
