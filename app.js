// ====================================================================
// DICES-N-SPACES - Main Game Logic
// ====================================================================

/**
 * Game state and configuration
 * @namespace Game
 */
const Game = {
  // Core game state
  grid: null,
  width: 50,
  height: 50,
  cellSize: 10,
  currentPlayer: 1,
  diceValues: [1, 1],
  diceRolled: false,
  isKush: false,
  rectangleOrientation: 0, // 0 = a×b, 1 = b×a
  rectanglePosition: { x: -1, y: -1 },
  isValidPlacement: false,
  gameOver: false,
  isReplayMode: false,
  replayPosition: 0,
  historyHover: null, // {index, rect:{x,y,width,height}} transient hover highlight from history
  historyPinned: null, // {index, rect:{x,y,width,height}} pinned highlight (toggle on click)
  
  // Players
  player1Name: "Player 1",
  player2Name: "Player 2",
  startingCorner: "TL",
  
  // History and logging
  moveHistory: [],
  currentMoveIndex: 0,
  
  // Canvas and rendering
  canvas: null,
  ctx: null,
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  isPanning: false,
  lastMousePos: { x: 0, y: 0 },
  kushPulseTime: 0, // For KUSH preview pulsing animation
  kushAnimationFrame: null, // Animation frame ID for cleanup
  
  // Colors
  colors: {
    player1: "#ef4444",    // Red
    player2: "#3b82f6",    // Blue
    empty: "#0f172a",      // Dark blue
    grid: "#334155",
    highlight: "rgba(76, 201, 240, 0.3)",
    invalid: "rgba(239, 68, 68, 0.3)",
    preview: "rgba(76, 201, 240, 0.5)"
  }
};

// ====================================================================
// DOM ELEMENTS
// ====================================================================

/**
 * Cache DOM elements for better performance
 * @namespace DOM
 */
const DOM = {
  // Canvas
  gameCanvas: null,
  placementOverlay: null,
  
  // Settings inputs
  fieldWidth: null,
  fieldHeight: null,
  player1Name: null,
  player2Name: null,
  startingCorner: null,
  
  // Buttons
  newGameBtn: null,
  rulesBtn: null,
  rollBtn: null,
  rotateBtn: null,
  exportBtn: null,
  importBtn: null,
  clearLogBtn: null,
  prevMoveBtn: null,
  nextMoveBtn: null,
  liveModeBtn: null,
  zoomInBtn: null,
  zoomOutBtn: null,
  centerViewBtn: null,

  // Settings drawer
  settingsToggle: null,
  settingsDrawer: null,
  drawerBackdrop: null,
  settingsClose: null,
  
  // Game state displays
  player1Display: null,
  player2Display: null,
  score1: null,
  score2: null,
  freeCells: null,
  currentPlayerDisplay: null,
  gameStatus: null,
  kushIndicator: null,
  
  // Dice
  die1: null,
  die2: null,
  
  // History
  historyList: null,
  historySlider: null,
  replayPosition: null,
  totalMoves: null,
  
  // Modal
  rulesModal: null,
  rulesModalClose: null,
  importExportModal: null,
  importExportModalClose: null,
  exportTextarea: null,
  importTextarea: null,
  copyBtn: null,
  loadBtn: null,
  importAlert: null,
  tabBtns: null
};

// ====================================================================
// INITIALIZATION
// ====================================================================

/**
 * Initialize the game
 * @function initializeGame
 */
function initializeGame() {
  console.log("Initializing game...");
  setupDOMReferences();
  setupCanvas();
  setupEventListeners();
  loadSettings();
  
  // Инициализируем пустую сетку
  Game.grid = null;
  
  updateUI();
  
  console.log("Game initialized successfully - ready for 'New Game' click");
  
  // Отображаем начальное сообщение
  if (DOM.gameStatus) {
    DOM.gameStatus.textContent = "Click 'New Game' to start";
  }
}

/**
 * Setup DOM references
 * @function setupDOMReferences
 */
function setupDOMReferences() {
  console.log("Setting up DOM references...");
  
  // Canvas
  DOM.gameCanvas = document.getElementById('gameCanvas');
  DOM.placementOverlay = document.getElementById('placementOverlay');
  
  // Settings inputs
  DOM.fieldWidth = document.getElementById('fieldWidth');
  DOM.fieldHeight = document.getElementById('fieldHeight');
  DOM.player1Name = document.getElementById('player1Name');
  DOM.player2Name = document.getElementById('player2Name');
  DOM.startingCorner = document.getElementById('startingCorner');
  
  // Buttons
  DOM.newGameBtn = document.getElementById('newGameBtn');
  DOM.rulesBtn = document.getElementById('rulesBtn');
  DOM.rollBtn = document.getElementById('rollBtn');
  DOM.rotateBtn = document.getElementById('rotateBtn');
  DOM.exportBtn = document.getElementById('exportBtn');
  DOM.importBtn = document.getElementById('importBtn');
  DOM.clearLogBtn = document.getElementById('clearLogBtn');
  DOM.prevMoveBtn = document.getElementById('prevMoveBtn');
  DOM.nextMoveBtn = document.getElementById('nextMoveBtn');
  DOM.liveModeBtn = document.getElementById('liveModeBtn');
  DOM.zoomInBtn = document.getElementById('zoomInBtn');
  DOM.zoomOutBtn = document.getElementById('zoomOutBtn');
  DOM.centerViewBtn = document.getElementById('centerViewBtn');
  
  // Settings drawer
  DOM.settingsToggle = document.getElementById('settingsToggle');
  DOM.settingsDrawer = document.getElementById('settingsDrawer');
  DOM.drawerBackdrop = document.getElementById('drawerBackdrop');
  DOM.settingsClose = document.getElementById('settingsClose');
  
  // Game state displays
  DOM.player1Display = document.getElementById('player1Display');
  DOM.player2Display = document.getElementById('player2Display');
  DOM.score1 = document.getElementById('score1');
  DOM.score2 = document.getElementById('score2');
  DOM.freeCells = document.getElementById('freeCells');
  DOM.currentPlayerDisplay = document.getElementById('currentPlayerDisplay');
  DOM.gameStatus = document.getElementById('gameStatus');
  DOM.kushIndicator = document.getElementById('kushIndicator');
  
  // Dice
  DOM.die1 = document.getElementById('die1');
  DOM.die2 = document.getElementById('die2');
  
  // History
  DOM.historyList = document.getElementById('historyList');
  DOM.historySlider = document.getElementById('historySlider');
  DOM.replayPosition = document.getElementById('replayPosition');
  DOM.totalMoves = document.getElementById('totalMoves');
  
  // Modal
  DOM.rulesModal = document.getElementById('rulesModal');
  DOM.rulesModalClose = document.getElementById('rulesModalClose');
  DOM.importExportModal = document.getElementById('importExportModal');
  DOM.importExportModalClose = document.getElementById('importExportModalClose');
  DOM.exportTextarea = document.getElementById('exportTextarea');
  DOM.importTextarea = document.getElementById('importTextarea');
  DOM.copyBtn = document.getElementById('copyBtn');
  DOM.loadBtn = document.getElementById('loadBtn');
  DOM.importAlert = document.getElementById('importAlert');
  DOM.tabBtns = document.querySelectorAll('.tab-btn');
  
  console.log("DOM references set up");
}

/**
 * Setup canvas context and size
 * @function setupCanvas
 */
function setupCanvas() {
  console.log("Setting up canvas...");
  
  if (!DOM.gameCanvas) {
    console.error("Canvas element not found!");
    return;
  }
  
  Game.canvas = DOM.gameCanvas;
  Game.ctx = Game.canvas.getContext('2d');
  
  if (!Game.ctx) {
    console.error("Could not get canvas context!");
    return;
  }
  
  // Устанавливаем начальный размер canvas, но НЕ рендерим
  const container = Game.canvas.parentElement;
  if (container) {
    Game.canvas.width = container.clientWidth;
    Game.canvas.height = container.clientHeight;
  }
  
  console.log("Canvas set up successfully");
}

/**
 * Setup all event listeners
 * @function setupEventListeners
 */
function setupEventListeners() {
  console.log("Setting up event listeners...");
  
  // Game action buttons
  if (DOM.newGameBtn) {
    DOM.newGameBtn.addEventListener('click', startNewGame);
    console.log("New Game button listener added");
  } else {
    console.error("New Game button not found!");
  }
  
  if (DOM.rollBtn) DOM.rollBtn.addEventListener('click', rollDice);
  if (DOM.rotateBtn) DOM.rotateBtn.addEventListener('click', rotateRectangle);
  // History controls
  if (DOM.exportBtn) DOM.exportBtn.addEventListener('click', openExportModal);
  if (DOM.importBtn) DOM.importBtn.addEventListener('click', openImportModal);
  if (DOM.clearLogBtn) DOM.clearLogBtn.addEventListener('click', clearHistory);
  if (DOM.prevMoveBtn) DOM.prevMoveBtn.addEventListener('click', prevMove);
  if (DOM.nextMoveBtn) DOM.nextMoveBtn.addEventListener('click', nextMove);
  if (DOM.liveModeBtn) DOM.liveModeBtn.addEventListener('click', exitReplayMode);
  if (DOM.historySlider) DOM.historySlider.addEventListener('input', onHistorySliderChange);
  
  // Settings drawer
  if (DOM.settingsToggle) DOM.settingsToggle.addEventListener('click', openSettingsDrawer);
  if (DOM.settingsClose) DOM.settingsClose.addEventListener('click', closeSettingsDrawer);
  if (DOM.drawerBackdrop) DOM.drawerBackdrop.addEventListener('click', closeSettingsDrawer);
  
  // Rules button
  if (DOM.rulesBtn) DOM.rulesBtn.addEventListener('click', openRulesModal);

  // Canvas controls
  if (DOM.zoomInBtn) DOM.zoomInBtn.addEventListener('click', () => changeZoom(0.2));
  if (DOM.zoomOutBtn) DOM.zoomOutBtn.addEventListener('click', () => changeZoom(-0.2));
  if (DOM.centerViewBtn) DOM.centerViewBtn.addEventListener('click', centerView);
  
  // Canvas interaction
  if (Game.canvas) {
    Game.canvas.addEventListener('mousedown', startPan);
    Game.canvas.addEventListener('mousemove', handleMouseMove);
    Game.canvas.addEventListener('mouseup', stopPan);
    // Disable trackpad / wheel zooming the game (but keep page scroll). Prevent browser pinch-zoom over canvas.
    Game.canvas.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    }, { passive: false });
    Game.canvas.addEventListener('click', handleCanvasClick);
  }
  
  // Modal controls
  if (DOM.rulesModalClose) DOM.rulesModalClose.addEventListener('click', closeRulesModal);
  if (DOM.importExportModalClose) DOM.importExportModalClose.addEventListener('click', closeImportExportModal);
  if (DOM.copyBtn) DOM.copyBtn.addEventListener('click', copyExportText);
  if (DOM.loadBtn) DOM.loadBtn.addEventListener('click', importGame);
  
  if (DOM.tabBtns) {
    DOM.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }
  
  // Hotkeys
  document.addEventListener('keydown', handleHotkey);
  
  // Settings changes
  if (DOM.fieldWidth) DOM.fieldWidth.addEventListener('change', updateSettings);
  if (DOM.fieldHeight) DOM.fieldHeight.addEventListener('change', updateSettings);
  if (DOM.player1Name) DOM.player1Name.addEventListener('change', updateSettings);
  if (DOM.player2Name) DOM.player2Name.addEventListener('change', updateSettings);
  if (DOM.startingCorner) DOM.startingCorner.addEventListener('change', updateSettings);
  
  // Window resize
  window.addEventListener('resize', debounce(() => {
    if (Game.grid) {
      updateCanvasSize();
    }
  }, 250));
  
  console.log("Event listeners set up");
}

