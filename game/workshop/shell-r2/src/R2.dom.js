  // real halftone washes, drawn once per size: dots that grow, each ink on its own screen angle
  const ht = document.createElement('canvas'); ht.className = 'halftone'; document.body.insertBefore(ht, document.body.firstChild);
  const drawHT = () => {
    const d = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    ht.width = W * d; ht.height = H * d;
    const c = ht.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
    const wash = (col, ang, step, f) => {
      c.fillStyle = col; const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.hypot(W, H);
      for (let u = -R; u < R; u += step) for (let v = -R; v < R; v += step) {
        const x = W / 2 + u * ca - v * sa, y = H / 2 + u * sa + v * ca;
        if (x < -step || y < -step || x > W + step || y > H + step) continue;
        const r = step * .62 * Math.sqrt(Math.max(0, Math.min(1, f(x / W, y / H))));
        if (r > .35) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      }
    };
    const up = H > W, tp = document.querySelector('.top'), y0 = tp ? tp.getBoundingClientRect().bottom / H + .012 : .36;   // washes start under the name strip
    wash('rgba(255,72,176,.62)', .26, 9, (x, y) => up ? (y - .58) * 1.9 : Math.max(0, y * 3.2 - .5) * Math.max(0, .34 - x * 2.2 + (y - .5) * .5) + Math.max(0, (y - .78) * 1.2));
    wash('rgba(38,86,196,.5)', 1.31, 8, (x, y) => up ? (y0 + .3 - y) * .85 * (y > y0 ? 1 : 0) * (.35 + x * .8) : Math.max(0, .36 - (1 - x) * 2.2 + (.5 - y) * .5));
    wash('rgba(255,226,0,.8)', 0, 10, (x, y) => up ? (y - .86) * 3.2 * (1 - x * .5) : 0);
  };
  setTimeout(drawHT, 80); addEventListener('resize', () => setTimeout(drawHT, 120));
