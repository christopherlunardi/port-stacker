// C: they spin: the real stars spin round on the spot, each at its own pace, with a little bob; the gull's feathers tumble
DIZ.move = (b, i, n, t) => ({ rot: t * (0.09 + 0.025 * i) * (i & 1 ? -1 : 1), dy: Math.sin(t * 0.1 + i * 2) * 0.8 });
