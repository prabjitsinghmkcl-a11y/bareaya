import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/effects.css';

const PageReveal = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const revealAll = () =>
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));

    if (!('IntersectionObserver' in window)) {
      revealAll();
      return undefined;
    }

    let observer = null;
    let safetyTimer = null;

    const observePending = () => {
      if (!observer) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
        );
      }
      document
        .querySelectorAll('[data-reveal]:not(.is-revealed)')
        .forEach((el) => observer.observe(el));
    };

    observePending();

    const mutationObserver = new MutationObserver(observePending);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    clearTimeout(safetyTimer);
    safetyTimer = setTimeout(revealAll, 4000);

    return () => {
      clearTimeout(safetyTimer);
      if (observer) observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
};

export default PageReveal;