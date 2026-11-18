/* main.js — start the city behind the intro, then let the visitor step in. */
(function () {
  const E = Rome.engine, intro = document.getElementById('intro');
  const begin = () => {
    intro.classList.add('gone'); E.setPaused(false); E.openGate();
    setTimeout(() => (intro.hidden = true), 900);
  };
  const go = async () => {
    await E.start();
    E.setPaused(true);
    document.getElementById('intro-begin').onclick = begin;
    document.getElementById('intro-resume').onclick = () => { begin(); Rome.ui.openResume(); };
    document.getElementById('intro-begin').focus({ preventScroll: true });
    if (location.hash === '#resume' || new URLSearchParams(location.search).get('skipintro')) { intro.hidden = true; E.setPaused(false); E.openGate(); }
  };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(go);
  else go();
})();
