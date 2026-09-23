import React, { useEffect, useState } from 'react';
import '../styles/effects.css';

const letters = ['B', 'A', 'R', 'E', 'A', 'Y', 'A'];

const Preloader = () => {
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      window.brPreloaded = true;
      window.dispatchEvent(new Event('br-preloader-done'));
      setPhase('fading');
    }, 1050);

    const goneTimer = setTimeout(() => setPhase('gone'), 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div className={`br-preloader${phase === 'fading' ? ' br-preloader--fading' : ''}`} aria-hidden="true">
      <div className="br-preloader-inner">
        <div className="br-preloader-ring" />
        <div className="br-preloader-text">
          {letters.map((letter, index) => (
            <span key={`${letter}-${index}`} className="br-preloader-letter" style={{ '--d': `${index * 90}ms` }}>
              {letter}
            </span>
          ))}
        </div>
        <p>Loading</p>
      </div>
      <div className="br-preloader-curtains">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

export default Preloader;