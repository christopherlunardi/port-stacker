"""Sum up playtest-bot runs (game/tools/probot.js output, one JSON line per game) per tier and per stage.
usage: python3 -I game/tools/botreport.py OUT.json run1.jsonl run2.jsonl ...
"""
import json, sys, collections, statistics as st
out, files = sys.argv[1], sys.argv[2:]
games = [json.loads(l) for f in files for l in open(f) if l.strip()]
PAR = 90  # the game's par (PAR_SECS in 09-game.js; it was 120 in the first bot runs)
def mean(xs): return round(st.mean(xs), 1) if xs else None
rep = {'games': len(games), 'tiers': {}}
order = sorted({s['label'] for g in games for s in g['stages']}, key=lambda l: (int(l.split()[0][2:]) if l.startswith('OT') else 0,) + tuple(map(int, l.split()[-1].split('-'))))
for tier in ['novice', 'good', 'expert', 'elite']:
  G = [g for g in games if g['tier'] == tier]
  if not G: continue
  T = {'games': len(G), 'score': mean([g['score'] for g in G]), 'best': max(g['score'] for g in G), 'reached': collections.Counter(g['reached'] for g in G), 'stages': {}}
  for lab in order:
    S = [s for g in G for s in g['stages'] if s['label'] == lab]
    if not S: continue
    C = [s for s in S if s.get('cleared')]
    kill = collections.Counter()
    for s in S: kill.update(s['killers'])
    T['stages'][lab] = {
      'name': S[0]['name'], 'played': len(S), 'cleared': len(C), 'stuck': sum(1 for s in S if s.get('stuck')),
      'secs': mean([s['f'] / 60 for s in C]), 'secsMax': round(max([s['f'] / 60 for s in C]), 0) if C else None,
      'underPar': sum(1 for s in C if s['f'] / 60 <= PAR), 'deaths': mean([s['deaths'] for s in S]), 'killers': dict(kill),
      'points': mean([s['total'] for s in C]), 'timeBonus': mean([s['delta'] for s in C]), 'combo': mean([s['combo'] for s in C]),
      'comboMax': max([s['combo'] for s in C]) if C else None, 'riders': mean([s['riders'] for s in C]), 'squash': mean([s['squash'] for s in C]),
      'drop': mean([s['drop'] for s in C]), 'dropMax': max([s['drop'] for s in C]) if C else None, 'horns': mean([s['horns'] for s in C]), 'hornsLeft': mean([s.get('hornsLeft', 0) or 0 for s in C]), 'hornBonus': mean([s.get('hornBonus', 0) or 0 for s in C]),
      'lives': mean([s['earned'] for s in S])}
  rep['tiers'][tier] = T
json.dump(rep, open(out, 'w'), indent=1)
for tier, T in rep['tiers'].items():
  print(f"== {tier}: {T['games']} games, avg score {T['score']}, best {T['best']}, reached {dict(T['reached'])}")
  for lab, s in T['stages'].items():
    print(f"  {lab} {s['name']:<14} clear {s['cleared']}/{s['played']} stuck {s['stuck']}  {s['secs']}s (max {s['secsMax']}, under par {s['underPar']})  deaths {s['deaths']} {s['killers']}  pts {s['points']} time {s['timeBonus']}  combo {s['combo']}/{s['comboMax']}  riders {s['riders']} squash {s['squash']} drop {s['drop']}/{s['dropMax']} horns {s['horns']} left {s['hornsLeft']} hbonus {s['hornBonus']} lives+ {s['lives']}")
