// shell A: The navy, tidied
(() => {
  const s = document.createElement('style');
  s.textContent = '/* shared by every option in this round: sideways on a phone the game is 4:3 with the controller on its sides (Chris 2026-11-10: the\n   16:9 sideways screen was for checking the Pocket 6 layout; that can be checked on desktop instead) */\n@media (pointer:coarse) and (orientation:landscape){\n  #console{grid-template-columns:1fr auto 1fr;grid-template-rows:1fr auto;grid-template-areas:"dpadA screen btnA" "selA screen startA";align-items:center;justify-items:center;gap:6px 14px;padding-block:max(10px, env(safe-area-inset-top, 0px)) max(10px, env(safe-area-inset-bottom, 0px));max-width:none}\n  .top{display:none}\n  .pad{display:contents}\n  .pills{display:contents}\n  #btnSel{grid-area:selA;align-self:start}\n  #btnStart{grid-area:startA;align-self:start}\n  #screenWrap{aspect-ratio:4/3;width:auto;max-width:none;height:min(calc(100dvh - 20px), calc((100vw - 330px) * 3 / 4));height:min(calc(100vh - 20px), calc((100vw - 330px) * 3 / 4))}\n  .dpad,.btns{zoom:.86}\n}\n\n@media (pointer:coarse) and (orientation:portrait){\n  #console{grid-template-rows:auto auto 1fr;grid-template-areas:"top" "screen" "pad";align-content:stretch}\n  .pad{align-self:center;max-width:430px}\n}\n';
  document.head.appendChild(s);

  setTimeout(() => { if (typeof resizeScreen === 'function') resizeScreen(); }, 60);
  addEventListener('orientationchange', () => setTimeout(() => { if (typeof resizeScreen === 'function') resizeScreen(); }, 200));
})();
