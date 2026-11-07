// Spillogikk for Trio – ren JavaScript uten avhengigheter.
// Hvert kort er et tall 0–80. Egenskapene er sifrene i base 3:
//   antall (1–3), form, farge og fyll – hver med verdi 0, 1 eller 2.

export const ATTRS = ['count', 'shape', 'color', 'fill'];

export function cardAttrs(id) {
  return {
    count: id % 3,
    shape: Math.floor(id / 3) % 3,
    color: Math.floor(id / 9) % 3,
    fill: Math.floor(id / 27) % 3,
  };
}

/** Tre kort er en trio når hver egenskap er enten lik på alle eller ulik på alle. */
export function isTrio(a, b, c) {
  if (a === b || b === c || a === c) return false;
  const A = cardAttrs(a), B = cardAttrs(b), C = cardAttrs(c);
  return ATTRS.every((k) => (A[k] + B[k] + C[k]) % 3 === 0);
}

/** Det tredje kortet som fullfører en trio med a og b. */
export function thirdCard(a, b) {
  const A = cardAttrs(a), B = cardAttrs(b);
  const v = (k) => (6 - A[k] - B[k]) % 3;
  return v('count') + 3 * v('shape') + 9 * v('color') + 27 * v('fill');
}

/** Finn alle trioer blant kortene (null-plasser hoppes over). Returnerer indeks-tripler. */
export function findTrios(board) {
  const found = [];
  const pos = new Map();
  board.forEach((c, i) => { if (c != null) pos.set(c, i); });
  for (let i = 0; i < board.length; i++) {
    if (board[i] == null) continue;
    for (let j = i + 1; j < board.length; j++) {
      if (board[j] == null) continue;
      const k = pos.get(thirdCard(board[i], board[j]));
      if (k !== undefined && k > j) found.push([i, j, k]);
    }
  }
  return found;
}

export function newDeck(random = Math.random) {
  const deck = Array.from({ length: 81 }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Spilltilstand. board er en liste med kort-id-er.
 * Etter hver handling sørger vi for at bordet har minst én trio
 * (eller at bunken er tom, og spillet er slutt).
 */
export class Game {
  constructor(random = Math.random) {
    this.deck = newDeck(random);
    this.board = this.deck.splice(0, 12);
    this.found = 0;
    this.extraDeals = 0;
    this.ensureTrio();
  }

  /** Legger ut tre og tre kort til det finnes en trio. Returnerer antall ekstra kort lagt ut. */
  ensureTrio() {
    let added = 0;
    while (findTrios(this.board).length === 0 && this.deck.length > 0) {
      this.board.push(...this.deck.splice(0, 3));
      added += 3;
    }
    if (added) this.extraDeals += added / 3;
    return added;
  }

  get over() {
    return this.deck.length === 0 && findTrios(this.board).length === 0;
  }

  /** Prøv tre posisjoner. Returnerer { ok, added } */
  take(indices) {
    const [a, b, c] = indices.map((i) => this.board[i]);
    if (indices.length !== 3 || !isTrio(a, b, c)) return { ok: false, added: 0 };
    this.found++;
    const sorted = [...indices].sort((x, y) => x - y);
    if (this.board.length > 12 || this.deck.length === 0) {
      // Fjern kortene; flytt de siste kortene inn i hullene så rekkefølgen holder seg rolig.
      const keep = this.board.filter((_, i) => !sorted.includes(i));
      if (this.board.length > 12 && keep.length >= 12) {
        // Fyll hullene med kort fra slutten av bordet
        const tail = this.board.slice(keep.length).filter((_, i) => !sorted.includes(i + keep.length));
        const next = this.board.slice(0, keep.length);
        for (const i of sorted) if (i < keep.length) next[i] = tail.shift();
        this.board = next;
      } else {
        this.board = keep;
      }
    } else {
      for (const i of sorted) this.board[i] = this.deck.shift();
    }
    const added = this.ensureTrio();
    return { ok: true, added };
  }
}
