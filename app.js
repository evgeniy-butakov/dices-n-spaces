(() => {
  const COLORS = { 0: "#0a122a", 1: "#ff4d6d", 2: "#4dd6ff" };

  const ui = {
    // drawer
    menuBtn: document.getElementById("menuBtn"),
    drawer: document.getElementById("drawer"),
    overlay: document.getElementById("overlay"),
    closeDrawer: document.getElementById("closeDrawer"),

    // settings
    nameP1: document.getElementById("nameP1"),
    nameP2: document.getElementById("nameP2"),
    w: document.getElementById("w"),
    h: document.getElementById("h"),
    corner: document.getElementById("corner"),

    // main buttons
    newGame: document.getElementById("newGame"),
    roll: document.getElementById("roll"),
    swap: document.getElementById("swap"),
    skip: document.getElementById("skip"),

    // HUD
    turn: document.getElementById("turn"),
    orient: document.getElementById("orient"),
    mode: document.getElementById("mode"),
    msg: document.getElementById("msg"),
    viewMode: document.getElementById("viewMode"),

    // dice UI
    dieA: document.getElementById("dieA"),
    dieB: document.getElementById("dieB"),
    dieAGrid: document.getElementById("dieAGrid"),
    dieBGrid: document.getElementById("dieBGrid"),

    // top score + names
    nameP1Top: document.getElementById("nameP1Top"),
    nameP2Top: document.getElementById("nameP2Top"),
    scoreP1: document.getElementById("scoreP1"),
    scoreP2: document.getElementById("scoreP2"),
    freeTop: document.getElementById("freeTop"),

    // canvas
    cv: document.getElementById("cv"),
    canvasWrap: document.querySelector(".canvasWrap"),
    canvasPanel: document.querySelector(".canvasPanel"),
    canvasHeader: document.querySelector(".canvasHeader"),

    // log
    gotoN: document.getElementById("gotoN"),
    gotoBtn: document.getElementById("gotoBtn"),
    backLive: document.getElementById("backLive"),
    logBox: document.getElementById("logBox"),

    // json
    exportBtn: document.getElementById("exportBtn"),
    loadBtn: document.getElementById("loadBtn"),
    copyBtn: document.getElementById("copyBtn"),
    jsonArea: document.getElementById("jsonArea"),
  };

  const ctx = ui.cv.getContext("2d");

  let W = 50, H = 50, CELL = 12;
  let grid = []; // 0 empty, 1 p1, 2 p2

  let p1Corner = "TL", p2Corner = "BR";
  let starts = { 1: { x: 0, y: 0 }, 2: { x: 0, y: 0 } };

  let playerNames = { 1: "Игрок 1", 2: "Игрок 2" };

  let currentPlayer = 1;
  let dice = null;          // {a,b}
  let oriented = null;      // {w,h}
  let swapped = false;
  let isKush = false;

  let hover = null;
  let gameOver = false;

  // ===== logging / history =====
  let moves = [];           // moves[0] = init snapshot
  let viewIndex = null;     // null -> LIVE; else show snapshot #viewIndex
  let liveState = null;

  // ===== roll animation state =====
  let rolling = false;
  let rollTimer = null;
  let rollFinalizeTimer = null;

  // ===== autoscale scheduling =====
  let resizeRaf = 0;

  function nowISO() { try { return new Date().toISOString(); } catch { return ""; } }
  function snapshotGrid(g = grid) { return g.join(""); }
  function restoreGridFromSnap(s) {
    const arr = new Array(W * H);
    for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i) - 48;
    return arr;
  }

  function openDrawer() {
    ui.drawer.classList.add("open");
    ui.drawer.setAttribute("aria-hidden", "false");
    ui.overlay.hidden = false;
  }
  function closeDrawer() {
    ui.drawer.classList.remove("open");
    ui.drawer.setAttribute("aria-hidden", "true");
    ui.overlay.hidden = true;
  }

  ui.menuBtn?.addEventListener("click", openDrawer);
  ui.closeDrawer?.addEventListener("click", closeDrawer);
  ui.overlay?.addEventListener("click", closeDrawer);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  function safeName(s, fallback) {
    const t = String(s ?? "").trim().slice(0, 24);
    return t.length ? t : fallback;
  }
  function pName(p) { return playerNames[p] || `Игрок ${p}`; }
  function setMsg(t) { ui.msg.textContent = t; }

  // ======= AUTOSCALE (FIXED) =======
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function layoutRightPanelToFillViewport() {
    // Цель: правая панель (canvasPanel) занимает всю видимую область до низа окна
    if (!ui.canvasPanel || !ui.canvasWrap) return;

    const panelRect = ui.canvasPanel.getBoundingClientRect();

    // сколько места от верха панели до низа окна
    // маленький запас 14px, чтобы не упираться в край
    const targetH = Math.floor(window.innerHeight - panelRect.top - 14);
    const finalH = Math.max(320, targetH);

    ui.canvasPanel.style.height = `${finalH}px`;

    // canvasWrap должен заполнить остаток под header
    const headerH = ui.canvasHeader ? ui.canvasHeader.getBoundingClientRect().height : 0;

    // Внутри canvasWrap есть padding 12px (CSS) — оставляем место
    const wrapH = Math.max(120, Math.floor(finalH - headerH));
    ui.canvasWrap.style.height = `${wrapH}px`;
  }

  function computeCellSizeToFitWrap() {
    if (!ui.canvasWrap) return;

    // Реальные размеры клиента (после layoutRightPanelToFillViewport)
    const availW = ui.canvasWrap.clientWidth - 24;   // padding 12 + 12
    const availH = ui.canvasWrap.clientHeight - 24;  // padding 12 + 12

    if (availW < 10 || availH < 10) return;

    const cellByW = Math.floor(availW / W);
    const cellByH = Math.floor(availH / H);

    // ограничение читаемости
    CELL = clamp(Math.min(cellByW, cellByH), 6, 30);

    if (!Number.isFinite(CELL) || CELL < 1) CELL = 6;
  }

  function resizeCanvasToFit() {
    layoutRightPanelToFillViewport();
    computeCellSizeToFitWrap();
    ui.cv.width = W * CELL;
    ui.cv.height = H * CELL;
  }

  function scheduleResize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      // иногда нужен второй кадр после изменений layout
      resizeCanvasToFit();
      render();
    });
  }

  window.addEventListener("resize", scheduleResize);

  // ===== базовые хелперы =====
  function cornerToCoord(corner, w, h) {
    switch (corner) {
      case "TL": return { x: 0, y: 0 };
      case "TR": return { x: w - 1, y: 0 };
      case "BL": return { x: 0, y: h - 1 };
      case "BR": return { x: w - 1, y: h - 1 };
    }
  }
  function oppositeCorner(corner) {
    switch (corner) {
      case "TL": return "BR";
      case "BR": return "TL";
      case "TR": return "BL";
      case "BL": return "TR";
    }
  }
  function cornerName(c) {
    return ({ TL: "левый верхний", TR: "правый верхний", BL: "левый нижний", BR: "правый нижний" })[c] || c;
  }

  function idx(x, y) { return y * W + x; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }
  function clampInt(v, min, max) {
    const n = Math.max(min, Math.min(max, parseInt(v, 10) || min));
    return n;
  }

  function countCells(p) {
    let c = 0;
    for (let i = 0; i < grid.length; i++) if (grid[i] === p) c++;
    return c;
  }
  function countFree() {
    let c = 0;
    for (let i = 0; i < grid.length; i++) if (grid[i] === 0) c++;
    return c;
  }
  function playerHasAnyCells(p) {
    for (let i = 0; i < grid.length; i++) if (grid[i] === p) return true;
    return false;
  }

  // 8-связность для присоединения
  function touchesPlayer8(p, x, y) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        if (grid[idx(nx, ny)] === p) return true;
      }
    }
    return false;
  }

  function canPlaceRectNormal(p, x, y, rw, rh) {
    if (x < 0 || y < 0 || x + rw > W || y + rh > H) return false;

    for (let yy = y; yy < y + rh; yy++) {
      for (let xx = x; xx < x + rw; xx++) {
        if (grid[idx(xx, yy)] !== 0) return false;
      }
    }

    const has = playerHasAnyCells(p);
    if (!has) {
      const sx = starts[p].x, sy = starts[p].y;
      return (sx >= x && sx < x + rw && sy >= y && sy < y + rh);
    } else {
      for (let yy = y; yy < y + rh; yy++) {
        for (let xx = x; xx < x + rw; xx++) {
          if (touchesPlayer8(p, xx, yy)) return true;
        }
      }
      return false;
    }
  }

  function canPlaceRectKush(p, x, y, rw, rh) {
    if (x < 0 || y < 0 || x + rw > W || y + rh > H) return false;
    return true;
  }

  function canPlaceRect(p, x, y, rw, rh) {
    return isKush ? canPlaceRectKush(p, x, y, rw, rh) : canPlaceRectNormal(p, x, y, rw, rh);
  }

  function placeRect(p, x, y, rw, rh) {
    for (let yy = y; yy < y + rh; yy++) {
      for (let xx = x; xx < x + rw; xx++) {
        grid[idx(xx, yy)] = p;
      }
    }
  }

  function hasAnyMove(p, rw, rh) {
    if (rw > W || rh > H) return false;
    if (isKush) return true;
    for (let y = 0; y <= H - rh; y++) {
      for (let x = 0; x <= W - rw; x++) {
        if (canPlaceRectNormal(p, x, y, rw, rh)) return true;
      }
    }
    return false;
  }

  // =====================================================================
  // Захват по контуру (baseline v4): safe boundary arcs (1 side or 2 adjacent sides)
  // =====================================================================

  function perimeterInfo() {
    const per = [];
    for (let x = 0; x < W; x++) per.push({ x, y: 0 });
    const topEnd = per.length - 1;

    const rightStart = per.length;
    for (let y = 1; y < H - 1; y++) per.push({ x: W - 1, y });
    const rightEnd = per.length - 1;

    const bottomStart = per.length;
    if (H > 1) for (let x = W - 1; x >= 0; x--) per.push({ x, y: H - 1 });
    const bottomEnd = per.length - 1;

    const leftStart = per.length;
    if (W > 1) for (let y = H - 2; y >= 1; y--) per.push({ x: 0, y });
    const leftEnd = per.length - 1;

    const ranges = {
      top: { s: 0, e: topEnd },
      right: { s: rightStart, e: rightEnd },
      bottom: { s: bottomStart, e: bottomEnd },
      left: { s: leftStart, e: leftEnd },
    };
    return { per, L: per.length, ranges };
  }

  function sideOfPerIndex(k, ranges) {
    if (k >= ranges.top.s && k <= ranges.top.e) return 0;
    if (k >= ranges.right.s && k <= ranges.right.e) return 1;
    if (k >= ranges.bottom.s && k <= ranges.bottom.e) return 2;
    return 3;
  }

  function sidesAdjacent(a, b) {
    const d = Math.abs(a - b);
    return d === 1 || d === 3;
  }

  function buildPlayerComponents8(p) {
    const comp = new Int32Array(W * H);
    comp.fill(-1);
    let compId = 0;

    const qx = new Int32Array(W * H);
    const qy = new Int32Array(W * H);

    const dirs8 = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      dirs8.push([dx, dy]);
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = idx(x, y);
        if (grid[i] !== p || comp[i] !== -1) continue;

        let qs = 0, qe = 0;
        comp[i] = compId;
        qx[qe] = x; qy[qe] = y; qe++;

        while (qs < qe) {
          const cx = qx[qs], cy = qy[qs]; qs++;
          for (let k = 0; k < dirs8.length; k++) {
            const nx = cx + dirs8[k][0], ny = cy + dirs8[k][1];
            if (!inBounds(nx, ny)) continue;
            const ii = idx(nx, ny);
            if (grid[ii] !== p || comp[ii] !== -1) continue;
            comp[ii] = compId;
            qx[qe] = nx; qy[qe] = ny; qe++;
          }
        }
        compId++;
      }
    }
    return { comp, compCount: compId };
  }

  function floodReachableFromBoundary(walls) {
    const reachable = new Uint8Array(W * H);
    const qx = new Int32Array(W * H);
    const qy = new Int32Array(W * H);
    let qs = 0, qe = 0;

    function push(x, y) {
      const i = idx(x, y);
      if (reachable[i]) return;
      if (walls[i]) return;
      reachable[i] = 1;
      qx[qe] = x; qy[qe] = y; qe++;
    }

    for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
    for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }

    const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (qs < qe) {
      const x = qx[qs], y = qy[qs]; qs++;
      for (let k = 0; k < 4; k++) {
        const nx = x + dirs4[k][0], ny = y + dirs4[k][1];
        if (!inBounds(nx, ny)) continue;
        const ii = idx(nx, ny);
        if (reachable[ii] || walls[ii]) continue;
        reachable[ii] = 1;
        qx[qe] = nx; qy[qe] = ny; qe++;
      }
    }
    return reachable;
  }

  function computeCaptureStats(p, spanWalls, perInfo) {
    const walls = new Uint8Array(W * H);
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] === p || spanWalls[i] === 1) walls[i] = 1;
    }

    const reachable = floodReachableFromBoundary(walls);

    let captured = 0;
    for (let i = 0; i < grid.length; i++) {
      if (walls[i]) continue;
      if (reachable[i]) continue;
      captured++;
    }

    let boundaryNonWallCount = 0;
    let boundaryNonWallUnreachable = 0;
    for (let k = 0; k < perInfo.L; k++) {
      const { x, y } = perInfo.per[k];
      const i = idx(x, y);
      if (walls[i]) continue;
      boundaryNonWallCount++;
      if (!reachable[i]) boundaryNonWallUnreachable++;
    }

    const sealedBoundary = (boundaryNonWallCount === 0);
    return { walls, reachable, captured, boundaryNonWallCount, boundaryNonWallUnreachable, sealedBoundary };
  }

  function buildSpanWallsForBoundaryClosure(p) {
    const spanWalls = new Uint8Array(W * H);
    const perInfo = perimeterInfo();
    const { per, L, ranges } = perInfo;

    const { comp, compCount } = buildPlayerComponents8(p);

    const touch = Array.from({ length: compCount }, () => []);
    for (let k = 0; k < L; k++) {
      const { x, y } = per[k];
      if (grid[idx(x, y)] === p) {
        const cid = comp[idx(x, y)];
        if (cid >= 0) touch[cid].push(k);
      }
    }

    for (let cid = 0; cid < compCount; cid++) {
      const arr = touch[cid];
      if (arr.length < 2) continue;

      arr.sort((a, b) => a - b);
      const uniq = [];
      for (let i = 0; i < arr.length; i++) {
        if (i === 0 || arr[i] !== arr[i - 1]) uniq.push(arr[i]);
      }
      if (uniq.length < 2) continue;

      let bestArc = null;

      for (let i = 0; i < uniq.length; i++) {
        const a = uniq[i];
        const b = uniq[(i + 1) % uniq.length];

        const arcCells = [];
        const sideSet = new Set();

        let k = (a + 1) % L;
        while (k !== b) {
          const pt = per[k];
          arcCells.push(idx(pt.x, pt.y));
          sideSet.add(sideOfPerIndex(k, ranges));
          k = (k + 1) % L;
        }
        if (arcCells.length === 0) continue;

        if (sideSet.size > 2) continue;
        if (sideSet.size === 2) {
          const sides = Array.from(sideSet);
          if (!sidesAdjacent(sides[0], sides[1])) continue;
        }

        const tmpSpan = new Uint8Array(W * H);
        tmpSpan.set(spanWalls);
        for (let t = 0; t < arcCells.length; t++) tmpSpan[arcCells[t]] = 1;

        const stats = computeCaptureStats(p, tmpSpan, perInfo);

        if (stats.captured <= 0) continue;
        if (stats.sealedBoundary) continue;
        if (stats.boundaryNonWallUnreachable > 0) continue;

        if (!bestArc || stats.captured < bestArc.captured) {
          bestArc = { cells: arcCells, captured: stats.captured };
        }
      }

      if (bestArc) {
        for (let t = 0; t < bestArc.cells.length; t++) spanWalls[bestArc.cells[t]] = 1;
      }
    }

    return { spanWalls, perInfo };
  }

  function applyEnclosuresPolygonal(p) {
    const { spanWalls, perInfo } = buildSpanWallsForBoundaryClosure(p);
    const stats = computeCaptureStats(p, spanWalls, perInfo);

    if (stats.sealedBoundary) return 0;
    if (stats.boundaryNonWallUnreachable > 0) return 0;

    let captured = 0;
    for (let i = 0; i < grid.length; i++) {
      if (stats.walls[i]) continue;
      if (stats.reachable[i]) continue;
      if (grid[i] !== p) {
        grid[i] = p;
        captured++;
      }
    }

    for (let i = 0; i < grid.length; i++) {
      if (spanWalls[i] === 1 && grid[i] !== p) {
        grid[i] = p;
        captured++;
      }
    }

    return captured;
  }

  // ===== Dice pips + animation =====
  const PIP_MAP = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  function setDiePips(gridEl, value) {
    const pips = gridEl.querySelectorAll(".pip");
    pips.forEach(p => p.classList.remove("on"));
    if (value == null) return;
    const on = PIP_MAP[value] || [];
    for (const i of on) if (pips[i]) pips[i].classList.add("on");
  }

  function setDiceUI(a, b, isRolling) {
    setDiePips(ui.dieAGrid, a);
    setDiePips(ui.dieBGrid, b);
    ui.dieA.classList.toggle("rolling", !!isRolling);
    ui.dieB.classList.toggle("rolling", !!isRolling);
  }

  function stopRollAnimation() {
    rolling = false;
    if (rollTimer) { clearInterval(rollTimer); rollTimer = null; }
    if (rollFinalizeTimer) { clearTimeout(rollFinalizeTimer); rollFinalizeTimer = null; }
  }

  function animateRollThenSet(finalA, finalB, onDone) {
    rolling = true;

    setDiceUI(1 + (Math.random() * 6 | 0), 1 + (Math.random() * 6 | 0), true);

    rollTimer = setInterval(() => {
      const ra = 1 + (Math.random() * 6 | 0);
      const rb = 1 + (Math.random() * 6 | 0);
      setDiceUI(ra, rb, true);
    }, 60);

    rollFinalizeTimer = setTimeout(() => {
      if (rollTimer) { clearInterval(rollTimer); rollTimer = null; }
      setDiceUI(finalA, finalB, false);
      rolling = false;
      rollFinalizeTimer = null;
      onDone?.();
    }, 780);
  }

  // ===== UI sync =====
  function syncNamesToUI() {
    ui.nameP1Top.textContent = pName(1);
    ui.nameP2Top.textContent = pName(2);
  }

  // ===== log / view =====
  function rebuildLogUI() {
    ui.logBox.innerHTML = "";
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const div = document.createElement("div");
      div.className = "logItem";

      const left = document.createElement("div");
      left.className = "logLeft";

      const right = document.createElement("div");
      right.className = "logRight";

      if (m.type === "init") {
        left.textContent = `#0 init (${m.W}×${m.H}), P1 ${m.p1Corner} / P2 ${m.p2Corner}`;
        right.textContent = m.ts || "";
      } else if (m.type === "move") {
        const who = m.playerName ?? `P${m.player}`;
        left.textContent =
          `#${m.n} ${who}${m.isKush ? " КУШ" : ""} dice ${m.dice.a},${m.dice.b} ` +
          `rect ${m.rect.w}×${m.rect.h} at (${m.place.x},${m.place.y})`;
        right.textContent =
          `Δsteal:${m.stolen} Δcontour:${m.capturedByContour} score ${m.scoreAfter.p1}:${m.scoreAfter.p2}`;
      } else if (m.type === "skip") {
        const who = m.playerName ?? `P${m.player}`;
        left.textContent = `#${m.n} ${who} SKIP dice ${m.dice.a},${m.dice.b}`;
        right.textContent = `score ${m.scoreAfter.p1}:${m.scoreAfter.p2}`;
      }

      div.addEventListener("click", () => gotoMove(i));
      div.appendChild(left);
      div.appendChild(right);
      ui.logBox.appendChild(div);
    }
    ui.gotoN.max = Math.max(0, moves.length - 1);
  }

  function setViewMode(indexOrNull) {
    viewIndex = indexOrNull;
    const isLive = (viewIndex === null);
    ui.viewMode.textContent = isLive ? "LIVE" : `VIEW #${viewIndex}`;

    if (!isLive) {
      ui.roll.disabled = true;
      ui.swap.disabled = true;
      ui.skip.disabled = true;
    } else {
      ui.roll.disabled = gameOver || rolling || !!dice;
      ui.swap.disabled = gameOver || rolling || !dice;
    }
  }

  function gotoMove(n) {
    n = Math.max(0, Math.min(n, moves.length - 1));
    const m = moves[n];

    if (viewIndex === null) {
      liveState = {
        grid: grid.slice(),
        currentPlayer,
        dice: dice ? { a: dice.a, b: dice.b } : null,
        oriented: oriented ? { w: oriented.w, h: oriented.h } : null,
        swapped,
        isKush,
        gameOver,
        playerNames: { ...playerNames },
      };
    }
    setViewMode(n);

    grid = restoreGridFromSnap(m.gridSnap);
    dice = null; oriented = null; swapped = false; isKush = false;
    gameOver = !!m.gameOver;
    currentPlayer = (m.nextPlayer ?? currentPlayer);

    setDiceUI(null, null, false);
    setMsg(`Просмотр состояния на ходе #${n}. Нажмите “К последнему”, чтобы продолжить игру.`);
    updateHUD();
    render();
  }

  function backToLive() {
    if (viewIndex === null) return;
    if (!liveState) { setViewMode(null); return; }

    grid = liveState.grid.slice();
    currentPlayer = liveState.currentPlayer;
    dice = liveState.dice ? { a: liveState.dice.a, b: liveState.dice.b } : null;
    oriented = liveState.oriented ? { w: liveState.oriented.w, h: liveState.oriented.h } : null;
    swapped = liveState.swapped;
    isKush = liveState.isKush;
    gameOver = liveState.gameOver;
    playerNames = { ...liveState.playerNames };

    syncNamesToUI();

    setViewMode(null);
    setDiceUI(dice?.a ?? null, dice?.b ?? null, false);
    setMsg(`Возврат к последнему состоянию. Ход: ${pName(currentPlayer)}.`);
    updateHUD();
    render();
    scheduleResize();
  }

  // ===== turn / rules helpers =====
  function endTurn() {
    dice = null;
    oriented = null;
    swapped = false;
    isKush = false;

    ui.swap.disabled = true;
    ui.skip.disabled = true;

    setDiceUI(null, null, false);

    if (countFree() === 0) {
      finishGame();
      return;
    }

    currentPlayer = (currentPlayer === 1 ? 2 : 1);
    setMsg(`Ход: ${pName(currentPlayer)}. Бросьте кубики.`);
    updateHUD();
    render();
  }

  function logSkipAndAdvance(player, diceObj, reasonText) {
    const n = moves.length;
    const s1 = countCells(1), s2 = countCells(2);
    const nextPlayer = (player === 1 ? 2 : 1);

    moves.push({
      type: "skip",
      n,
      ts: nowISO(),
      player,
      playerName: pName(player),
      dice: { a: diceObj.a, b: diceObj.b },
      reason: reasonText,
      scoreAfter: { p1: s1, p2: s2 },
      freeAfter: countFree(),
      nextPlayer,
      gameOver: false,
      gridSnap: snapshotGrid()
    });
    rebuildLogUI();
    ui.gotoN.value = n;
  }

  // ===== Game flow =====
  function rollDice() {
    if (viewIndex !== null) { setMsg("Вы в режиме просмотра. Нажмите “К последнему”, чтобы продолжить."); return; }
    if (gameOver) return;
    if (rolling) return;

    if (dice) {
      setMsg(`Сначала завершите ход: поставьте фигуру ${oriented?.w ?? "?"}×${oriented?.h ?? "?"} или пропустите (если доступно).`);
      return;
    }

    ui.roll.disabled = true;
    ui.swap.disabled = true;
    ui.skip.disabled = true;

    const finalA = 1 + Math.floor(Math.random() * 6);
    const finalB = 1 + Math.floor(Math.random() * 6);

    animateRollThenSet(finalA, finalB, () => {
      dice = { a: finalA, b: finalB };
      swapped = false;
      oriented = { w: dice.a, h: dice.b };
      isKush = (dice.a === dice.b);

      ui.swap.disabled = false;

      const can = hasAnyMove(currentPlayer, dice.a, dice.b) || hasAnyMove(currentPlayer, dice.b, dice.a);

      if (isKush) {
        ui.skip.disabled = true;
        setMsg(`КУШ! ${pName(currentPlayer)}: выпало ${dice.a} и ${dice.b}. Можно ставить в любое место (перекрывая соперника).`);
      } else if (!can) {
        setMsg(`${pName(currentPlayer)}: выпало ${dice.a} и ${dice.b}. Ходов нет — авто-пропуск.`);
        logSkipAndAdvance(currentPlayer, dice, "auto-no-moves");
        setTimeout(() => {
          endTurn();
          ui.roll.disabled = gameOver || (viewIndex !== null) || rolling || !!dice;
        }, 250);
        updateHUD();
        render();
        return;
      } else {
        ui.skip.disabled = true;
        setMsg(`${pName(currentPlayer)}: выпало ${dice.a} и ${dice.b}. Наведите и кликните, чтобы поставить прямоугольник.`);
      }

      updateHUD();
      render();
      ui.roll.disabled = true; // до завершения хода
    });
  }

  function swapOrientation() {
    if (viewIndex !== null) return;
    if (!dice || gameOver) return;
    if (rolling) return;

    swapped = !swapped;
    oriented = swapped ? { w: dice.b, h: dice.a } : { w: dice.a, h: dice.b };
    updateHUD();
    render();
  }

  function skipTurnManual() {
    if (viewIndex !== null) { setMsg("Вы в режиме просмотра. Нажмите “К последнему”, чтобы продолжить."); return; }
    if (gameOver) return;
    if (rolling) return;
    if (!dice) { setMsg("Сначала бросьте кубики."); return; }
    if (isKush) { setMsg("Куш: пропуск не нужен (ход возможен, если фигура помещается)."); return; }

    const can = hasAnyMove(currentPlayer, dice.a, dice.b) || hasAnyMove(currentPlayer, dice.b, dice.a);
    if (can) { setMsg("Пропуск запрещён: варианты есть."); return; }

    logSkipAndAdvance(currentPlayer, dice, "manual");
    setMsg(`${pName(currentPlayer)} пропускает ход.`);
    endTurn();

    ui.roll.disabled = gameOver || (viewIndex !== null) || rolling || !!dice;
  }

  function finishGame() {
    gameOver = true;
    ui.roll.disabled = true;
    ui.swap.disabled = true;
    ui.skip.disabled = true;

    const s1 = countCells(1), s2 = countCells(2);
    let res = "Ничья!";
    if (s1 > s2) res = `Победил ${pName(1)}!`;
    if (s2 > s1) res = `Победил ${pName(2)}!`;
    setMsg(`Игра окончена. ${res} Счёт: ${s1} : ${s2}.`);
    updateHUD();
    render();
  }

  function updateHUD() {
    const s1 = countCells(1), s2 = countCells(2);

    ui.turn.textContent = gameOver ? "—" : pName(currentPlayer);
    ui.scoreP1.textContent = String(s1);
    ui.scoreP2.textContent = String(s2);
    ui.freeTop.textContent = String(countFree());

    if (!dice) {
      ui.orient.textContent = "—";
      ui.mode.textContent = "—";
    } else {
      ui.orient.textContent = `${oriented.w}×${oriented.h}`;
      ui.mode.textContent = isKush ? "КУШ (перекрытие)" : "Обычный";
    }

    syncNamesToUI();
    setViewMode(viewIndex);
  }

  // ===== rendering =====
  function drawStartMarker(p) {
    const s = starts[p];
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS[p];
    ctx.strokeRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
    ctx.restore();
  }

  function render() {
    // если по какой-то причине ещё не посчитали размеры — посчитаем
    if (!ui.cv.width || !ui.cv.height) resizeCanvasToFit();

    ctx.clearRect(0, 0, ui.cv.width, ui.cv.height);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = grid[idx(x, y)];
        ctx.fillStyle = (v === 0) ? "#0a122a" : COLORS[v];
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    // gridlines
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, H * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(W * CELL, y * CELL + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawStartMarker(1);
    drawStartMarker(2);

    // preview only in LIVE
    if (viewIndex === null && hover && dice && oriented && !gameOver && !rolling) {
      const x = hover.x, y = hover.y;
      const rw = oriented.w, rh = oriented.h;
      const ok = canPlaceRect(currentPlayer, x, y, rw, rh);

      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = ok ? COLORS[currentPlayer] : "#ffffff";
      ctx.fillRect(x * CELL, y * CELL, rw * CELL, rh * CELL);

      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.strokeStyle = ok ? COLORS[currentPlayer] : "#ffffff";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x * CELL + 1, y * CELL + 1, rw * CELL - 2, rh * CELL - 2);
      ctx.restore();
    }
  }

  function canvasToCell(ev) {
    const rect = ui.cv.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) / CELL);
    const y = Math.floor((ev.clientY - rect.top) / CELL);
    if (!inBounds(x, y)) return null;
    return { x, y };
  }

  // ===== click commit + log move =====
  ui.cv.addEventListener("mousemove", (ev) => { hover = canvasToCell(ev); render(); });
  ui.cv.addEventListener("mouseleave", () => { hover = null; render(); });

  ui.cv.addEventListener("click", (ev) => {
    if (viewIndex !== null) { setMsg("Вы в режиме просмотра. Нажмите “К последнему”, чтобы продолжить."); return; }
    if (gameOver) return;
    if (rolling) return;
    if (!dice || !oriented) { setMsg("Сначала бросьте кубики."); return; }

    const c = canvasToCell(ev);
    if (!c) return;

    const rw = oriented.w, rh = oriented.h;
    if (!canPlaceRect(currentPlayer, c.x, c.y, rw, rh)) {
      setMsg(isKush
        ? "Нельзя поставить: прямоугольник не помещается в поле."
        : "Нельзя поставить здесь: либо занято, либо не примыкает к вашей территории (или не включает стартовый угол на первом ходе)."
      );
      render();
      return;
    }

    const enemy = (currentPlayer === 1 ? 2 : 1);
    let stolen = 0;
    if (isKush) {
      for (let yy = c.y; yy < c.y + rh; yy++) {
        for (let xx = c.x; xx < c.x + rw; xx++) {
          if (grid[idx(xx, yy)] === enemy) stolen++;
        }
      }
    }

    placeRect(currentPlayer, c.x, c.y, rw, rh);

    const capturedByContour = applyEnclosuresPolygonal(currentPlayer);

    const s1 = countCells(1), s2 = countCells(2);
    const free = countFree();

    const n = moves.length; // #0 is init
    const nextPlayer = (free === 0) ? currentPlayer : (currentPlayer === 1 ? 2 : 1);

    moves.push({
      type: "move",
      n,
      ts: nowISO(),
      player: currentPlayer,
      playerName: pName(currentPlayer),
      dice: { a: dice.a, b: dice.b },
      rect: { w: rw, h: rh },
      place: { x: c.x, y: c.y },
      isKush,
      stolen,
      capturedByContour,
      scoreAfter: { p1: s1, p2: s2 },
      freeAfter: free,
      nextPlayer,
      gameOver: (free === 0),
      gridSnap: snapshotGrid()
    });
    rebuildLogUI();
    ui.gotoN.value = n;

    setMsg(
      (isKush
        ? `КУШ! ${pName(currentPlayer)} поставил ${rw}×${rh}. Перекрыто: ${stolen}. Захват по контуру: ${capturedByContour}.`
        : `${pName(currentPlayer)} поставил ${rw}×${rh}. Захват по контуру: ${capturedByContour}.`
      )
    );

    updateHUD();
    render();

    if (free === 0) { finishGame(); return; }

    endTurn();
    ui.roll.disabled = gameOver || (viewIndex !== null) || rolling || !!dice;
  });

  // ===== buttons =====
  ui.newGame.addEventListener("click", newGame);
  ui.roll.addEventListener("click", rollDice);
  ui.swap.addEventListener("click", swapOrientation);
  ui.skip.addEventListener("click", skipTurnManual);

  ui.gotoBtn.addEventListener("click", () => {
    const n = clampInt(ui.gotoN.value, 0, Math.max(0, moves.length - 1));
    gotoMove(n);
  });
  ui.backLive.addEventListener("click", backToLive);

  ui.exportBtn.addEventListener("click", () => {
    const payload = {
      version: 7,
      rules: "kush + polygonal contours (safe boundary arcs: 1 side or 2 adjacent sides) + snapshots + names + auto-skip + no-reroll + autoscale-fill-viewport",
      meta: { W, H, CELL, p1Corner, p2Corner, starts, playerNames },
      moves
    };
    ui.jsonArea.value = JSON.stringify(payload, null, 2);
    setMsg("JSON сформирован.");
  });

  ui.loadBtn.addEventListener("click", () => {
    try {
      const payload = JSON.parse(ui.jsonArea.value || "{}");
      if (!payload || !Array.isArray(payload.moves) || payload.moves.length < 1) {
        setMsg("Некорректный JSON: нет moves.");
        return;
      }

      const meta = payload.meta || {};
      const init = payload.moves[0];

      W = meta.W ?? init.W ?? W;
      H = meta.H ?? init.H ?? H;

      p1Corner = meta.p1Corner ?? init.p1Corner ?? p1Corner;
      p2Corner = meta.p2Corner ?? init.p2Corner ?? p2Corner;
      starts = meta.starts ?? init.starts ?? starts;

      playerNames = meta.playerNames ?? (init.playerNames ?? playerNames);

      moves = payload.moves;

      const last = moves[moves.length - 1];
      grid = restoreGridFromSnap(last.gridSnap);

      currentPlayer = last.nextPlayer ?? 1;
      dice = null; oriented = null; swapped = false; isKush = false;
      gameOver = !!last.gameOver;

      ui.w.value = W;
      ui.h.value = H;
      ui.corner.value = p1Corner;

      ui.nameP1.value = safeName(playerNames[1], "Игрок 1");
      ui.nameP2.value = safeName(playerNames[2], "Игрок 2");
      playerNames[1] = safeName(ui.nameP1.value, "Игрок 1");
      playerNames[2] = safeName(ui.nameP2.value, "Игрок 2");
      syncNamesToUI();

      resizeCanvasToFit();
      rebuildLogUI();
      setViewMode(null);
      setDiceUI(null, null, false);
      updateHUD();
      render();
      ui.gotoN.value = moves.length - 1;
      setMsg(`Журнал загружен. Ходов: ${moves.length - 1}.`);

      scheduleResize();
    } catch {
      setMsg("Ошибка JSON.");
    }
  });

  ui.copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ui.jsonArea.value || "");
      setMsg("Скопировано.");
    } catch {
      setMsg("Не удалось скопировать (можно вручную).");
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") { if (!ui.roll.disabled) rollDice(); }
    if (e.key === "s" || e.key === "S") { if (!ui.swap.disabled) swapOrientation(); }
    if (e.key === " ") { e.preventDefault(); if (!ui.skip.disabled) skipTurnManual(); }
  });

  // ===== init =====
  function newGame() {
    if (rolling) stopRollAnimation();

    W = clampInt(ui.w.value, 5, 120);
    H = clampInt(ui.h.value, 5, 120);

    p1Corner = ui.corner.value;
    p2Corner = oppositeCorner(p1Corner);
    starts[1] = cornerToCoord(p1Corner, W, H);
    starts[2] = cornerToCoord(p2Corner, W, H);

    playerNames[1] = safeName(ui.nameP1.value, "Игрок 1");
    playerNames[2] = safeName(ui.nameP2.value, "Игрок 2");
    syncNamesToUI();

    grid = new Array(W * H).fill(0);

    currentPlayer = 1;
    dice = null;
    oriented = null;
    swapped = false;
    isKush = false;
    hover = null;
    gameOver = false;

    moves = [];
    viewIndex = null;
    liveState = null;

    ui.roll.disabled = false;
    ui.swap.disabled = true;
    ui.skip.disabled = true;

    resizeCanvasToFit();
    render();
    updateHUD();
    setDiceUI(null, null, false);
    setMsg(`Новая игра. ${pName(1)}: ${cornerName(p1Corner)}, ${pName(2)}: ${cornerName(p2Corner)}.`);

    moves.push({
      type: "init",
      n: 0,
      ts: nowISO(),
      W, H, CELL,
      p1Corner, p2Corner,
      starts: JSON.parse(JSON.stringify(starts)),
      playerNames: { ...playerNames },
      currentPlayer,
      gameOver: false,
      gridSnap: snapshotGrid(),
      nextPlayer: 1
    });

    rebuildLogUI();
    setViewMode(null);
    ui.gotoN.value = 0;

    closeDrawer();

    // важно: после закрытия меню меняется ширина/высота — пересчитать
    scheduleResize();
  }

  // старт
  newGame();

  // и ещё один пересчёт после полной отрисовки страницы (страховка)
  requestAnimationFrame(() => scheduleResize());
})();

