// Option B: SCRAPPY CARTOON TROUBLEMAKERS. Angry eyebrows and attitude: a hunched gull with a big hooked beak and a scowl,
// a wide pink crab with both claws up like fists, flat brows and gritted teeth, and a skinny violet rat with a long snout, bared tooth and whip tail.
// Stun restyled: they flash paper-white with a yellow dizzy spiral and pink stars; spawn blink and ride wobble kept.
C.vio = [235, 125, 0]; SLET.v = 'vio';
SPRITES.gull0 = [
  '........bbbbb...',
  '.......bwwwwwbb.',
  '......bbbwbwwbyb',
  '.....bwwwwwwbyyb',
  '...bbwwwwwwwbyb.',
  '.bbwwwwwwwwwbb..',
  'bBBwwwwwwwwwb...',
  'bBBBBwwwwwwb....',
  '.bBBBBBwwwwb....',
  '..bbBBBBwwwb....',
  '....bbbbbbb.....',
  '.....by.yb......',
  '....byy.yyb.....',
];
SPRITES.gull1 = [
  '........bbbbb...',
  '.......bwwwwwbb.',
  '......bbbwbwwbyb',
  'bb...bwwwwwwbyyb',
  'bBbbbwwwwwwwbyb.',
  'bBBBwwwwwwwwbb..',
  '.bBBBwwwwwwwb...',
  '.bBBBBwwwwwwb...',
  '..bBBBBwwwwb....',
  '...bbBBBwwwb....',
  '....bbbbbbb.....',
  '......byyb......',
  '.....byyyyb.....',
];
SPRITES.crab0 = [
  '.bbb.......bbb..',
  'bpppb.....bpppb.',
  'bpbppb...bppbpb.',
  '.bbpppb.bpppbb..',
  '..bppb...bppb...',
  '..bpbbbbbbbpb...',
  '.bbpbbpbbppbb...',
  'bpppwbpwbpppppb.',
  'bppppppppppppppb',
  'bppwbwbwbwbwbppb',
  'bLLppppppppppLLb',
  '.bbbbbbbbbbbbbb.',
  '.b.b.b....b.b.b.',
];
SPRITES.crab1 = [
  '.bbb............',
  'bpppb......bbb..',
  'bpbppb....bpppb.',
  '.bbpppb...bppbpb',
  '..bppb...bpppbb.',
  '..bpbbbbbbbppb..',
  '.bbpbbpbbppbb...',
  'bpppwbpwbpppppb.',
  'bppppppppppppppb',
  'bppwbwbwbwbwbppb',
  'bLLppppppppppLLb',
  '.bbbbbbbbbbbbbb.',
  'b.b.b.b..b.b.b.b',
];
SPRITES.rat0 = [
  '.....bb.bb......',
  '....bpvbpvb.....',
  '....bvvvvvbb....',
  '...bvvvvvvbvvb..',
  '..bvvvvvvbwwbvb.',
  '.bvvvvvvvbwbbvvb',
  'bvvvvvvvvbbbvbpb',
  'bvvvvvvvvvvvbbb.',
  '.bvvvwwwvvvvbwb.',
  '.bvvwwwwwvvvbb..',
  'bbbbwwwwwvvvb...',
  'bpb.bbbbbbbb....',
  'bbb.bpb.bpb.....',
];
SPRITES.rat1 = [
  '.....bb.bb......',
  '....bpvbpvb.....',
  '....bvvvvvbb....',
  '...bvvvvvvbvvb..',
  '..bvvvvvvbwwbvb.',
  'bbvvvvvvvbwbbvvb',
  'bpbvvvvvvbbbvbpb',
  'bpbvvvvvvvvvbbb.',
  '.bbvvwwwvvvvbwb.',
  '..bvwwwwwvvvbb..',
  '...bwwwwwvvvb...',
  '....bbbbbbbb....',
  '.....bpbbpb.....',
];
drawEnemy = function (e) {
  const base = e.type + ((e.anim >> 3) & 1);
  if (e.state === 'spawn') { if ((e.t >> 2) & 1) spr(base, e.x, e.y, e.dx < 0, C.yel); return; }
  if (e.state === 'stun') {
    spr(base, e.x, e.y, e.dx < 0, ((G.frame >> 3) & 1) ? C.paper : null);
    for (let k = 0; k < 12; k++) { const a = G.frame * 0.12 + k * 0.52; const r = 3 + k * 0.45; // a dizzy spiral over the head
      paint(Math.round(e.x + Math.cos(a) * r), Math.round(e.y - 17 + Math.sin(a) * r * 0.5), k & 1 ? C.yel : C.pink); }
    for (let k = 0; k < 3; k++) { const a = G.frame * 0.15 + k * 2.1; box(Math.round(e.x + Math.cos(a) * 8), Math.round(e.y - 17 + Math.sin(a) * 3), 2, 2, C.pink); }
    return;
  }
  spr(base, e.x + (e.state === 'ride' ? ((G.frame >> 1) & 1) : 0), e.y, e.dx < 0);
  if (DEV.hitboxes) { box(e.x - 9, e.y - 10, 18, 1, C.pink); box(e.x - 9, e.y, 18, 1, C.pink); }
};