/**
 * Load settings from DOM inputs
 * @function loadSettings
 */
function loadSettings() {
  console.log("Loading settings...");
  
  if (DOM.fieldWidth) Game.width = parseInt(DOM.fieldWidth.value) || 50;
  if (DOM.fieldHeight) Game.height = parseInt(DOM.fieldHeight.value) || 50;
  if (DOM.player1Name) Game.player1Name = DOM.player1Name.value || "Player 1";
  if (DOM.player2Name) Game.player2Name = DOM.player2Name.value || "Player 2";
  if (DOM.startingCorner) Game.startingCorner = DOM.startingCorner.value || "TL";
  
  console.log("Settings loaded:", {
    width: Game.width,
    height: Game.height,
    player1: Game.player1Name,
    player2: Game.player2Name,
    corner: Game.startingCorner
  });
}

/**
 * Update canvas size based on container
 * @function updateCanvasSize
 */
function updateCanvasSize() {
  if (!Game.canvas || !Game.canvas.parentElement) {
    console.warn("Cannot update canvas size: canvas or parent not available");
    return;
  }
  
  const container = Game.canvas.parentElement;
  Game.canvas.width = container.clientWidth;
  Game.canvas.height = container.clientHeight;
  
  calculateCellSize();
  
  if (Game.grid) {
    renderGrid();
  }
}

/**
 * Initialize empty grid
 * @function initializeGrid
 */
function initializeGrid() {
  console.log(`Initializing grid ${Game.width}x${Game.height}...`);
  
  const grid = [];
  for (let y = 0; y < Game.height; y++) {
    const row = [];
    for (let x = 0; x < Game.width; x++) {
      row.push(0);
    }
    grid.push(row);
  }
  
  Game.grid = grid;
  
  console.log(`Grid initialized with ${Game.width * Game.height} cells`);
}

// ====================================================================
// GAME LOGIC - Core Game Functions
// ====================================================================

/**
 * Start a new game with current settings
 * @function startNewGame
 */
function startNewGame(options = {}) {
  console.log("Starting new game...");
  
  loadSettings();

  const {
    preserveHistory = false,
    preserveReplay = false,
    skipStartingPositions = false
  } = options;

  
  Game.currentPlayer = 1;
  Game.diceValues = [1, 1];
  Game.diceRolled = false;
  Game.isKush = false;
  Game.rectangleOrientation = 0;
  Game.rectanglePosition = { x: -1, y: -1 };
  Game.isValidPlacement = false;
  Game.gameOver = false;
  // Clear any history highlight overlays
  Game.historyHover = null;
  Game.historyPinned = null;
  if (!preserveReplay) {
    Game.isReplayMode = false;
    Game.replayPosition = 0;
  }
  if (!preserveHistory) {
    Game.moveHistory = [];
    Game.currentMoveIndex = 0;
  }
  Game.zoomLevel = 1;
  Game.panOffset = { x: 0, y: 0 };
  
  initializeGrid();
  if (!skipStartingPositions) {
    setStartingPositions();
  }
  updateCanvasSize();
  updateUI();
  updateHistoryUI();
  closeImportExportModal();
  updateDiceDisplay();
  
  logGameState("Game started");
  console.log("New game started successfully");
  
  if (DOM.gameStatus) {
    DOM.gameStatus.textContent = `${getCurrentPlayerName()}'s turn`;
  }
}

/**
 * Set starting positions based on selected corner
 * @function setStartingPositions
 */
function setStartingPositions() {
  console.log("Setting starting positions...");
  
  if (!Game.grid) {
    console.error("Cannot set starting positions: grid not initialized!");
    return;
  }
  
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      Game.grid[y][x] = 0;
    }
  }
  
  let p1X, p1Y;
  switch (Game.startingCorner) {
    case "TL": p1X = 0; p1Y = 0; break;
    case "TR": p1X = Game.width - 1; p1Y = 0; break;
    case "BL": p1X = 0; p1Y = Game.height - 1; break;
    case "BR": p1X = Game.width - 1; p1Y = Game.height - 1; break;
    default: p1X = 0; p1Y = 0;
  }
  
  const p2X = Game.width - 1 - p1X;
  const p2Y = Game.height - 1 - p1Y;
  
  console.log(`Player 1 start: (${p1X}, ${p1Y})`);
  console.log(`Player 2 start: (${p2X}, ${p2Y})`);
  
  Game.grid[p1Y][p1X] = 1;
  Game.grid[p2Y][p2X] = 2;
}

/**
 * Roll dice for current player
 * @function rollDice
 */
function rollDice() {
  if (Game.diceRolled || Game.gameOver || Game.isReplayMode) return;
  
  console.log("Rolling dice...");
  
  if (DOM.die1) DOM.die1.classList.add('rolling');
  if (DOM.die2) DOM.die2.classList.add('rolling');
  
  setTimeout(() => {
    Game.diceValues = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    
    Game.isKush = Game.diceValues[0] === Game.diceValues[1];
    
    console.log(`Dice rolled: ${Game.diceValues[0]}, ${Game.diceValues[1]} ${Game.isKush ? '(KUSH!)' : ''}`);
    
    updateDiceDisplay();
    
    if (DOM.die1) DOM.die1.classList.remove('rolling');
    if (DOM.die2) DOM.die2.classList.remove('rolling');
    
    Game.diceRolled = true;
    Game.rectanglePosition = { x: -1, y: -1 };
    Game.isValidPlacement = false;
    
    if (DOM.kushIndicator) {
      DOM.kushIndicator.style.display = Game.isKush ? 'block' : 'none';
    }
    
    // Start or stop KUSH pulsing animation
    if (Game.isKush) {
      startKushAnimation();
    } else {
      stopKushAnimation();
    }
    
    if (!Game.isKush && !hasValidPlacement()) {
      console.log("No valid moves found, auto-skipping turn");
      setTimeout(() => autoSkipTurn('no_moves'), 600);
      if (DOM.gameStatus) {
        DOM.gameStatus.textContent = "No valid moves - skipping turn";
      }
    } else {
      if (DOM.gameStatus) {
        DOM.gameStatus.textContent = Game.isKush ? 
          "KUSH! Place rectangle anywhere" : 
          "Place your rectangle adjacent to your territory";
      }
    }
    
    updateUI();
    renderGrid();
    
    logMove('dice_roll', {
      dice1: Game.diceValues[0],
      dice2: Game.diceValues[1],
      isKush: Game.isKush
    });
  }, 800);
}

// ====================================================================
// RECTANGLE PLACEMENT LOGIC
// ====================================================================

/**
 * Get rectangle dimensions based on current orientation
 * @function getRectangleDimensions
 * @returns {Object} Width and height of rectangle
 */
function getRectangleDimensions() {
  if (Game.rectangleOrientation === 0) {
    return { width: Game.diceValues[0], height: Game.diceValues[1] };
  } else {
    return { width: Game.diceValues[1], height: Game.diceValues[0] };
  }
}

/**
 * Check if rectangle can be placed at given position
 * @function canPlaceRectangle
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if placement is valid
 */
function canPlaceRectangle(x, y) {
  const dim = getRectangleDimensions();
  
  // Check if rectangle fits within bounds
  if (x < 0 || y < 0 || x + dim.width > Game.width || y + dim.height > Game.height) {
    return false;
  }
  
  // KUSH mode: can place anywhere, overwriting any cells
  if (Game.isKush) {
    return true;
  }
  
  const isFirstMove = getPlayerCellCount(Game.currentPlayer) === 1;
  
  // First move: must include starting cell
  if (isFirstMove) {
    let includesStart = false;
    const startPos = getPlayerStartPosition(Game.currentPlayer);
    
    for (let dy = 0; dy < dim.height; dy++) {
      for (let dx = 0; dx < dim.width; dx++) {
        if (x + dx === startPos.x && y + dy === startPos.y) {
          includesStart = true;
          break;
        }
      }
      if (includesStart) break;
    }
    
    if (!includesStart) return false;
    
    // For first move, we allow the rectangle to include the starting cell (which is already owned)
    // But we need to check that all OTHER cells are empty
    for (let dy = 0; dy < dim.height; dy++) {
      for (let dx = 0; dx < dim.width; dx++) {
        const cellX = x + dx;
        const cellY = y + dy;
        
        // Skip the starting cell itself
        if (cellX === startPos.x && cellY === startPos.y) {
          continue;
        }
        
        // All other cells must be empty
        if (Game.grid[cellY][cellX] !== 0) {
          return false;
        }
      }
    }
    
    return true;
  } else {
    // Normal move: must be adjacent to player's territory (8-direction)
    let isAdjacent = false;
    
    for (let dy = 0; dy < dim.height; dy++) {
      for (let dx = 0; dx < dim.width; dx++) {
        // Check all 8 neighboring cells
        for (let ny = y + dy - 1; ny <= y + dy + 1; ny++) {
          for (let nx = x + dx - 1; nx <= x + dx + 1; nx++) {
            if (nx >= 0 && nx < Game.width && ny >= 0 && ny < Game.height) {
              if (Game.grid[ny][nx] === Game.currentPlayer) {
                isAdjacent = true;
                break;
              }
            }
          }
          if (isAdjacent) break;
        }
        if (isAdjacent) break;
      }
      if (isAdjacent) break;
    }
    
    if (!isAdjacent) return false;
    
    // Check if all cells are empty (for non-KUSH)
    for (let dy = 0; dy < dim.height; dy++) {
      for (let dx = 0; dx < dim.width; dx++) {
        if (Game.grid[y + dy][x + dx] !== 0) {
          return false;
        }
      }
    }
    
    return true;
  }
}

