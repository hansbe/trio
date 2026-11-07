import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTrio, thirdCard, findTrios, Game, newDeck } from '../logic.js';

test('81 unike kort', () => {
  assert.equal(new Set(newDeck()).size, 81);
});

test('trio-regel', () => {
  assert.ok(isTrio(0, 31, 62));
  assert.ok(!isTrio(9, 13, 44));
  assert.ok(!isTrio(0, 0, 0));
});

test('thirdCard fullfører alltid en trio, og det finnes 1080 trioer', () => {
  let count = 0;
  for (let a = 0; a < 81; a++) for (let b = a + 1; b < 81; b++) {
    const c = thirdCard(a, b);
    assert.ok(isTrio(a, b, c));
    if (c > b) count++;
  }
  assert.equal(count, 1080);
});

test('findTrios stemmer med brute force', () => {
  const board = newDeck().slice(0, 15);
  let brute = 0;
  for (let i = 0; i < 15; i++) for (let j = i + 1; j < 15; j++) for (let k = j + 1; k < 15; k++)
    if (isTrio(board[i], board[j], board[k])) brute++;
  assert.equal(findTrios(board).length, brute);
});

test('fulle spill går opp uten tapte eller dupliserte kort', () => {
  for (let run = 0; run < 300; run++) {
    const g = new Game();
    while (!g.over) {
      assert.ok(findTrios(g.board).length > 0);
      const all = [...g.board, ...g.deck];
      assert.equal(new Set(all).size, all.length);
      assert.equal(all.length + g.found * 3, 81);
      const res = g.take(findTrios(g.board)[0]);
      assert.ok(res.ok);
      assert.ok(g.board.length % 3 === 0);
      if (g.deck.length) assert.ok(g.board.length >= 12);
    }
    assert.equal(g.deck.length, 0);
  }
});

test('ugyldig valg endrer ikke bordet', () => {
  const g = new Game();
  const before = [...g.board];
  let bad = null;
  outer: for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++)
    if (!isTrio(g.board[i], g.board[j], g.board[k])) { bad = [i, j, k]; break outer; }
  assert.equal(g.take(bad).ok, false);
  assert.deepEqual(g.board, before);
});
