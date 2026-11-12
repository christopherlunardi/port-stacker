// ---------- HOW TO PLAY and the ENCYCLOPEDIA (Chris 2026-11-11: How to Play was "waaaay too complicated": it's now just the basics,
// short and clean, a few cards; everything else is in the ENCYCLOPEDIA, its own line on the title menu, which is the old full How to Play).
// Both books use the same live demos. BASICS (below HOWTO) borrows its demos from HOWTO topics.
// ---------- (the full guide, Chris 2026-11-08): off the title menu. Categories down the left; for the chosen one, a card explains it and the
// real game runs behind, scripted to show exactly that thing happening, on a loop. Everything here is the live engine (same catwalks,
// containers, enemies, scoring), so a demo can't drift from the game; the fast test 'howto' checks each one still shows what it says.
// KEEP IT CURRENT: when a mechanic, number or control changes, change its topic's text (and its demo) in the same build.
//
// A topic: name (the list), title, text (wrapped to the card), level (which stage's layout), setup() (who's where), steps (the script:
// each step holds buttons until a condition, presses once, waits, or does something), expect (a pop-up the fast test looks for).

function PLAYING() {
  // the game is running: in play, or one of How to Play's live demos
  return G.state === 'play' || G.state === 'howto';
}
function demoEnemy(type, x, row, dx, speed) {
  const D = ENEMY_DEF[type];
  return {
    type,
    x,
    y: rowY(row),
    dx,
    dy: 0,
    acc: 0,
    speed: speed != null ? speed : D.speed,
    chase: D.chase,
    state: 'walk',
    t: 0,
    anim: 0,
    rideOff: 0,
    mode: 'patrol',
    mt: 0,
    dist: 0
  };
}
function onlyPieces(fn) {
  // keep just the containers the demo needs
  G.pieces = G.pieces.filter(fn);
}
// topics in the order you need them (Chris 2026-11-08): the basics, the horn, the first enemy, the ways to score, then what later stages bring
const HOWTO = [
  {
    name: 'OVERVIEW',
    title: 'LOAD THE SHIP',
    text: "Your job: load the ship. Walk across a container to knock it down to the catwalk below, and keep knocking it down until it lands in the ship's bay underneath its column. Fill every bay and the ship sails: stage clear. The dock pests try to catch you: touch a walking one and you lose a life (but once the last container is on its way down, you're safe). You have 3 spare lives (bottom left). After losing one you blink for a moment and can't be caught. A stunned enemy, or one riding a container, can't hurt you. When the ship is loaded, a card shows how the stage went; press A for the next one. Stages come in shifts, numbered shift-stage: shift 1 is three stages, shift 2 replays them at night and adds Pier 9 (2-4), and shift 3, the storm shift, adds the finale, Last Call (3-5).",
    setup() {
      onlyPieces(pc => pc.c === 20 && pc.row === 19);
      Object.assign(G.p, { x: 146, y: rowY(19), face: 1 });
    },
    steps: [{ wait: 30 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 170 }]
  },
  {
    name: 'CONTROLS',
    title: 'CONTROLS',
    text: "D-PAD: walk left and right along the catwalks. At a ladder, press up or down to climb, and step off at any catwalk the ladder crosses. A: blow the air horn the way you face (hold up or down on its own to blast up or down). B: dash, a short burst of speed the way you're moving. It's ready again in about two-thirds of a second. START: pause (resume, restart the game from 1-1, sound, music, print look, info, quit; restarting or quitting asks you to press A again).",
    setup() {
      G.pieces = [];
      Object.assign(G.p, { x: 210, y: rowY(19), face: 1 });
    },
    steps: [
      { held: { right: 1 }, until: p => p.x >= 244 },
      { held: { up: 1 }, until: p => p.y <= rowY(14) },
      { wait: 10 },
      { held: { right: 1 }, press: 'b', until: p => p.x >= 300 },
      { wait: 15 },
      { press: 'a' },
      { wait: 90 }
    ]
  },
  {
    name: 'DROPPING',
    title: 'DROPPING CONTAINERS',
    text: "Every container is four panels wide, with a lamp on each panel. Walk over a panel and its lamp lights. Light all four and the container falls to the next catwalk below (if there's a gap under it, it falls past to the next whole catwalk). When it lands its lamps go out, and you walk it again to send it further down. Each landing is worth 50 points. The last drop lands it in the ship's bay under its column. Fill a bay (every container from that column) for a 1,000 point bonus and one more horn.",
    setup() {
      onlyPieces(pc => pc.c === 20 && pc.row === 9);
      Object.assign(G.p, { x: 146, y: rowY(9), face: 1 });
    },
    steps: [{ wait: 20 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 150 }],
    expect: /^50$/
  },
  {
    name: 'THE HORN',
    title: 'THE AIR HORN',
    text: "Press A to blow the air horn. It blasts the way you face, most of a container's width, and a little way behind you too: it catches anyone in front of you, even a guy climbing up onto your catwalk. Hold up or down (on its own) to blast at the catwalk above or below instead; on a ladder it blasts up or down. An enemy it hits is stunned for about two and a half seconds: he can't hurt you, so walk through him or across his container. Horn him again and it starts over. Every stage starts you with at least 5 horns (count bottom right; you keep any extra). During a stage, the only way to get more is to fill a bay: one more horn each. Horns you still have when the ship is loaded are worth a big bonus on the SHIP LOADED card: 2,000 each, times the shift number (see WHAT'S IT WORTH). Each enemy it stuns counts toward your combo.",
    setup() {
      G.pieces = [];
      Object.assign(G.p, { x: 196, y: rowY(19), face: 1 });
      G.enemies = [demoEnemy('pratt', 300, 19, -1)];
    },
    steps: [
      { until: () => G.enemies[0].x - G.p.x < 30 },
      { press: 'a' },
      { wait: 24 },
      { held: { right: 1 }, until: p => p.x >= 300 }, // walks straight through the stunned Pratt
      { wait: 100 }
    ] // (the crane's horn-refill crate the demo used to grab is off in the game: a full bay is the one way to get a horn)
  },
  {
    name: 'PRATT',
    title: 'INSPECTOR PRATT',
    text: "Inspector Pratt comes out of the doors in the top corners: their lamps light up one by one just before. He walks the catwalks and climbs the ladders, and at every crossing he tends to take the way toward you. He's a lot slower than you on 1-1 and a little quicker each stage until 1-3; after that he stays at that speed. But he never turns round in the middle of a catwalk: get him walking away from you and he's lost you until the next crossing. The dock never runs short, though: whenever an enemy is squashed or rides a container down, a new one of the same kind arrives about 4 seconds later (a door's lamps light up first, or a crab's shadow grows).",
    setup() {
      onlyPieces(pc => pc.row !== 14);
      Object.assign(G.p, { x: 150, y: rowY(14), face: 1 });
      G.enemies = [demoEnemy('pratt', 186, 14, 1)];
    },
    steps: [{ held: { right: 1 }, until: p => p.x >= 214 }, { wait: 200 }]
  },
  {
    name: 'SQUASH',
    title: 'SQUASH',
    text: 'A blue tag on the catwalk under the left end of a container shows a dot for each enemy anywhere below it. A falling container squashes any enemy underneath it, walking or stunned, on a catwalk or partway down a ladder: 2,000 points for Pratt, and each extra enemy squashed by the same container doubles it (2,000, 4,000, 8,000...). Tougher enemies are worth more: a Crab or Watchman 2,500, a Forklift or gull 3,000, and in overtime a quarter more again each overtime. Each one squashed counts as a move toward your combo, and a squashed enemy is gone for good. It takes timing: watch where they walk, then drop the container on them.',
    setup() {
      onlyPieces(pc => pc.c === 20 && pc.row === 9);
      Object.assign(G.p, { x: 146, y: rowY(9), face: 1 });
      G.enemies = [demoEnemy('pratt', 172, 14, 1, 0.3)];
    },
    steps: [{ wait: 20 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 170 }],
    expect: /SQUASH/
  },
  {
    name: 'RIDERS',
    title: 'RIDERS',
    text: 'Any enemy standing on a container when it drops goes down with it as a rider, including one just stepping onto it from a ladder. A pink tag on the catwalk under the right end of the container shows a dot for each enemy who would ride it right now. Every rider makes the container fall one extra catwalk: one rider and it drops two levels, two riders three levels, and so on. On every catwalk it passes it knocks down any container resting there, too. When it lands, the riders are gone for good and you score: one rider 300, two 1,500, three 6,000, four 20,000 (for Pratts; tougher riders pay more, like squashes). Each rider also counts as a move toward your combo. The trick: lure them onto a container, or stun them on it with the horn, then walk across.',
    setup() {
      onlyPieces(pc => pc.c === 20 && pc.row === 9);
      Object.assign(G.p, { x: 150, y: rowY(9), face: 1 });
      G.enemies = [demoEnemy('pratt', 196, 9, -1)];
    },
    steps: [{ wait: 28 }, { press: 'a' }, { wait: 16 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 170 }],
    expect: /RIDER/
  },
  {
    name: 'POWER CRATE',
    title: 'THE POWER CRATE',
    text: "Once a stage (from 1-2 on), when the ship is half loaded, the crane lowers a container that shimmers like a hologram onto a free spot on a catwalk. It works like any other container: walk across it and it drops, enemies on it ride it down, it knocks down a container it lands on and squashes anyone under it. But it isn't part of the ship's load: the moment it drops you get POWER RUSH for 10 seconds, and wherever it ends up it shatters. You shine the same way, run faster, can't be hurt, and any enemy you run into is flattened and it builds: 1,000 points for the first, 2,000 for the next, 3,000... (more for tougher ones), each a move toward your combo. A meter over your hat shows what's left, then a 3, 2, 1 countdown. Your combo can't run out while it lasts. Leave the crate alone too long and the crane takes it back.",
    setup() {
      onlyPieces(() => false);
      Object.assign(G.p, { x: 146, y: rowY(9), face: 1 });
      G.pieces.push({
        type: 'yel',
        c: 20,
        x: 160,
        row: 9,
        y: rowY(9),
        segs: new Array(PANELS).fill(0),
        state: 'rest',
        t: 0,
        vy: 0,
        riders: [],
        extra: 0,
        bounce: 0,
        target: null,
        gold: true
      });
      G.enemies = [demoEnemy('pratt', 300, 14, -1)];
    },
    steps: [
      { wait: 30 },
      { held: { right: 1 }, until: p => p.x >= 228 },
      { wait: 50 },
      { held: { right: 1, down: 1 }, until: p => p.y >= rowY(14) || p.x >= 300 },
      { held: { right: 1 }, until: () => !G.enemies.length || G.p.x >= 330 },
      { wait: 90 }
    ],
    expect: /BASH/
  },
  {
    name: 'COMBOS',
    title: 'COMBOS',
    text: "Every move you make adds to your combo: each container landing, each knock-on in a chain, each rider, each enemy squashed, each enemy your horn stuns, and each CLOSE CALL (an enemy within a hair of you, and you get away: 200). Keep making moves and the COMBO count at the bottom, between your lives and horns, climbs (squash two and that's 2; send two riders down and squash two more on the way and it's higher still). Above it, a bar drains: make another move before it empties or the combo ends. Getting caught ends it too. The bar gets shorter as the combo grows (2.5 seconds down to 1). Your points are multiplied as it grows: x2 from the 3rd move, x3 from the 5th, x4 from the 7th, and on with no limit. Bonuses (bay full, ship loaded, time, horns left, no misses) aren't moves: they don't add to the combo and aren't multiplied.",
    setup() {
      onlyPieces(pc => pc.c === 20);
      Object.assign(G.p, { x: 146, y: rowY(4), face: 1 });
      G.enemies = [demoEnemy('pratt', 190, 9, 1, 0)];
      G.enemies[0].state = 'stun';
      G.enemies[0].t = 9999;
    },
    steps: [{ wait: 20 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 230 }],
    expect: /POINTS/
  },
  {
    name: 'THE CAPTAIN',
    title: 'THE CAPTAIN (CRAB)',
    text: "The Captain is a crab who guards one catwalk. A shadow grows where he's about to land, then he drops in from above, always onto a long catwalk, never onto the short pieces of a broken one. He never climbs. He patrols his catwalk, and if you're on it in front of him, he stops and shakes (!), then charges, very fast, for about a container and a half (less if he gets past you or hits the end), and then he has to rest. Run the moment he shakes and you can stay ahead of his charge. Or get off his catwalk by a ladder, horn him, or drop a container on him. Horn him mid-charge and the charge is over: when he thaws he's back to patrolling, and he has to shake again before he can charge.",
    setup() {
      onlyPieces(pc => pc.row !== 14);
      Object.assign(G.p, { x: 160, y: rowY(14), face: 1 });
      G.spawnQ = [{ type: 'crab', t: 120, at: { x: 300, y: rowY(14), door: -1, crab: true } }];
    },
    steps: [
      { until: () => G.enemies.length && G.enemies[0].mode === 'wind' },
      { wait: 10 },
      { held: { left: 1 }, until: p => p.x <= 140 },
      { held: { up: 1 }, until: p => p.y <= rowY(9) },
      { wait: 120 }
    ]
  },
  {
    name: 'CHAINS',
    title: 'CHAINS',
    text: 'If a falling container lands where another container is resting, it knocks that one down, and that one can knock down the next: a chain, sometimes all the way to the ship. The first one stops where the second one was. Every container in the chain scores its own 50 for landing, plus a knock-on bonus that doubles with each one knocked down: DOUBLE KNOCK 100, TRIPLE KNOCK 200, QUAD KNOCK 400 (a column holds four). Every landing in the chain and every knock-on counts as a move, so a long chain builds your combo fast, and the knock-ons are multiplied by it.',
    setup() {
      onlyPieces(pc => pc.c === 20);
      Object.assign(G.p, { x: 146, y: rowY(4), face: 1 });
    },
    steps: [{ wait: 20 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 230 }],
    expect: /TRIPLE KNOCK/
  },
  {
    name: 'PAR TIME',
    title: 'PAR TIME AND SCORING',
    text: "The clock at the top of the screen is the stage's par time: a minute and a half, counting down while you play. Every second left when the ship is loaded is a time bonus: 50 points, times the shift number (overtime keeps counting: OT1's shifts are 4, 5 and 6). Take longer and the clock turns to OVER PAR and counts up, and every second over comes off that stage's points instead (never more than you scored on it). The SHIP LOADED card adds the time bonus, 2,000 for each horn left and 5,000 for NO MISSES if you lost no life on the stage (2,000 for ONE MISS), all times the shift number. Loading the ship is worth 1,000 times the shift number. Extra lives come at 30,000 points, then 80,000, 150,000, 240,000..., each a bit further on: the thin bar under your lives (bottom left) fills up as you get close to the next one.",
    setup() {
      onlyPieces(pc => pc.c === 20 && pc.row === 9);
      Object.assign(G.p, { x: 146, y: rowY(9), face: 1 });
      G.st.f = (parSecs() - 6) * 60; // the clock runs out during the demo
    },
    steps: [{ wait: 20 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 420 }]
  },
  {
    // (Chris 2026-11-09) is a wait for a rider worth the time it costs? a horn? The board turns each thing into seconds of par time
    name: "WHAT'S IT WORTH",
    title: "WHAT'S IT WORTH?",
    text: 'Every second left on the par clock pays 50 points times the shift number, so the board turns everything into seconds. In shift 1 one rider is worth 6 seconds: not worth a long wait. A squash is worth 40, two riders 30, three riders 120, more than the whole par. In later shifts a second pays more, so waiting pays less (watch the bars shrink). A horn you still have when the ship is loaded is worth 40 seconds in every shift, so a horn spent just to freeze one guy costs as much as dawdling for 40 seconds. Spend it when it saves a life or sets up a squash or riders. Your combo multiplies riders and squashes (not the bonuses): at x3 a rider is worth three times as much.',
    setup() {
      G.pieces = [];
      Object.assign(G.p, { x: 196, y: rowY(19), face: 1 });
    },
    steps: [{ wait: 600 }], // three shifts of WORTH_SHOW (defined below, so not used here)
    board: drawWorthBoard
  },
  {
    name: 'BELTS & GAPS',
    title: 'BELTS AND GAPS',
    text: "Some stages change the catwalks. Gaps: you can't walk across a break, so find a ladder round it; containers fall straight past a gap to the next whole catwalk. Conveyor belts (the arrows show which way) carry anyone standing on them: walk with a belt and you're fast, walk against it and you crawl. Enemies get carried too, so a Pratt fighting a belt is easy to slip past, and a crab charging along one is deadly.",
    level: 2,
    setup() {
      onlyPieces(pc => pc.row === 9);
      Object.assign(G.p, { x: 130, y: rowY(9), face: 1 });
    },
    steps: [{ held: { right: 1 }, until: p => p.x >= 300 }, { wait: 20 }, { held: { left: 1 }, until: (p, n) => n >= 120 }, { wait: 40 }]
  },
  {
    name: 'WATCHMAN',
    title: 'THE NIGHT WATCHMAN',
    text: "The Night Watchman joins Pratt on the night shift. Through 2-1 to 2-3 more and more of the walkers are Watchmen, and on 2-4 they all are; from shift 3 on, every walker is a Watchman. He's quicker than Pratt (from a bit quicker on 2-1 to most of your speed on 2-4), and he keeps track of you. If you're on his catwalk behind him, he stops, swings his flashlight round (!) and turns to come after you. He also watches the catwalks just above and below his: if you pass him there and the quickest ladder over to you is behind him, he turns round and heads for it. He never takes a wrong turn, and if you're in his flashlight's beam in front of him, he runs. After turning he can't turn again for about two and a half seconds: that's your chance to slip away. Two catwalks away, he loses you.",
    level: 0,
    loop: 1,
    setup() {
      // Buck walks along the catwalk below him; once the ladder behind the Watchman is the quick way down to Buck, he turns for it
      onlyPieces(pc => pc.row === 4);
      Object.assign(G.p, { x: 330, y: rowY(19), face: -1 });
      G.enemies = [demoEnemy('watch', 150, 14, 1, 0.35)];
    },
    steps: [{ wait: 20 }, { held: { left: 1 }, until: p => p.x <= 112 }, { wait: 200 }]
  },
  {
    name: 'FORKLIFT',
    title: 'THE FORKLIFT',
    text: "The Forklift, a burly dock hand at the wheel of a little forklift, takes over from the Captain on the storm shift: on 3-1 only now and then is a catwalk guard a Forklift; more of them turn up stage by stage, and on the finale, 3-5, they all are. Like the Captain he drops in onto a long catwalk, never climbs, and patrols. When you're on his catwalk in front of him he revs up, shaking, with his beacon flashing (!), for longer than the Captain winds up, so you get more warning. Then he charges flat out, faster than the Captain, and he doesn't stop once he's past you: he drives about two and a half containers (or to the end of the catwalk) before he can turn. Run as soon as he revs and you can get away. Get off his catwalk, horn him, or drop a container on him. Horn him while he revs or charges and it's called off: he has to rev up again.",
    level: 0,
    loop: 2,
    setup() {
      onlyPieces(pc => pc.row !== 14);
      Object.assign(G.p, { x: 160, y: rowY(14), face: 1 });
      G.spawnQ = [{ type: 'fork', t: 120, at: { x: 300, y: rowY(14), door: -1, crab: true } }];
    },
    steps: [
      { until: () => G.enemies.length && G.enemies[0].mode === 'wind' },
      { wait: 20 },
      { held: { left: 1 }, until: p => p.x <= 140 },
      { held: { up: 1 }, until: p => p.y <= rowY(9) },
      { wait: 150 }
    ]
  },
  {
    name: 'THE GULL',
    title: 'THE GULL',
    text: "The Gull joins on the storm shift. He ignores ladders: he flies in from the side of the screen and glides along above the top catwalk, and when you're below him and not too far off, he squawks and dives straight at the spot where you're standing. He lands on that catwalk and struts after you for a moment, then flaps back up and does it again. Keep moving so his dive hits empty catwalk. The horn knocks him out of the air: he drops onto the catwalk below, dizzy. Landed, he can be squashed or sent down as a rider like anyone. There's one on 3-1 to 3-4 and two on the finale, 3-5, and he gets quicker and dives more often as the shift goes on.",
    level: 0,
    loop: 2,
    setup() {
      onlyPieces(pc => pc.row === 4);
      Object.assign(G.p, { x: 300, y: rowY(14), face: -1 });
      G.spawnQ = [];
      spawnGull({ x: -12 });
      G.enemies[0].mt = 30;
    },
    steps: [{ wait: 100 }, { held: { left: 1 }, until: p => p.x <= 120 }, { wait: 160 }]
  },
  {
    name: 'OVERTIME',
    title: 'OVERTIME',
    text: "After the storm shift the work never stops: OVERTIME 1 replays shifts 1, 2 and 3, then OVERTIME 2 does it again, and so on (the orange OT tag beside the stage number says which). Each overtime is reprinted in two new inks: navy and orange, then teal and pink, black and sky blue, purple and gold, then old handheld colours... It's the whole game again, Pratts first, but the enemies start tougher and get tougher faster: quicker walkers, harder guards, sharper Watchmen, more Forklifts and bolder gulls sooner, one more enemy, back sooner. Your horns and par never change. Once the walkers get close to Buck's pace, he gets quicker too (a little less than they do), and a stun and a POWER RUSH get shorter to match. Each overtime, all of it again, harder. Points grow too. How far can you go?",
    level: 0,
    loop: 5,
    setup() {
      onlyPieces(pc => pc.c === 20 && pc.row === 9);
      Object.assign(G.p, { x: 146, y: rowY(9), face: 1 });
    },
    steps: [{ wait: 20 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 150 }]
  }
];
// HOW TO PLAY: the basics, a few short cards over a live demo each (the demo borrowed from the ENCYCLOPEDIA topic named in `from`).
// keys: the buttons the card is about, drawn as chips beside its title. Keep each card to two or three short lines: no scrolling.
const BASICS = [
  [
    'OVERVIEW',
    'LOAD THE SHIP',
    'Walk over a container to knock it down a floor. Keep knocking it down until it lands in the ship. Fill the ship to clear the stage.',
    []
  ],
  ['CONTROLS', 'MOVE', 'The d-pad walks, and climbs the ladders. B is a quick dash.', ['DPAD', 'B']],
  [
    'THE HORN',
    'THE AIR HORN',
    'A blasts your air horn. Enemies it hits freeze, and you can walk right through them. You only get a few, so make them count!',
    ['A']
  ],
  ['PRATT', "DON'T GET CAUGHT", 'Dock pests chase you around the ship. One touch and you lose a life.', []],
  [
    'SQUASH',
    'SQUASH AND RIDE',
    'Drop containers on enemies to squash them (blue tags). Enemies on one that drops RIDE down (pink tags) and it falls a floor further.',
    []
  ],
  ['COMBOS', 'COMBOS', 'Keep scoring without a break to build a combo. The bigger it gets, the more every point is worth.', []],
  [
    'CHAINS',
    "THAT'S THE BASICS!",
    'Every enemy, bonus and trick is in the ENCYCLOPEDIA on the title menu. Press A to open it now.',
    [],
    true
  ]
].map(([from, title, text, keys, guide]) =>
  Object.assign(
    {},
    HOWTO.find(t => t.name === from),
    { name: title, title, text, keys, guide: !!guide }
  )
);
// DON'T GET CAUGHT shows him getting caught (Chris 2026-11-11: "it doesn't even show Buck dying"): a Pratt walks at him, they touch, and he
// goes the way he goes in the game (drawDeath), then the demo starts over. Only this card catches him (`caught`); the others never do.
Object.assign(BASICS[3], {
  caught: true,
  level: 0,
  setup() {
    onlyPieces(pc => pc.row !== 14);
    Object.assign(G.p, { x: 120, y: rowY(14), face: 1 });
    G.enemies = [demoEnemy('pratt', 250, 14, -1)];
  },
  steps: [{ wait: 30 }, { held: { right: 1 }, until: () => G.howDie > 0 }, { wait: 1 }],
  expect: /CAUGHT/
});
// SQUASH AND RIDE shows both (Chris 2026-11-11: riders are very important, put them with squashing): a frozen Pratt on the container rides
// it down, and the Pratt walking underneath gets squashed on the way
Object.assign(BASICS[4], {
  setup() {
    onlyPieces(pc => pc.c === 20 && pc.row === 9);
    Object.assign(G.p, { x: 150, y: rowY(9), face: 1 });
    G.enemies = [demoEnemy('pratt', 196, 9, -1), demoEnemy('pratt', 172, 14, 1, 0.3)];
  },
  steps: [{ wait: 28 }, { press: 'a' }, { wait: 16 }, { held: { right: 1 }, until: p => p.x >= 228 }, { wait: 190 }],
  expect: /RIDER/
});
function book() {
  return G.howBook === 'guide' ? HOWTO : BASICS;
}
function startHowto(which = 'basics') {
  // HOW TO PLAY opens on its first card; the ENCYCLOPEDIA opens on its list of every topic (Chris 2026-11-08: the full-width reading view
  // leads topic to topic with NEXT; B shows the list)
  G.state = 'howto';
  G.howBook = which;
  G.howSel = 0;
  G.howView = which === 'guide' ? 'list' : 'read';
  howScrollReset();
  setupHowto();
}
function setupHowto() {
  const T = book()[G.howSel];
  seed(11 + G.howSel);
  G.score = 0;
  G.lives = 3;
  G.loop = T.loop || 0; // the Watchman's demo is on the night shift
  G.nextLife = LIFE_FIRST;
  G.p = null;
  buildStage(T.level || 0);
  G.spawnQ = [];
  G.enemies = [];
  G.p.inv = 0;
  G.st = { score0: 0, f: 0, squash: 0, riders: 0, combo: 1, horns: 0, deaths: 0, drop: 0 };
  G.dropPts = {};
  T.setup();
  G.demo = { step: 0, n: 0 };
  G.howDie = 0; // (DON'T GET CAUGHT: frames since he was caught)
  G.t = 0;
}
function demoInput() {
  // the scripted buttons for this frame
  const T = book()[G.howSel],
    d = G.demo,
    s = T.steps[d.step];
  if (!s) return null;
  const held = s.held || {},
    pressed = {};
  if (s.press && d.n === 0) pressed[s.press] = true;
  d.n++;
  const done = s.wait != null ? d.n >= s.wait : s.until ? s.until(G.p, d.n) : true;
  if (s.act && d.n === 1) s.act();
  if (done) {
    d.step++;
    d.n = 0;
  }
  return { held, pressed };
}
function updateHowto(inp) {
  // two views (Chris 2026-11-08: the text has to be readable on a phone): the LIST to choose a topic, and READ, where the card takes the
  // whole width with bigger, clearer text; left/right flip topics while reading, up/down scroll a long one
  const P = inp.pressed,
    reading = G.howView === 'read';
  // the text glides to its new place (Chris 2026-11-08: a jump makes you hunt for where you were), and lines that just came into view get a
  // highlight that fades, so you can see how many came in (every scroll, up or down: Chris 2026-11-08)
  G.howClock = (G.howClock || 0) + 1;
  const tgt = G.howScroll || 0;
  G.howSY = Math.abs(tgt - (G.howSY || 0)) < 0.02 ? tgt : (G.howSY || 0) + (tgt - (G.howSY || 0)) * 0.16;
  const B = book(),
    basics = G.howBook !== 'guide';
  const pick = d => {
    G.howSel = (G.howSel + d + B.length) % B.length;
    howScrollReset();
    SFX.move();
    setupHowto();
  };
  if (!reading && (P.up || P.down)) return pick(P.up ? -1 : 1);
  if (reading && P.left && G.howSel > 0) return pick(-1);
  if (basics && P.a && B[G.howSel].guide) {
    SFX.pause(); // the last card: A opens the ENCYCLOPEDIA
    startHowto('guide');
    return;
  }
  if (reading && P.right) {
    if (G.howSel < B.length - 1) return pick(1);
    SFX.pause(); // past the last topic: done, back to the title
    G.state = 'title';
    G.t = TI.logoAt + 60;
    return;
  }
  if (reading && (P.up || P.down)) {
    const was = G.howScroll || 0;
    G.howScroll = Math.max(0, Math.min(G.howMaxScroll || 0, was + (P.down ? 2 : -2))); // two lines a press
    if (G.howScroll !== was) SFX.move();
    // every scroll, either way: the lines that just came into the window get the band
    for (let i = G.howScroll; i < G.howScroll + HOW.lines; i++) if (i < was || i >= was + HOW.lines) G.howNew[i] = G.howClock;
    return;
  }
  if (!reading && (P.a || P.right)) {
    G.howView = 'read';
    howScrollReset();
    SFX.pause();
    return;
  }
  if (P.b || P.start) {
    SFX.pause();
    if (reading && !basics)
      G.howView = 'list'; // (HOW TO PLAY has no list: B goes back to the title)
    else {
      G.state = 'title';
      G.t = TI.logoAt + 60;
    }
    return;
  }
  if (reading && P.a) {
    setupHowto();
    return;
  } // A while reading: watch it again
  if (G.howDie > 0) {
    // caught: everything stops while he goes, then the demo starts over (as in the game, nothing moves but falling containers and pop-ups)
    G.howDie++;
    updatePieces();
    updatePops();
    if (G.howDie > 120) setupHowto();
    return;
  }
  const di = demoInput();
  if (!di) {
    setupHowto();
    return;
  } // the demo's over: round again
  // the play loop, minus pausing, getting caught and clearing the stage (a demo never ends a game)
  updatePlayer(di);
  updateBelts();
  updatePieces();
  updateEnemies();
  updateClouds();
  updateItems();
  updateGold();
  updatePops();
  if (G.comboT > 0 && --G.comboT === 0) G.combo = 0;
  goldBashes();
  G.st.f++; // the par clock runs in the demos too
  if (book()[G.howSel].caught && G.enemies.some(e => e.state === 'walk' && Math.abs(e.x - G.p.x) < 9 && Math.abs(e.y - G.p.y) < 10)) {
    G.howDie = 1; // the same touch that catches him in the game (checkHits)
    G.howDieT = G.t;
    SFX.die();
    addPop(G.p.x, G.p.y - 34, 'CAUGHT!', 'pink');
  }
}
function howScrollReset() {
  G.howScroll = 0;
  G.howSY = 0;
  G.howNew = {};
}
function wrapText(s, w, size, fam = FONT_MAIN) {
  const out = [];
  let line = '';
  for (const word of s.split(' ')) {
    const t = line ? line + ' ' + word : word;
    if (line && textW(fam, t, size) > w) {
      out.push(line);
      line = word;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}
const HOW = { body: 9, lineH: 11.5, lines: 4 }; // the reading card's text size, line spacing and how many lines show before it scrolls
function drawHowto() {
  if (G.howBook !== 'guide') drawBasics();
  else if (G.howView === 'read') drawHowRead();
  else drawHowList();
}
function drawHowList() {
  // ALL TOPICS: a menu in the middle over the dimmed demo (Chris 2026-11-08: reading is the main view, the list is an option)
  const lw = 150,
    lx = (PW - lw) / 2,
    ly = 30,
    lh = PH - ly - 6;
  pg.globalAlpha = 0.45;
  rect(0, FY, PW, PH - FY, C.indigo);
  pg.globalAlpha = 1;
  ropePanel(lx, ly, lw, lh);
  ribbon(lx + lw / 2, ly - 8, 130, 16, C.pink, 'ENCYCLOPEDIA', FONT_MAIN, 9);
  const rowH = (lh - 34) / HOWTO.length;
  HOWTO.forEach((t, i) => {
    const y = ly + 17 + i * rowH,
      sel = i === G.howSel;
    if (sel) {
      rrect(lx + 6, y - rowH / 2 + 1.5, lw - 12, rowH - 3, (rowH - 3) / 2, C.pinkL);
      glyphTri(lx + 14, y, 3.4, 'right', C.pink);
    }
    textF(FONT_MAIN, t.name, lx + 22, y + 0.5, 8.4, sel ? C.pink : C.indigo, 'left', null, { maxW: lw - 30 });
  });
  textF(FONT_BODY, 'A  read   B  title', lx + lw / 2, ly + lh - 10, 8, C.blue, 'center');
}
function drawHowRead() {
  // reading (no ribbon: its tails ran into the title, Chris 2026-11-08): the card along the bottom, the full width, in the reading font; the demo plays above it
  const T = HOWTO[G.howSel],
    x = 4,
    w = PW - 8,
    lines = wrapText(T.text, w - 38, HOW.body, FONT_BODY), // room on the right for the more-below arrow
    show = Math.min(HOW.lines, lines.length),
    h = 30 + show * HOW.lineH + 14,
    y = PH - h - 4;
  G.howMaxScroll = Math.max(0, lines.length - HOW.lines);
  if (T.board) T.board(y);
  const sc = Math.min(G.howSY || 0, G.howMaxScroll),
    top = y + 32;
  ropePanel(x, y, w, h);
  textF(FONT_MAIN, T.title, x + 12, y + 17, 10.5, C.pink, 'left', null, { maxW: w - 70 });
  textF(FONT_MAIN, G.howSel + 1 + ' / ' + HOWTO.length, x + w - 12, y + 17, 7.5, C.blue, 'right');
  // the lines, clipped to the window so they slide in and out under its edges; while it moves, one more line is drawn to fill the gap
  pg.save();
  pg.beginPath();
  pg.rect(x + 6, top - HOW.lineH / 2 - 0.5, w - 16, show * HOW.lineH);
  pg.clip();
  const first = Math.floor(sc),
    moving = sc !== first;
  for (let i = first; i < Math.min(lines.length, first + show + (moving ? 1 : 0)); i++) {
    const ly = top + (i - sc) * HOW.lineH,
      age = G.howNew && G.howNew[i] ? G.howClock - G.howNew[i] : 999;
    if (age < 90) {
      // a new line: a soft band behind it that fades over a second and a half
      pg.globalAlpha = 0.55 * (1 - age / 90);
      rrect(x + 8, ly - HOW.lineH / 2 + 0.5, w - 22, HOW.lineH - 1, 3, C.pinkL);
      pg.globalAlpha = 1;
    }
    textF(FONT_BODY, lines[i], x + 12, ly, HOW.body, C.indigo);
  }
  pg.restore();
  if (G.howScroll < G.howMaxScroll && Math.abs(G.howSY - G.howScroll) < 0.05) {
    // more below: a flashing, bobbing arrow right after the last line's last word (Chris 2026-11-08)
    const li = Math.round(sc) + show - 1,
      ax = x + 12 + textW(FONT_BODY, lines[li], HOW.body) + 9,
      ay = top + (show - 1) * HOW.lineH + (Math.sin(G.howClock * 0.2) > 0 ? 1 : -0.5);
    if ((G.howClock >> 4) % 4 !== 3) glyphTri(Math.min(ax, x + w - 19), ay, 3.6, 'down', C.pink);
  }
  if (G.howMaxScroll) {
    // a scroll bar, and arrows to say there's more
    const bx = x + w - 7,
      by = y + 26,
      bh = show * HOW.lineH;
    rect(bx, by, 2, bh, C.pinkL);
    rect(bx, by + (bh * sc) / lines.length, 2, (bh * show) / lines.length, C.pink);
    if (sc > 0) glyphTri(bx + 1, by - 4, 2.4, 'up', C.pink);
    if (sc < G.howMaxScroll) glyphTri(bx + 1, by + bh + 4, 2.4, 'down', C.pink);
  }
  // the footer: back on the left, NEXT (named, so it's clear there's more to read) on the right, the other buttons between
  const fy = y + h - 9,
    last = G.howSel === HOWTO.length - 1,
    nx = last ? 'DONE' : 'NEXT: ' + HOWTO[G.howSel + 1].name,
    bob = Math.sin(G.t * 0.15) > 0 ? 1 : 0;
  if (G.howSel > 0) {
    glyphTri(x + 14, fy, 3, 'left', C.blue);
    textF(FONT_MAIN, 'BACK', x + 20, fy + 0.5, 7, C.blue);
  }
  textF(FONT_BODY, (G.howMaxScroll ? 'up/down scroll    ' : '') + 'A replay    B all topics', x + w / 2, fy + 0.5, 7.5, C.blue, 'center');
  textF(FONT_MAIN, nx, x + w - 22, fy + 0.5, 8, C.pink, 'right');
  glyphTri(x + w - 15 + bob, fy, 3.4, 'right', C.pink);
}

// HOW TO PLAY's card (Chris 2026-11-11: clean, simple, with visuals): the live demo fills the screen; along the bottom a card with a big
// title, the buttons it's about as chips, two or three short lines in large type, and dots for where you are. No scrolling, no small print.
const BAS = { body: 10.5, lineH: 13.5 };
function keyChip(x, y, k) {
  // a button as you'd see it on the pad: A and B round, the d-pad a cross; returns its width
  if (k === 'DPAD') {
    rrect(x, y - 2.6, 15, 5.2, 1.5, C.indigo);
    rrect(x + 4.9, y - 7.5, 5.2, 15, 1.5, C.indigo);
    return 15;
  }
  pg.beginPath();
  pg.arc(x + 7, y, 7, 0, Math.PI * 2);
  pg.fillStyle = k === 'A' ? C.pink : C.blue;
  pg.fill();
  textF(FONT_MAIN, k, x + 7, y + 0.6, 8, C.cream, 'center');
  return 14;
}
function drawBasics() {
  const B = BASICS,
    T = B[G.howSel],
    x = 6,
    w = PW - 12,
    lines = wrapText(T.text, w - 28, BAS.body, FONT_BODY),
    h = 34 + lines.length * BAS.lineH + 16,
    y = PH - h - 5;
  ropePanel(x, y, w, h);
  textF(FONT_MAIN, T.title, x + 14, y + 18, 12, C.pink, 'left');
  let kx = x + 22 + textW(FONT_MAIN, T.title, 12);
  for (const k of T.keys || []) kx += keyChip(kx, y + 17, k) + 5;
  // where you are: a dot for each card, the current one long and pink
  const n = B.length,
    dx = x + w - 14 - (n - 1) * 8 - 6;
  for (let i = 0; i < n; i++) {
    const cx = dx + i * 8 + (i > G.howSel ? 6 : 0);
    if (i === G.howSel) rrect(cx - 2.5, y + 15.5, 11, 5, 2.5, C.pink);
    else rrect(cx - 2.5, y + 15.5, 5, 5, 2.5, C.pinkL);
  }
  lines.forEach((l, i) => textF(FONT_BODY, l, x + 14, y + 36 + i * BAS.lineH, BAS.body, C.indigo));
  const fy = y + h - 10,
    bob = Math.sin(G.t * 0.15) > 0 ? 1 : 0,
    last = G.howSel === n - 1;
  if (G.howSel > 0) {
    glyphTri(x + 15, fy, 3, 'left', C.blue);
    textF(FONT_MAIN, 'BACK', x + 21, fy + 0.5, 7, C.blue);
  }
  textF(FONT_BODY, 'B  title', x + w / 2, fy + 0.5, 7.5, C.blue, 'center');
  const nx = T.guide ? 'A  ENCYCLOPEDIA' : last ? 'DONE' : 'NEXT';
  textF(FONT_MAIN, nx, x + w - 22, fy + 0.5, 8, C.pink, 'right');
  glyphTri(x + w - 15 + bob, fy, 3.4, 'right', C.pink);
}

// WHAT'S IT WORTH (Chris 2026-11-09): a board over the demo, everything you can score as seconds of par time, one shift at a time:
// each shift's seconds pay more, so the bars shrink from shift 1 to 3 (a horn kept stays 40 seconds). Bars are on a scale of the whole par: a bar past it is worth more than the par.
const WORTH_SHOW = 200; // frames each shift shows
const WORTH_ROWS = [
  ['ONE RIDER', 300],
  ['TWO RIDERS', 1500],
  ['THREE RIDERS', 6000],
  ['FOUR RIDERS', 20000],
  ['SQUASH A PRATT', 2000],
  ['1ST BASH IN A RUSH', 1000],
  ['5TH BASH IN A RUSH', 5000],
  ['FILL A BAY', 1000],
  ['A HORN KEPT', 'horn']
];
function drawWorthBoard(cardY) {
  const ph = Math.floor(G.t / WORTH_SHOW) % 3,
    k = Math.min(1, (G.t % WORTH_SHOW) / 24), // the bars grow in at the start of each shift
    grow = k * k * (3 - 2 * k),
    shift = ph + 1,
    rate = TIME_RATE * shift;
  pg.globalAlpha = 0.6;
  rect(0, FY, PW, cardY - FY, C.indigo);
  pg.globalAlpha = 1;
  const w = 300,
    x = (PW - w) / 2,
    top = FY + 8,
    rowH = Math.min(15, (cardY - top - 52) / WORTH_ROWS.length),
    h = 40 + rowH * WORTH_ROWS.length,
    lx = x + 12,
    bx = x + 116,
    bw = w - 116 - 46,
    full = parSecs();
  ropePanel(x, top, w, h);
  textF(FONT_MAIN, 'SHIFT ' + shift, lx, top + 14, 10, C.pink);
  textF(FONT_BODY, '1 SECOND = ' + rate + ' POINTS', x + w - 12, top + 14, 8, C.blue, 'right');
  // the scale: tick marks every 30 seconds, the far end is the whole par
  for (let s2 = 0; s2 <= full; s2 += 30) {
    const tx = bx + (bw * s2) / full;
    rect(tx, top + 23, 0.6, h - 30, C.pinkL);
    textF(FONT_BODY, s2 ? s2 + 's' : '0', tx, top + 27, 6, C.blue, 'center');
  }
  WORTH_ROWS.forEach(([name, pts], i) => {
    const y = top + 38 + i * rowH,
      secs = pts === 'horn' ? (HORN_BONUS * shift) / rate : pts / rate,
      len = (bw * Math.min(secs, full) * grow) / full,
      over = secs > full;
    textF(FONT_MAIN, name, lx, y + 0.5, 6.8, C.indigo, 'left', null, { maxW: bx - lx - 6 });
    rrect(bx, y - rowH * 0.32, Math.max(1.5, len), rowH * 0.64, 2, pts === 'horn' ? C.yel : over ? C.pink : C.blue);
    if (over && grow >= 1 && (G.t >> 3) % 2) glyphTri(bx + bw + 4, y, 3, 'right', C.pink); // off the chart
    const lbl = (secs >= 10 ? Math.round(secs) : Math.round(secs * 10) / 10) + 's';
    textF(FONT_MAIN, lbl, x + w - 12, y + 0.5, 7.5, pts === 'horn' ? C.yelD : C.indigo, 'right');
  });
}