/**
 * Place rectangle at current position
 * @function placeRectangle
 */
function placeRectangle() {
  if (!Game.diceRolled || Game.gameOver || Game.isReplayMode) return;
  if (!Game.isValidPlacement && !Game.isKush) return;
  
  console.log("Placing rectangle...");
  
  const dim = getRectangleDimensions();
  const x = Game.rectanglePosition.x;
  const y = Game.rectanglePosition.y;
  
  console.log(`Placing ${dim.width}x${dim.height} rectangle at (${x}, ${y})`);
  
  let stolenCells = 0;
  let overwrittenSelf = 0;
  
  // Place rectangle
  for (let dy = 0; dy < dim.height; dy++) {
    for (let dx = 0; dx < dim.width; dx++) {
      const cellX = x + dx;
      const cellY = y + dy;
      const oldOwner = Game.grid[cellY][cellX];
      
      if (oldOwner !== 0 && oldOwner !== Game.currentPlayer) {
        stolenCells++;
      } else if (oldOwner === Game.currentPlayer) {
        overwrittenSelf++;
      }
      
      Game.grid[cellY][cellX] = Game.currentPlayer;
    }
  }
  
  console.log(`Stolen cells: ${stolenCells}, Overwritten self: ${overwrittenSelf}`);
  
  // Capture enclosed territories - ВАЖНО: исправленный алгоритм
  const capturedByContour = captureContours();
  console.log(`Captured ${capturedByContour} cells by contour`);
  
  logMove('placement', {
    x: x,
    y: y,
    width: dim.width,
    height: dim.height,
    orientation: Game.rectangleOrientation,
    isKush: Game.isKush,
    stolenCells: stolenCells,
    overwrittenSelf: overwrittenSelf,
    capturedByContour: capturedByContour
  });
  
  checkGameOver();
  switchPlayer();
  
  Game.diceRolled = false;
  Game.isKush = false;
  Game.rectanglePosition = { x: -1, y: -1 };
  Game.isValidPlacement = false;
  
  // Stop KUSH animation
  stopKushAnimation();
  
  if (DOM.kushIndicator) {
    DOM.kushIndicator.style.display = 'none';
  }
  updateUI();
  renderGrid();
}

/**
 * Get player's start position
 * @function getPlayerStartPosition
 * @param {number} player - Player number (1 or 2)
 * @returns {Object} x, y coordinates
 */
function getPlayerStartPosition(player) {
  // Проверяем все углы
  const corners = [
    { x: 0, y: 0 },
    { x: Game.width - 1, y: 0 },
    { x: 0, y: Game.height - 1 },
    { x: Game.width - 1, y: Game.height - 1 }
  ];
  
  for (const corner of corners) {
    if (Game.grid[corner.y][corner.x] === player) {
      return corner;
    }
  }
  
  return { x: 0, y: 0 };
}

/**
 * Check if current player has any valid placement
 * @function hasValidPlacement
 * @returns {boolean} True if at least one valid placement exists
 */
function hasValidPlacement() {
  const dim = getRectangleDimensions();
  
  // KUSH always has valid placements
  if (Game.isKush) return true;
  
  // Try all possible positions
  for (let y = 0; y <= Game.height - dim.height; y++) {
    for (let x = 0; x <= Game.width - dim.width; x++) {
      if (canPlaceRectangle(x, y)) {
        return true;
      }
    }
  }
  
  // Try other orientation
  Game.rectangleOrientation = Game.rectangleOrientation === 0 ? 1 : 0;
  const dim2 = getRectangleDimensions();
  
  for (let y = 0; y <= Game.height - dim2.height; y++) {
    for (let x = 0; x <= Game.width - dim2.width; x++) {
      if (canPlaceRectangle(x, y)) {
        Game.rectangleOrientation = 0;
        return true;
      }
    }
  }
  
  Game.rectangleOrientation = 0;
  return false;
}

// ====================================================================
// CONTOUR CAPTURE ALGORITHМ - ПРАВИЛЬНЫЙ АЛГОРИТМ ПО ТЕХЗАДАНИЮ
// ====================================================================

/**
 * Capture all enclosed territories for current player
 * По ТЗ: контур может замыкаться с помощью границ поля
 * @function captureContours
 * @returns {number} Number of cells captured
 */
function captureContours() {
  const player = Game.currentPlayer;
  const W = Game.width;
  const H = Game.height;

  let totalCaptured = 0;

  // ------------------------------------------------------------------
  // Build "walls" map on an expanded field (1-cell border around)
  // Walls are:
  //   - current player's cells
  //   - selected segments of the field border (virtual walls) to support
  //     contour closure via 1 side ("П") or 2 sides (corner), per spec.
  // Then we flood-fill "outside air" from (0,0) on the expanded field.
  // Everything NOT reachable from outside is "inside" and gets captured.
  // ------------------------------------------------------------------

  const expandedWidth = W + 2;
  const expandedHeight = H + 2;

  const isWall = Array.from({ length: expandedHeight }, () => Array(expandedWidth).fill(false));

  // Mark player's cells as walls
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (Game.grid[y][x] === player) {
        isWall[y + 1][x + 1] = true;
      }
    }
  }

  // --------------------------------------------------------------
  // Virtual border walls (important!)
  // We do NOT make the whole border a wall (it would capture all).
  // Instead we add ONLY the border segments that are needed to close
  // a contour which "leans" on the border:
  //   - Component touches the same side in 2+ positions: close between
  //     min..max touch on that side ("П" closure).
  //   - Component touches 2 adjacent sides: close from the nearest touch
  //     points to the corner (corner closure).
  // --------------------------------------------------------------
  (function addVirtualBorderWalls() {
    const visited = Array.from({ length: H }, () => Array(W).fill(false));

    // IMPORTANT: for border-based closures ("П" and corner),
// we treat player's territory connectivity as 8-connected.
// This matches the game's adjacency rule (touching corners counts) and
// prevents missing closures when pieces meet diagonally.
const dirs8 = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];

    function bfsComponent(sx, sy) {
      const qx = [sx];
      const qy = [sy];
      visited[sy][sx] = true;

      // Touch ranges (in original coordinates)
      let topMin = Infinity, topMax = -Infinity, topCount = 0;
      let bottomMin = Infinity, bottomMax = -Infinity, bottomCount = 0;
      let leftMin = Infinity, leftMax = -Infinity, leftCount = 0;
      let rightMin = Infinity, rightMax = -Infinity, rightCount = 0;

      while (qx.length) {
        const x = qx.pop();
        const y = qy.pop();

        // Side touches
        if (y === 0) { topMin = Math.min(topMin, x); topMax = Math.max(topMax, x); topCount++; }
        if (y === H - 1) { bottomMin = Math.min(bottomMin, x); bottomMax = Math.max(bottomMax, x); bottomCount++; }
        if (x === 0) { leftMin = Math.min(leftMin, y); leftMax = Math.max(leftMax, y); leftCount++; }
        if (x === W - 1) { rightMin = Math.min(rightMin, y); rightMax = Math.max(rightMax, y); rightCount++; }

        for (const d of dirs8) {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          if (visited[ny][nx]) continue;
          if (Game.grid[ny][nx] !== player) continue;
          visited[ny][nx] = true;
          qx.push(nx);
          qy.push(ny);
        }
      }

      return {
        top: { min: topMin, max: topMax, count: topCount },
        bottom: { min: bottomMin, max: bottomMax, count: bottomCount },
        left: { min: leftMin, max: leftMax, count: leftCount },
        right: { min: rightMin, max: rightMax, count: rightCount }
      };
    }

    function wallTop(fromX, toX) {
      const a = Math.max(0, Math.min(fromX, toX));
      const b = Math.min(W - 1, Math.max(fromX, toX));
      for (let x = a; x <= b; x++) {
        const ex = x + 1;
        // Keep (0,0) outside start cell open; do not matter for ex>=1 anyway
        isWall[0][ex] = true;
      }
    }

    function wallBottom(fromX, toX) {
      const a = Math.max(0, Math.min(fromX, toX));
      const b = Math.min(W - 1, Math.max(fromX, toX));
      for (let x = a; x <= b; x++) {
        const ex = x + 1;
        isWall[H + 1][ex] = true;
      }
    }

    function wallLeft(fromY, toY) {
      const a = Math.max(0, Math.min(fromY, toY));
      const b = Math.min(H - 1, Math.max(fromY, toY));
      for (let y = a; y <= b; y++) {
        const ey = y + 1;
        isWall[ey][0] = true;
      }
    }

    function wallRight(fromY, toY) {
      const a = Math.max(0, Math.min(fromY, toY));
      const b = Math.min(H - 1, Math.max(fromY, toY));
      for (let y = a; y <= b; y++) {
        const ey = y + 1;
        isWall[ey][W + 1] = true;
      }
    }

    // Process each connected component of player's cells
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (Game.grid[y][x] !== player || visited[y][x]) continue;

        const touches = bfsComponent(x, y);

        // "П" closures: same side touched 2+ times => close min..max on that side
        if (touches.top.count >= 2) wallTop(touches.top.min, touches.top.max);
        if (touches.bottom.count >= 2) wallBottom(touches.bottom.min, touches.bottom.max);
        if (touches.left.count >= 2) wallLeft(touches.left.min, touches.left.max);
        if (touches.right.count >= 2) wallRight(touches.right.min, touches.right.max);

        // Corner closures: component touches two adjacent sides.
        // IMPORTANT: to avoid accidental full-border sealing (and "capture all")
        // we must not allow ONE single touch on a side to be used to close to
        // BOTH corners on that side.
        let canTL = touches.top.count >= 1 && touches.left.count >= 1;
        let canTR = touches.top.count >= 1 && touches.right.count >= 1;
        let canBL = touches.bottom.count >= 1 && touches.left.count >= 1;
        let canBR = touches.bottom.count >= 1 && touches.right.count >= 1;

        // Resolve conflicts for TOP side (single top touch used by TL+TR)
        if (touches.top.count === 1 && canTL && canTR) {
          const xTop = touches.top.min; // == max
          const scoreTL = xTop + touches.left.min;
          const scoreTR = (W - 1 - xTop) + touches.right.min;
          if (scoreTL <= scoreTR) canTR = false; else canTL = false;
        }
        // Resolve conflicts for BOTTOM side (single bottom touch used by BL+BR)
        if (touches.bottom.count === 1 && canBL && canBR) {
          const xBot = touches.bottom.min;
          const scoreBL = xBot + (H - 1 - touches.left.max);
          const scoreBR = (W - 1 - xBot) + (H - 1 - touches.right.max);
          if (scoreBL <= scoreBR) canBR = false; else canBL = false;
        }
        // Resolve conflicts for LEFT side (single left touch used by TL+BL)
        if (touches.left.count === 1 && canTL && canBL) {
          const yLeft = touches.left.min;
          const scoreTL = yLeft + touches.top.min;
          const scoreBL = (H - 1 - yLeft) + touches.bottom.min;
          if (scoreTL <= scoreBL) canBL = false; else canTL = false;
        }
        // Resolve conflicts for RIGHT side (single right touch used by TR+BR)
        if (touches.right.count === 1 && canTR && canBR) {
          const yRight = touches.right.min;
          const scoreTR = yRight + (W - 1 - touches.top.max);
          const scoreBR = (H - 1 - yRight) + (W - 1 - touches.bottom.max);
          if (scoreTR <= scoreBR) canBR = false; else canTR = false;
        }

        // Apply the selected corner closures
        if (canTL) {
          wallTop(0, touches.top.min);
          wallLeft(0, touches.left.min);
        }
        if (canTR) {
          wallTop(touches.top.max, W - 1);
          wallRight(0, touches.right.min);
        }
        if (canBL) {
          wallBottom(0, touches.bottom.min);
          wallLeft(touches.left.max, H - 1);
        }
        if (canBR) {
          wallBottom(touches.bottom.max, W - 1);
          wallRight(touches.right.max, H - 1);
        }
      }
    }

    // IMPORTANT: never block the BFS start cell (0,0)
    isWall[0][0] = false;
  })();

  // --------------------------------------------------------------
  // Flood-fill outside air on expanded grid (4-neighborhood)
  // --------------------------------------------------------------
  const visitedAir = Array.from({ length: expandedHeight }, () => Array(expandedWidth).fill(false));

  // Queue implemented with arrays + head index (fast)
  const qx = new Int32Array(expandedWidth * expandedHeight);
  const qy = new Int32Array(expandedWidth * expandedHeight);
  let qh = 0, qt = 0;

  // Seed flood-fill from ALL border cells of the expanded grid.
