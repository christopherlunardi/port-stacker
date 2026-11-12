  // Select/Start: the button itself is a 44px-tall touch box; the little pill you see is a span inside it
  for (const id of ['btnSel', 'btnStart']) {
    const b = document.getElementById(id);
    if (b && !b.querySelector('.cap')) { const c = document.createElement('span'); c.className = 'cap'; c.textContent = b.textContent; b.textContent = ''; b.appendChild(c); }
  }
  const fit = () => { if (typeof resizeScreen === 'function') resizeScreen(); };
  setTimeout(fit, 60); setTimeout(fit, 400);
  addEventListener('orientationchange', () => { setTimeout(fit, 200); setTimeout(fit, 600); });