// This prevents the "first move in corner captures the whole field" bug,
// because local walls near (0,0) cannot block the entire outside.
function enqueueBorderCell(bx, by) {
  if (bx < 0 || bx >= expandedWidth || by < 0 || by >= expandedHeight) return;
  if (visitedAir[by][bx]) return;
  if (isWall[by][bx]) return;
  visitedAir[by][bx] = true;
  qx[qt] = bx;
  qy[qt] = by;
  qt++;
}

for (let x = 0; x < expandedWidth; x++) {
  enqueueBorderCell(x, 0);
  enqueueBorderCell(x, expandedHeight - 1);
}
for (let y = 0; y < expandedHeight; y++) {
  enqueueBorderCell(0, y);
  enqueueBorderCell(expandedWidth - 1, y);
}

const dirs4 = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
  ];

  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;

    for (const d of dirs4) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || nx >= expandedWidth || ny < 0 || ny >= expandedHeight) continue;
      if (visitedAir[ny][nx]) continue;
      if (isWall[ny][nx]) continue;
      visitedAir[ny][nx] = true;
      qx[qt] = nx; qy[qt] = ny; qt++;
    }
  }

  // --------------------------------------------------------------
  // Capture: any original cell (x,y) whose expanded (x+1,y+1) is NOT
  // reachable from outside => inside of a contour => becomes player.
  // --------------------------------------------------------------
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ex = x + 1;
      const ey = y + 1;

      if (!visitedAir[ey][ex] && Game.grid[y][x] !== player) {
        Game.grid[y][x] = player;
        totalCaptured++;
      }
    }
  }

  return totalCaptured;
}


// ====================================================================
// УТИЛИТА ДЛЯ ОТЛАДКИ ЗАХВАТА
// ====================================================================

/**
 * Debug function to visualize capture algorithm
 * @function debugCapture
 */
function debugCapture() {
  console.log("=== DEBUG CAPTURE ===");
  console.log("Current grid state:");
  
  for (let y = 0; y < Game.height; y++) {
    let row = "";
    for (let x = 0; x < Game.width; x++) {
      row += Game.grid[y][x] === 0 ? "." : Game.grid[y][x] === 1 ? "1" : "2";
    }
    console.log(row);
  }
  
  console.log(`Player ${Game.currentPlayer} (${getCurrentPlayerName()}) cell count: ${getPlayerCellCount(Game.currentPlayer)}`);
  
  // Test capture without actually applying it
  const captured = captureContoursDebug();
  console.log(`Would capture ${captured} cells`);
  console.log("=== END DEBUG ===");
}

/**
 * Debug version of captureContours that doesn't modify the grid
 * @function captureContoursDebug
 * @returns {number} Number of cells that would be captured
 */
function captureContoursDebug() {
  const player = Game.currentPlayer;
  const W = Game.width;
  const H = Game.height;

  let totalCaptured = 0;

  const expandedWidth = W + 2;
  const expandedHeight = H + 2;

  const isWall = Array.from({ length: expandedHeight }, () => Array(expandedWidth).fill(false));

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (Game.grid[y][x] === player) {
        isWall[y + 1][x + 1] = true;
      }
    }
  }

  // Same virtual border walls as in captureContours(), but without modifying grid
  (function addVirtualBorderWalls() {
    const visited = Array.from({ length: H }, () => Array(W).fill(false));
    const dirs4 = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];

    function bfsComponent(sx, sy) {
      const qx = [sx];
      const qy = [sy];
      visited[sy][sx] = true;

      let topMin = Infinity, topMax = -Infinity, topCount = 0;
      let bottomMin = Infinity, bottomMax = -Infinity, bottomCount = 0;
      let leftMin = Infinity, leftMax = -Infinity, leftCount = 0;
      let rightMin = Infinity, rightMax = -Infinity, rightCount = 0;

      while (qx.length) {
        const x = qx.pop();
        const y = qy.pop();

        if (y === 0) { topMin = Math.min(topMin, x); topMax = Math.max(topMax, x); topCount++; }
        if (y === H - 1) { bottomMin = Math.min(bottomMin, x); bottomMax = Math.max(bottomMax, x); bottomCount++; }
        if (x === 0) { leftMin = Math.min(leftMin, y); leftMax = Math.max(leftMax, y); leftCount++; }
        if (x === W - 1) { rightMin = Math.min(rightMin, y); rightMax = Math.max(rightMax, y); rightCount++; }

        for (const d of dirs4) {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          if (visited[ny][nx]) continue;
          if (Game.grid[ny][nx] !== player) continue;
          visited[ny][nx] = true;
          qx.push(nx);
          qy.push(ny);
        }
      }

      return {
        top: { min: topMin, max: topMax, count: topCount },
        bottom: { min: bottomMin, max: bottomMax, count: bottomCount },
        left: { min: leftMin, max: leftMax, count: leftCount },
        right: { min: rightMin, max: rightMax, count: rightCount }
      };
    }

    function wallTop(fromX, toX) {
      const a = Math.max(0, Math.min(fromX, toX));
      const b = Math.min(W - 1, Math.max(fromX, toX));
      for (let x = a; x <= b; x++) isWall[0][x + 1] = true;
    }
    function wallBottom(fromX, toX) {
      const a = Math.max(0, Math.min(fromX, toX));
      const b = Math.min(W - 1, Math.max(fromX, toX));
      for (let x = a; x <= b; x++) isWall[H + 1][x + 1] = true;
    }
    function wallLeft(fromY, toY) {
      const a = Math.max(0, Math.min(fromY, toY));
      const b = Math.min(H - 1, Math.max(fromY, toY));
      for (let y = a; y <= b; y++) isWall[y + 1][0] = true;
    }
    function wallRight(fromY, toY) {
      const a = Math.max(0, Math.min(fromY, toY));
      const b = Math.min(H - 1, Math.max(fromY, toY));
      for (let y = a; y <= b; y++) isWall[y + 1][W + 1] = true;
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (Game.grid[y][x] !== player || visited[y][x]) continue;

        const t = bfsComponent(x, y);

        if (t.top.count >= 2) wallTop(t.top.min, t.top.max);
        if (t.bottom.count >= 2) wallBottom(t.bottom.min, t.bottom.max);
        if (t.left.count >= 2) wallLeft(t.left.min, t.left.max);
        if (t.right.count >= 2) wallRight(t.right.min, t.right.max);

        if (t.top.count >= 1 && t.left.count >= 1) { wallTop(0, t.top.min); wallLeft(0, t.left.min); }
        if (t.top.count >= 1 && t.right.count >= 1) { wallTop(t.top.max, W - 1); wallRight(0, t.right.min); }
        if (t.bottom.count >= 1 && t.left.count >= 1) { wallBottom(0, t.bottom.min); wallLeft(t.left.max, H - 1); }
        if (t.bottom.count >= 1 && t.right.count >= 1) { wallBottom(t.bottom.max, W - 1); wallRight(t.right.max, H - 1); }
      }
    }

    isWall[0][0] = false;
  })();

  const visitedAir = Array.from({ length: expandedHeight }, () => Array(expandedWidth).fill(false));

  const qx = new Int32Array(expandedWidth * expandedHeight);
  const qy = new Int32Array(expandedWidth * expandedHeight);
  let qh = 0, qt = 0;

  // Seed flood-fill from ALL border cells of the expanded grid.
function enqueueBorderCell(bx, by) {
  if (bx < 0 || bx >= expandedWidth || by < 0 || by >= expandedHeight) return;
  if (visitedAir[by][bx]) return;
  if (isWall[by][bx]) return;
  visitedAir[by][bx] = true;
  qx[qt] = bx; qy[qt] = by; qt++;
}

for (let x = 0; x < expandedWidth; x++) {
  enqueueBorderCell(x, 0);
  enqueueBorderCell(x, expandedHeight - 1);
}
for (let y = 0; y < expandedHeight; y++) {
  enqueueBorderCell(0, y);
  enqueueBorderCell(expandedWidth - 1, y);
}

const dirs4 = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
  ];

  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;

    for (const d of dirs4) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || nx >= expandedWidth || ny < 0 || ny >= expandedHeight) continue;
      if (visitedAir[ny][nx]) continue;
      if (isWall[ny][nx]) continue;
      visitedAir[ny][nx] = true;
      qx[qt] = nx; qy[qt] = ny; qt++;
    }
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!visitedAir[y + 1][x + 1] && Game.grid[y][x] !== player) {
        totalCaptured++;
      }
    }
  }

  return totalCaptured;
}


// ====================================================================
// GAME FLOW CONTROL
// ====================================================================

/**
 * Switch to next player
 * @function switchPlayer
 */
function switchPlayer() {
  Game.currentPlayer = Game.currentPlayer === 1 ? 2 : 1;
  console.log(`Switched to player ${Game.currentPlayer} (${getCurrentPlayerName()})`);
  
  if (DOM.gameStatus) {
    DOM.gameStatus.textContent = `${getCurrentPlayerName()}'s turn`;
  }
}

/**
 * Skip current player's turn
 * @function skipTurn
 */
function autoSkipTurn(reason = 'no_moves') {
  if (Game.gameOver || Game.isReplayMode) return;

  console.log(`Auto-skipping turn (${reason})...`);

  // Log the auto-skip as a move (dice_roll is already logged separately)
  logMove('auto_skip', {
    reason,
    dice1: Game.diceValues[0],
    dice2: Game.diceValues[1],
    isKush: Game.isKush
  });

  // Reset turn state (so next player can roll)
  Game.diceRolled = false;
  Game.isKush = false;
  Game.rectangleOrientation = 0;
  Game.rectanglePosition = { x: -1, y: -1 };
  Game.isValidPlacement = false;

  if (DOM.kushIndicator) {
    DOM.kushIndicator.style.display = 'none';
  }

  switchPlayer();
  updateUI();
  renderGrid();

  if (DOM.gameStatus) {
    DOM.gameStatus.textContent = `No valid moves for previous roll — ${getCurrentPlayerName()}'s turn`;
  }
}

// Backward-compatible wrapper (UI skip removed, but keep for any internal calls)
function skipTurn() {
  autoSkipTurn('manual');
}

/**
 * Check if game is over
 * @function checkGameOver
 */
function checkGameOver() {
  let emptyCount = 0;
  
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      if (Game.grid[y][x] === 0) emptyCount++;
    }
  }
  
  if (emptyCount === 0) {
    Game.gameOver = true;
    
    const score1 = getPlayerCellCount(1);
    const score2 = getPlayerCellCount(2);
    
    let winnerText;
    if (score1 > score2) {
      winnerText = `${Game.player1Name} wins!`;
    } else if (score2 > score1) {
      winnerText = `${Game.player2Name} wins!`;
    } else {
      winnerText = "It's a tie!";
    }
    
    console.log(`Game over! ${winnerText} (${score1} vs ${score2})`);
    
    if (DOM.gameStatus) {
      DOM.gameStatus.textContent = `Game Over! ${winnerText}`;
    }
    
    logGameState("Game over");
  }
}

/**
 * Get count of cells owned by player
 * @function getPlayerCellCount
 * @param {number} player - Player number
 * @returns {number} Cell count
 */
function getPlayerCellCount(player) {
  let count = 0;
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      if (Game.grid[y][x] === player) count++;
    }
  }
  return count;
}

/**
 * Get current player's name
 * @function getCurrentPlayerName
 * @returns {string} Player name
 */
function getCurrentPlayerName() {
  return Game.currentPlayer === 1 ? Game.player1Name : Game.player2Name;
}


/**
 * Check if the current preview rectangle "touches" current player's territory.
 * Touch means 8-neighborhood contact (including diagonals). Overlap also counts as touch.
 * This is used ONLY for preview border coloring (UX), not for validating placement rules.
 * @function previewTouchesPlayer
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} player
 * @returns {boolean}
 */
function previewTouchesPlayer(x, y, w, h, player) {
  if (!Game.grid) return false;

  const x0 = Math.max(0, x - 1);
  const y0 = Math.max(0, y - 1);
  const x1 = Math.min(Game.width - 1, x + w);   // inclusive
  const y1 = Math.min(Game.height - 1, y + h);  // inclusive

  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      // If any cell in the 1-cell expanded box belongs to player, it's a touch.
      if (Game.grid[yy][xx] === player) {
        return true;
      }
    }
  }
  return false;
}


// ====================================================================
// RENDERING
// ====================================================================

/**
 * Calculate optimal cell size based on canvas and grid dimensions
 * Ensures cells are always SQUARE by using the same size for width and height
 * @function calculateCellSize
 */
function calculateCellSize() {
  if (!Game.canvas) return;
  
  // Calculate size based on filling the width and height
  const cellSizeByWidth = Game.canvas.width / Game.width;
  const cellSizeByHeight = Game.canvas.height / Game.height;
  
  // Use the smaller of the two to ensure:
  // 1. The entire grid fits in the canvas
  // 2. Cells are perfectly SQUARE (same width and height)
  Game.cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
  
  console.log(`Cell size calculated: ${Game.cellSize}px (SQUARE, canvas: ${Game.canvas.width}x${Game.canvas.height}, grid: ${Game.width}x${Game.height})`);
}

// ====================================================================
// KUSH ANIMATION
// ====================================================================

/**
 * Start KUSH pulsing animation
 * @function startKushAnimation
 */
function startKushAnimation() {
  // Stop any existing animation
  stopKushAnimation();
  
  // Reset pulse time
  Game.kushPulseTime = 0;
  
  // Animation loop
  function animate() {
    Game.kushPulseTime += 16; // ~16ms per frame (60fps)
    
    // Only render if dice rolled and not in replay mode
    if (Game.diceRolled && Game.isKush && !Game.isReplayMode) {
      renderGrid();
      Game.kushAnimationFrame = requestAnimationFrame(animate);
    }
  }
  
  // Start animation
  Game.kushAnimationFrame = requestAnimationFrame(animate);
}

/**
 * Stop KUSH pulsing animation
 * @function stopKushAnimation
 */
function stopKushAnimation() {
  if (Game.kushAnimationFrame) {
    cancelAnimationFrame(Game.kushAnimationFrame);
    Game.kushAnimationFrame = null;
  }
  Game.kushPulseTime = 0;
}

/**
 * Render the game grid
 * @function renderGrid
 */
function renderGrid() {
  if (!Game.ctx || !Game.canvas) {
    console.error("Cannot render: canvas or context not available");
    return;
  }
  
  if (!Game.grid || !Array.isArray(Game.grid) || Game.grid.length === 0) {
    console.warn("Cannot render: grid not initialized yet");
    
    Game.ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);
    Game.ctx.fillStyle = '#0f172a';
    Game.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height);
    
    Game.ctx.fillStyle = '#ffffff';
    Game.ctx.font = '20px Arial';
    Game.ctx.textAlign = 'center';
    Game.ctx.fillText('Click "New Game" to start', Game.canvas.width / 2, Game.canvas.height / 2);
    
    return;
  }
  
  console.log("Rendering grid...");
  
  const ctx = Game.ctx;
  ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);
  
  const scale = Game.zoomLevel;
  
  // Calculate centering offsets
  const gridPixelWidth = Game.width * Game.cellSize * scale;
  const gridPixelHeight = Game.height * Game.cellSize * scale;
  const centerOffsetX = (Game.canvas.width - gridPixelWidth) / 2;
  const centerOffsetY = (Game.canvas.height - gridPixelHeight) / 2;
  
  // Combine centering with pan offset
  const offsetX = centerOffsetX + Game.panOffset.x;
  const offsetY = centerOffsetY + Game.panOffset.y;
  
  // Draw cells
  for (let y = 0; y < Game.height; y++) {
    if (!Game.grid[y]) continue;
    
    for (let x = 0; x < Game.width; x++) {
      const screenX = x * Game.cellSize * scale + offsetX;
      const screenY = y * Game.cellSize * scale + offsetY;
      const cellSize = Game.cellSize * scale;
      
      let color;
      switch (Game.grid[y][x]) {
        case 1: color = Game.colors.player1; break;
        case 2: color = Game.colors.player2; break;
        default: color = Game.colors.empty;
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(screenX, screenY, cellSize, cellSize);
      
      ctx.strokeStyle = Game.colors.grid;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(screenX, screenY, cellSize, cellSize);
    }
  }
  
  // Draw placement preview
  if (Game.diceRolled && Game.rectanglePosition.x >= 0 && Game.rectanglePosition.y >= 0) {
    const dim = getRectangleDimensions();
    const gridX = Game.rectanglePosition.x;
    const gridY = Game.rectanglePosition.y;

    const screenX = gridX * Game.cellSize * scale + offsetX;
    const screenY = gridY * Game.cellSize * scale + offsetY;
    const previewWidth = dim.width * Game.cellSize * scale;
    const previewHeight = dim.height * Game.cellSize * scale;

    // KUSH MODE: Pulsing player color preview
    if (Game.isKush) {
      // Calculate pulsing alpha (0.2 to 0.5)
      const pulseAlpha = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(Game.kushPulseTime * 0.003));
      
      // Get player color
      const playerColor = Game.currentPlayer === 1 ? Game.colors.player1 : Game.colors.player2;
      
      // Parse hex color to RGB
      const r = parseInt(playerColor.slice(1, 3), 16);
      const g = parseInt(playerColor.slice(3, 5), 16);
      const b = parseInt(playerColor.slice(5, 7), 16);
      
      // Fill with pulsing player color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulseAlpha})`;
      ctx.fillRect(screenX, screenY, previewWidth, previewHeight);
      
      // Border: solid player color, also pulsing
      const borderAlpha = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(Game.kushPulseTime * 0.003));
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${borderAlpha})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(screenX, screenY, previewWidth, previewHeight);
    } else {
      // NORMAL MODE: Neutral, non-misleading preview fill (always gray + transparent)
      ctx.fillStyle = "rgba(148, 163, 184, 0.18)";
      ctx.fillRect(screenX, screenY, previewWidth, previewHeight);

      // Border color rules:
      // - Default: gray translucent border
      // - If preview touches CURRENT player's territory (8-neighborhood): border becomes player's color
      // - Touching opponent's cells should NOT change border color
      const touchesOwn = previewTouchesPlayer(gridX, gridY, dim.width, dim.height, Game.currentPlayer);
      const playerBorder = Game.currentPlayer === 1 ? Game.colors.player1 : Game.colors.player2;
      const neutralBorder = "rgba(148, 163, 184, 0.9)";

      ctx.save();

      // If placement is not currently valid, use dashed border (but keep neutral/player color)
      if (!Game.isValidPlacement) {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = touchesOwn ? playerBorder : neutralBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, previewWidth, previewHeight);

      ctx.restore();
    }
  }



// Highlight placement rectangle from Move History (hover or pinned)
// - Border: bright green
// - Fill: semi-transparent green
// - Label: move number (1-based)
{
  const hi = Game.historyPinned || Game.historyHover;
  if (hi && hi.rect) {
    const r = hi.rect;
    const screenX = r.x * Game.cellSize * scale + offsetX;
    const screenY = r.y * Game.cellSize * scale + offsetY;
    const w = r.width * Game.cellSize * scale;
    const h = r.height * Game.cellSize * scale;

    ctx.save();
    ctx.setLineDash([]);

    // Fill
    ctx.fillStyle = "rgba(0, 255, 0, 0.16)";
    ctx.fillRect(screenX, screenY, w, h);

    // Border
    ctx.strokeStyle = "rgba(0, 255, 0, 0.95)";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, w, h);

    // Move number label (center-top-ish)
    const label = String((hi.index ?? 0) + 1);
    const fontSize = Math.max(12, Math.round(14 * scale));
    ctx.font = `${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tx = screenX + w / 2;
    const ty = screenY + Math.min(h / 2, 18 * scale);
    ctx.lineWidth = Math.max(3, Math.round(4 * scale));
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(label, tx, ty);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fillText(label, tx, ty);

    ctx.restore();
  }
}

  // Draw starting positions
  drawStartingPositions();
}

/**
 * Draw starting positions with special markers
 * @function drawStartingPositions
 */
function drawStartingPositions() {
  const ctx = Game.ctx;
  const scale = Game.zoomLevel;
  
  // Calculate centering offsets (same as in renderGrid)
  const gridPixelWidth = Game.width * Game.cellSize * scale;
  const gridPixelHeight = Game.height * Game.cellSize * scale;
  const centerOffsetX = (Game.canvas.width - gridPixelWidth) / 2;
  const centerOffsetY = (Game.canvas.height - gridPixelHeight) / 2;
  
  // Combine centering with pan offset
  const offsetX = centerOffsetX + Game.panOffset.x;
  const offsetY = centerOffsetY + Game.panOffset.y;
  
  const startPositions = [];
  for (let y = 0; y < Game.height; y++) {
    if (!Game.grid[y]) continue;
    
    for (let x = 0; x < Game.width; x++) {
      if (Game.grid[y][x] !== 0) {
        const isCorner = 
          (x === 0 && y === 0) ||
          (x === Game.width - 1 && y === 0) ||
          (x === 0 && y === Game.height - 1) ||
          (x === Game.width - 1 && y === Game.height - 1);
        
        if (isCorner) {
          startPositions.push({ x, y, player: Game.grid[y][x] });
        }
      }
    }
  }
  
  startPositions.forEach(pos => {
    const screenX = pos.x * Game.cellSize * scale + offsetX;
    const screenY = pos.y * Game.cellSize * scale + offsetY;
    const cellSize = Game.cellSize * scale;
    
    ctx.fillStyle = pos.player === 1 ? Game.colors.player1 : Game.colors.player2;
    ctx.beginPath();
    ctx.arc(
      screenX + cellSize / 2,
      screenY + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}

/**
 * Update dice visual representation
 * @function updateDiceDisplay
 */
function updateDiceDisplay() {
  const dotContainer1 = DOM.die1 ? DOM.die1.querySelector('.dot-container') : null;
  const dotContainer2 = DOM.die2 ? DOM.die2.querySelector('.dot-container') : null;
  
  if (dotContainer1) dotContainer1.innerHTML = '';
  if (dotContainer2) dotContainer2.innerHTML = '';
  
  if (dotContainer1) {
    drawDiceDots(dotContainer1, Game.diceValues[0]);
  }
  
  if (dotContainer2) {
    drawDiceDots(dotContainer2, Game.diceValues[1]);
  }
}

/**
 * Draw dots on a die face
 * @function drawDiceDots
 * @param {HTMLElement} container - Container for dots
 * @param {number} value - Dice value (1-6)
 */
function drawDiceDots(container, value) {
  const dotPositions = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]]
  };
  
  const positions = dotPositions[value] || [];
  
  positions.forEach(pos => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.position = 'absolute';
    dot.style.width = '14px';
    dot.style.height = '14px';
    dot.style.backgroundColor = '#222';
    dot.style.borderRadius = '50%';
    dot.style.left = `${pos[0] * 100}%`;
    dot.style.top = `${pos[1] * 100}%`;
    dot.style.transform = 'translate(-50%, -50%)';
    container.appendChild(dot);
  });
}

// ====================================================================
// USER INTERFACE UPDATES
// ====================================================================

/**
 * Update all UI elements
 * @function updateUI
 */
function updateUI() {
  console.log("Updating UI...");
  
  if (DOM.player1Display) DOM.player1Display.textContent = Game.player1Name;
  if (DOM.player2Display) DOM.player2Display.textContent = Game.player2Name;
  if (DOM.currentPlayerDisplay) DOM.currentPlayerDisplay.textContent = getCurrentPlayerName();
  
  if (Game.grid && Array.isArray(Game.grid) && Game.grid.length > 0) {
    const score1 = getPlayerCellCount(1);
    const score2 = getPlayerCellCount(2);
    const emptyCells = Game.width * Game.height - score1 - score2;
    
    if (DOM.score1) DOM.score1.textContent = score1;
    if (DOM.score2) DOM.score2.textContent = score2;
    if (DOM.freeCells) DOM.freeCells.textContent = emptyCells;
    
    console.log(`Scores: P1=${score1}, P2=${score2}, Empty=${emptyCells}`);
  } else {
    if (DOM.score1) DOM.score1.textContent = 0;
    if (DOM.score2) DOM.score2.textContent = 0;
    if (DOM.freeCells) DOM.freeCells.textContent = Game.width * Game.height;
  }
  
  if (DOM.rollBtn) DOM.rollBtn.disabled = Game.diceRolled || Game.gameOver || Game.isReplayMode;
  if (DOM.rotateBtn) DOM.rotateBtn.disabled = !Game.diceRolled || Game.gameOver || Game.isReplayMode;
  if (DOM.historySlider) {
    DOM.historySlider.max = Game.moveHistory.length;
    DOM.historySlider.value = Game.isReplayMode ? Game.replayPosition : Game.moveHistory.length;
  }
  
  if (DOM.prevMoveBtn) DOM.prevMoveBtn.disabled = !Game.isReplayMode || Game.replayPosition <= 0;
  if (DOM.nextMoveBtn) DOM.nextMoveBtn.disabled = !Game.isReplayMode || Game.replayPosition >= Game.moveHistory.length;
  if (DOM.liveModeBtn) DOM.liveModeBtn.disabled = !Game.isReplayMode;
  
  if (DOM.replayPosition) DOM.replayPosition.textContent = Game.isReplayMode ? Game.replayPosition : "Live";
  if (DOM.totalMoves) DOM.totalMoves.textContent = Game.moveHistory.length;
  
  if (DOM.gameStatus && !Game.gameOver && !Game.diceRolled) {
    DOM.gameStatus.textContent = `${getCurrentPlayerName()}'s turn`;
  }
}

/**
 * Update move history UI
 * @function updateHistoryUI
 */
function updateHistoryUI() {
  if (!DOM.historyList) return;
  
  DOM.historyList.innerHTML = '';
  
  Game.moveHistory.forEach((move, index) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (index === Game.replayPosition && Game.isReplayMode) {
      item.classList.add('active');
    }
    if (move.isKush) {
      item.classList.add('kush');
    }
    
    let moveText = `Move ${index + 1}: `;
    if (move.type === 'dice_roll') {
      moveText += `${move.player} rolled ${move.dice1},${move.dice2}`;
      if (move.isKush) moveText += ' (KUSH!)';
    } else if (move.type === 'placement') {
      moveText += `${move.player} placed ${move.width}×${move.height} at ${move.x},${move.y}`;
      if (move.stolenCells > 0) moveText += `, stole ${move.stolenCells}`;
      if (move.capturedByContour > 0) moveText += `, captured ${move.capturedByContour}`;
    } else if (move.type === 'skip') {
      moveText += `${move.player} skipped turn`;
    }
    
    item.textContent = moveText;
    item.addEventListener('click', () => {
      jumpToMove(index);
      const m = Game.moveHistory[index];
      // Toggle pinned highlight for placement moves in replay mode
      if (Game.isReplayMode && m && m.type === 'placement') {
        if (Game.historyPinned && Game.historyPinned.index === index) {
          Game.historyPinned = null;
        } else {
          Game.historyPinned = { index, rect: { x: m.x, y: m.y, width: m.width, height: m.height } };
        }
      } else {
        Game.historyPinned = null;
      }
      Game.historyHover = null;
      renderGrid();
      updateHistoryUI();
    });

    const onEnter = () => {
      // Highlight ONLY when hovering the currently selected move in replay mode
      if (!Game.isReplayMode || index !== Game.replayPosition) return;
      const m = Game.moveHistory[index];
      if (m && m.type === 'placement') {
        Game.historyHover = { index, rect: { x: m.x, y: m.y, width: m.width, height: m.height } };
        renderGrid();
      }
    };

    const onLeave = () => {
      if (Game.historyHover && Game.historyHover.index === index) {
        Game.historyHover = null;
        renderGrid();
      }
    };

    // Mouse + Pointer events (Mac trackpads sometimes behave better with pointer events)
    item.addEventListener('mouseenter', onEnter);
    item.addEventListener('mousemove', onEnter);
    item.addEventListener('mouseleave', onLeave);

    item.addEventListener('pointerenter', onEnter);
    item.addEventListener('pointermove', onEnter);
    item.addEventListener('pointerleave', onLeave);

    DOM.historyList.appendChild(item);
  });
}


// ====================================================================
// MOVE HISTORY AND LOGGING
// ====================================================================

/**
 * Log a game move
 * @function logMove
 * @param {string} type - Move type
 * @param {Object} data - Move data
 */
function logMove(type, data) {
  const move = {
    type: type,
    player: getCurrentPlayerName(),
    playerId: Game.currentPlayer,
    turnNumber: Game.moveHistory.length + 1,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  if (type === 'placement') {
    move.gridSnapshot = getGridSnapshot();
  }
  
  Game.moveHistory.push(move);
  Game.currentMoveIndex = Game.moveHistory.length;
  updateHistoryUI();
  
  console.log(`Move logged: ${type}`, move);
}

/**
 * Log general game state
 * @function logGameState
 * @param {string} message - State message
 */
function logGameState(message) {
  console.log(`[${new Date().toISOString()}] ${message}`, {
    player1: Game.player1Name,
    player2: Game.player2Name,
    scores: {
      player1: getPlayerCellCount(1),
      player2: getPlayerCellCount(2)
    },
    freeCells: Game.width * Game.height - getPlayerCellCount(1) - getPlayerCellCount(2)
  });
}

/**
 * Get grid snapshot as string
 * @function getGridSnapshot
 * @returns {string} Grid representation
 */
function getGridSnapshot() {
  let result = '';
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      result += Game.grid[y][x];
    }
  }
  return result;
}

/**
 * Load grid from snapshot
 * @function loadGridSnapshot
 * @param {string} snapshot - Grid snapshot string
 */
function loadGridSnapshot(snapshot) {
  let index = 0;
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      Game.grid[y][x] = parseInt(snapshot[index]) || 0;
      index++;
    }
  }
}

// ====================================================================
// HISTORY REPLAY
// ====================================================================

/**
 * Jump to specific move in history
 * @function jumpToMove
 * @param {number} index - Move index
 */
function jumpToMove(index) {
  if (index < 0 || index > Game.moveHistory.length) return;

  console.log(`Jumping to move ${index}`);

  Game.isReplayMode = true;
  Game.replayPosition = index;
  Game.historyHover = null;
  Game.historyPinned = null;

  // IMPORTANT:
  // We must NOT clear moveHistory when resetting the board for replay,
  // otherwise navigation breaks.
  // Also skip setting starting positions - we'll load from snapshot instead
  startNewGame({ preserveHistory: true, preserveReplay: true, skipStartingPositions: true });

  // Apply grid snapshots up to requested position (fast + stable even if rules change)
  let lastSnapshot = null;
  for (let i = 0; i < index; i++) {
    const move = Game.moveHistory[i];
    if (move && move.gridSnapshot) lastSnapshot = move.gridSnapshot;
  }
  if (lastSnapshot) {
    loadGridSnapshot(lastSnapshot);
  } else {
    // If no snapshot found before this move, set starting positions
    setStartingPositions();
  }

  // Restore "turn" meta state based on the last processed move
  if (index === 0) {
    Game.currentPlayer = 1;
    Game.diceRolled = false;
    Game.isKush = false;
  } else {
    const lastMove = Game.moveHistory[index - 1];
    if (lastMove) {
      if (lastMove.type === 'dice_roll') {
        Game.currentPlayer = lastMove.playerId;
        Game.diceValues = [lastMove.dice1, lastMove.dice2];
        Game.diceRolled = true;
        Game.isKush = !!lastMove.isKush;
      } else if (lastMove.type === 'placement' || lastMove.type === 'skip') {
        Game.currentPlayer = lastMove.playerId === 1 ? 2 : 1;
        Game.diceRolled = false;
        Game.isKush = false;
      }
    }
  }

  // If the move at "index" itself has a snapshot (placements), show it
  if (Game.moveHistory[index] && Game.moveHistory[index].gridSnapshot) {
    loadGridSnapshot(Game.moveHistory[index].gridSnapshot);
  }

  updateUI();
  renderGrid();
  updateHistoryUI();
}

/**
 * Go to previous move in replay
 * @function prevMove
 */
function prevMove() {
  if (Game.isReplayMode && Game.replayPosition > 0) {
    jumpToMove(Game.replayPosition - 1);
  }
}

/**
 * Go to next move in replay
 * @function nextMove
 */
function nextMove() {
  if (Game.isReplayMode && Game.replayPosition < Game.moveHistory.length) {
    jumpToMove(Game.replayPosition + 1);
  }
}

/**
 * Exit replay mode
 * @function exitReplayMode
 */
function exitReplayMode() {
  Game.isReplayMode = false;
  Game.replayPosition = Game.moveHistory.length;
  Game.historyHover = null;
  Game.historyPinned = null;
  
  if (Game.moveHistory.length > 0) {
    const lastMove = Game.moveHistory[Game.moveHistory.length - 1];
    if (lastMove.gridSnapshot) {
      loadGridSnapshot(lastMove.gridSnapshot);
    }
    Game.currentPlayer = lastMove.playerId === 1 ? 2 : 1;
  }
  
  updateUI();
  renderGrid();
  updateHistoryUI();
}

// ====================================================================
// IMPORT/EXPORT
// ====================================================================

/**
 * Open export modal
 * @function openExportModal
 */
function openExportModal() {
  const gameData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    settings: {
      width: Game.width,
      height: Game.height,
      player1Name: Game.player1Name,
      player2Name: Game.player2Name,
      startingCorner: Game.startingCorner
    },
    currentState: {
      currentPlayer: Game.currentPlayer,
      diceValues: Game.diceValues,
      diceRolled: Game.diceRolled,
      isKush: Game.isKush,
      gameOver: Game.gameOver,
      grid: getGridSnapshot()
    },
    moveHistory: Game.moveHistory
  };
  
  if (DOM.exportTextarea) {
    DOM.exportTextarea.value = JSON.stringify(gameData, null, 2);
  }
  
  if (DOM.importExportModal) {
    DOM.importExportModal.classList.add('active');
  }
  
  switchTab('export');
}

/**
 * Open import modal
 * @function openImportModal
 */
function openImportModal() {
  if (DOM.importExportModal) {
    DOM.importExportModal.classList.add('active');
  }
  
  if (DOM.importTextarea) {
    DOM.importTextarea.value = '';
  }
  
  if (DOM.importAlert) {
    DOM.importAlert.style.display = 'none';
  }
  
  switchTab('import');
}

/**
 * Close modal
 * @function closeModal
 */

/**
 * Open settings drawer
 */
function openSettingsDrawer() {
  if (!DOM.settingsDrawer || !DOM.drawerBackdrop) return;
  DOM.settingsDrawer.classList.add('open');
  DOM.drawerBackdrop.classList.add('open');
  DOM.settingsDrawer.setAttribute('aria-hidden', 'false');
  DOM.drawerBackdrop.setAttribute('aria-hidden', 'false');
}

/**
 * Close settings drawer
 */
function closeSettingsDrawer() {
  if (!DOM.settingsDrawer || !DOM.drawerBackdrop) return;
  DOM.settingsDrawer.classList.remove('open');
  DOM.drawerBackdrop.classList.remove('open');
  DOM.settingsDrawer.setAttribute('aria-hidden', 'true');
  DOM.drawerBackdrop.setAttribute('aria-hidden', 'true');
}

/**
 * Open rules modal
 * @function openRulesModal
 */
function openRulesModal() {
  if (DOM.rulesModal) {
    DOM.rulesModal.classList.add('active');
  }
}

/**
 * Close rules modal
 * @function closeRulesModal
 */
function closeRulesModal() {
  if (DOM.rulesModal) {
    DOM.rulesModal.classList.remove('active');
  }
}

/**
 * Close import/export modal
 * @function closeImportExportModal
 */
function closeImportExportModal() {
  if (DOM.importExportModal) {
    DOM.importExportModal.classList.remove('active');
  }
}

/**
 * Switch modal tab
 * @function switchTab
 * @param {string} tabName - Tab to switch to
 */
function switchTab(tabName) {
  if (DOM.tabBtns) {
    DOM.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
  }
  
  const exportTab = document.getElementById('exportTab');
  const importTab = document.getElementById('importTab');
  
  if (exportTab) exportTab.classList.toggle('active', tabName === 'export');
  if (importTab) importTab.classList.toggle('active', tabName === 'import');
}

/**
 * Copy export text to clipboard
 * @function copyExportText
 */
function copyExportText() {
  if (!DOM.exportTextarea) return;
  
  DOM.exportTextarea.select();
  DOM.exportTextarea.setSelectionRange(0, 99999);
  
  try {
    document.execCommand('copy');
    
    if (DOM.importAlert) {
      DOM.importAlert.textContent = 'Game data copied to clipboard!';
      DOM.importAlert.className = 'alert success';
      DOM.importAlert.style.display = 'block';
    }
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
}

/**
 * Import game from JSON
 * @function importGame
 */
function importGame() {
  try {
    if (!DOM.importTextarea || !DOM.importTextarea.value) {
      throw new Error("No import data provided");
    }
    
    const gameData = JSON.parse(DOM.importTextarea.value);
    
    if (!gameData.settings || !gameData.currentState || !gameData.moveHistory) {
      throw new Error("Invalid game data format");
    }
    
    Game.width = gameData.settings.width;
    Game.height = gameData.settings.height;
    Game.player1Name = gameData.settings.player1Name;
    Game.player2Name = gameData.settings.player2Name;
    Game.startingCorner = gameData.settings.startingCorner;
    
    if (DOM.fieldWidth) DOM.fieldWidth.value = Game.width;
    if (DOM.fieldHeight) DOM.fieldHeight.value = Game.height;
    if (DOM.player1Name) DOM.player1Name.value = Game.player1Name;
    if (DOM.player2Name) DOM.player2Name.value = Game.player2Name;
    if (DOM.startingCorner) DOM.startingCorner.value = Game.startingCorner;
    
    Game.currentPlayer = gameData.currentState.currentPlayer;
    Game.diceValues = gameData.currentState.diceValues;
    Game.diceRolled = gameData.currentState.diceRolled;
    Game.isKush = gameData.currentState.isKush;
    Game.gameOver = gameData.currentState.gameOver;
    
    initializeGrid();
    if (gameData.currentState.grid) {
      loadGridSnapshot(gameData.currentState.grid);
    } else {
      setStartingPositions();
    }
    
    Game.moveHistory = gameData.moveHistory;
    Game.currentMoveIndex = Game.moveHistory.length;
    Game.isReplayMode = false;
    Game.replayPosition = Game.moveHistory.length;
    
    updateCanvasSize();
    updateUI();
    updateHistoryUI();
    
    if (DOM.importAlert) {
      DOM.importAlert.textContent = 'Game loaded successfully!';
      DOM.importAlert.className = 'alert success';
      DOM.importAlert.style.display = 'block';
    }
    
    setTimeout(closeModal, 1500);
    
  } catch (error) {
    console.error("Import error:", error);
    
    if (DOM.importAlert) {
      DOM.importAlert.textContent = `Error loading game: ${error.message}`;
      DOM.importAlert.className = 'alert error';
      DOM.importAlert.style.display = 'block';
    }
  }
}

// ====================================================================
// CANVAS INTERACTION
// ====================================================================

/**
 * Handle canvas click
 * @function handleCanvasClick
 * @param {MouseEvent} event - Mouse event
 */
function handleCanvasClick(event) {
  if (!Game.diceRolled || Game.gameOver || Game.isReplayMode) return;
  
  const rect = Game.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const scale = Game.zoomLevel;
  
  // Calculate centering offsets (same as in renderGrid)
  const gridPixelWidth = Game.width * Game.cellSize * scale;
  const gridPixelHeight = Game.height * Game.cellSize * scale;
  const centerOffsetX = (Game.canvas.width - gridPixelWidth) / 2;
  const centerOffsetY = (Game.canvas.height - gridPixelHeight) / 2;
  
  // Combine centering with pan offset
  const offsetX = centerOffsetX + Game.panOffset.x;
  const offsetY = centerOffsetY + Game.panOffset.y;
  
  const gridX = Math.floor((x - offsetX) / (Game.cellSize * scale));
  const gridY = Math.floor((y - offsetY) / (Game.cellSize * scale));
  
  if (gridX >= 0 && gridX < Game.width && gridY >= 0 && gridY < Game.height) {
    Game.rectanglePosition = { x: gridX, y: gridY };
    Game.isValidPlacement = canPlaceRectangle(gridX, gridY);
    
    console.log(`Canvas click at (${gridX}, ${gridY}), valid: ${Game.isValidPlacement}`);
    
    if (Game.isValidPlacement) {
      placeRectangle();
    } else {
      renderGrid();
    }
  }
}

/**
 * Handle mouse move on canvas
 * @function handleMouseMove
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseMove(event) {
  const rect = Game.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  if (Game.isPanning) {
    Game.panOffset.x += x - Game.lastMousePos.x;
    Game.panOffset.y += y - Game.lastMousePos.y;
    renderGrid();
  } else if (Game.diceRolled && !Game.gameOver && !Game.isReplayMode) {
    const scale = Game.zoomLevel;
    
    // Calculate centering offsets (same as in renderGrid)
    const gridPixelWidth = Game.width * Game.cellSize * scale;
    const gridPixelHeight = Game.height * Game.cellSize * scale;
    const centerOffsetX = (Game.canvas.width - gridPixelWidth) / 2;
    const centerOffsetY = (Game.canvas.height - gridPixelHeight) / 2;
    
    // Combine centering with pan offset
    const offsetX = centerOffsetX + Game.panOffset.x;
    const offsetY = centerOffsetY + Game.panOffset.y;
    
    const gridX = Math.floor((x - offsetX) / (Game.cellSize * scale));
    const gridY = Math.floor((y - offsetY) / (Game.cellSize * scale));
    
    if (gridX >= 0 && gridX < Game.width && gridY >= 0 && gridY < Game.height) {
      Game.rectanglePosition = { x: gridX, y: gridY };
      Game.isValidPlacement = canPlaceRectangle(gridX, gridY);
      renderGrid();
    }
  }
  
  Game.lastMousePos = { x, y };
}

/**
 * Start panning
 * @function startPan
 * @param {MouseEvent} event - Mouse event
 */
function startPan(event) {
  if (event.button === 1 || (event.button === 0 && event.altKey)) {
    Game.isPanning = true;
    const rect = Game.canvas.getBoundingClientRect();
    Game.lastMousePos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    Game.canvas.style.cursor = 'grabbing';
  }
}

/**
 * Stop panning
 * @function stopPan
 */
function stopPan() {
  Game.isPanning = false;
  Game.canvas.style.cursor = 'default';
}

/**
 * Handle zoom with mouse wheel
 * @function handleZoom
 * @param {WheelEvent} event - Wheel event
 */
function handleZoom(event) {
  event.preventDefault();
  
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  const oldZoom = Game.zoomLevel;
  Game.zoomLevel = Math.max(0.5, Math.min(3, Game.zoomLevel * zoomFactor));
  
  const rect = Game.canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  const worldX = (mouseX - Game.panOffset.x) / oldZoom;
  const worldY = (mouseY - Game.panOffset.y) / oldZoom;
  
  Game.panOffset.x = mouseX - worldX * Game.zoomLevel;
  Game.panOffset.y = mouseY - worldY * Game.zoomLevel;
  
  calculateCellSize();
  renderGrid();
}

/**
 * Change zoom level
 * @function changeZoom
 * @param {number} delta - Zoom delta
 */
function changeZoom(delta) {
  const oldZoom = Game.zoomLevel;
  Game.zoomLevel = Math.max(0.5, Math.min(3, Game.zoomLevel + delta));
  
  Game.panOffset.x = Game.canvas.width / 2 - (Game.canvas.width / 2 - Game.panOffset.x) * (Game.zoomLevel / oldZoom);
  Game.panOffset.y = Game.canvas.height / 2 - (Game.canvas.height / 2 - Game.panOffset.y) * (Game.zoomLevel / oldZoom);
  
  calculateCellSize();
  renderGrid();
}

/**
 * Center view on game field (reset pan offset)
 * @function centerView
 */
function centerView() {
  Game.panOffset.x = 0;
  Game.panOffset.y = 0;
  renderGrid();
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Debounce function for resize events
 * @function debounce
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Rotate rectangle orientation
 * @function rotateRectangle
 */
function rotateRectangle() {
  if (!Game.diceRolled || Game.gameOver || Game.isReplayMode) return;
  
  Game.rectangleOrientation = Game.rectangleOrientation === 0 ? 1 : 0;
  console.log(`Rectangle orientation changed to: ${Game.rectangleOrientation}`);
  
  if (Game.rectanglePosition.x >= 0 && Game.rectanglePosition.y >= 0) {
    Game.isValidPlacement = canPlaceRectangle(
      Game.rectanglePosition.x, 
      Game.rectanglePosition.y
    );
  }
  
  renderGrid();
}

/**
 * Update settings from inputs
 * @function updateSettings
 */
function updateSettings() {
  loadSettings();
  
  if (Game.moveHistory.length > 0 && !Game.gameOver) {
    if (confirm("Changing settings will start a new game. Continue?")) {
      startNewGame();
    } else {
      if (DOM.fieldWidth) DOM.fieldWidth.value = Game.width;
      if (DOM.fieldHeight) DOM.fieldHeight.value = Game.height;
      if (DOM.player1Name) DOM.player1Name.value = Game.player1Name;
      if (DOM.player2Name) DOM.player2Name.value = Game.player2Name;
      if (DOM.startingCorner) DOM.startingCorner.value = Game.startingCorner;
    }
  }
}

/**
 * Clear move history
 * @function clearHistory
 */
function clearHistory() {
  if (confirm("Clear all move history?")) {
    Game.moveHistory = [];
    Game.currentMoveIndex = 0;
    updateHistoryUI();
  }
}

/**
 * Handle hotkey presses
 * @function handleHotkey
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleHotkey(event) {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }
  
  switch (event.key.toLowerCase()) {
    case 'r':
      if (DOM.rollBtn && !DOM.rollBtn.disabled) rollDice();
      break;
    case 's':
      if (DOM.rotateBtn && !DOM.rotateBtn.disabled) rotateRectangle();
      break;
    case '+':
    case '=':
      changeZoom(0.2);
      break;
    case '-':
    case '_':
      changeZoom(-0.2);
      break;
  }
}

/**
 * Handle history slider change
 * @function onHistorySliderChange
 */
function onHistorySliderChange() {
  const value = parseInt(DOM.historySlider.value);
  if (value !== Game.replayPosition) {
    jumpToMove(value);
  }
}

// ====================================================================
// INITIALIZE GAME ON LOAD
// ====================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}
