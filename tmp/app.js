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
  rollBtn: null,
  rotateBtn: null,
  skipBtn: null,
  exportBtn: null,
  importBtn: null,
  clearLogBtn: null,
  prevMoveBtn: null,
  nextMoveBtn: null,
  liveModeBtn: null,
  zoomInBtn: null,
  zoomOutBtn: null,
  centerViewBtn: null,
  
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
  importExportModal: null,
  exportTextarea: null,
  importTextarea: null,
  copyBtn: null,
  loadBtn: null,
  importAlert: null,
  modalClose: null,
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
  DOM.rollBtn = document.getElementById('rollBtn');
  DOM.rotateBtn = document.getElementById('rotateBtn');
  DOM.skipBtn = document.getElementById('skipBtn');
  DOM.exportBtn = document.getElementById('exportBtn');
  DOM.importBtn = document.getElementById('importBtn');
  DOM.clearLogBtn = document.getElementById('clearLogBtn');
  DOM.prevMoveBtn = document.getElementById('prevMoveBtn');
  DOM.nextMoveBtn = document.getElementById('nextMoveBtn');
  DOM.liveModeBtn = document.getElementById('liveModeBtn');
  DOM.zoomInBtn = document.getElementById('zoomInBtn');
  DOM.zoomOutBtn = document.getElementById('zoomOutBtn');
  DOM.centerViewBtn = document.getElementById('centerViewBtn');
  
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
  DOM.importExportModal = document.getElementById('importExportModal');
  DOM.exportTextarea = document.getElementById('exportTextarea');
  DOM.importTextarea = document.getElementById('importTextarea');
  DOM.copyBtn = document.getElementById('copyBtn');
  DOM.loadBtn = document.getElementById('loadBtn');
  DOM.importAlert = document.getElementById('importAlert');
  DOM.modalClose = document.querySelector('.modal-close');
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
  if (DOM.skipBtn) DOM.skipBtn.addEventListener('click', skipTurn);
  
  // History controls
  if (DOM.exportBtn) DOM.exportBtn.addEventListener('click', openExportModal);
  if (DOM.importBtn) DOM.importBtn.addEventListener('click', openImportModal);
  if (DOM.clearLogBtn) DOM.clearLogBtn.addEventListener('click', clearHistory);
  if (DOM.prevMoveBtn) DOM.prevMoveBtn.addEventListener('click', prevMove);
  if (DOM.nextMoveBtn) DOM.nextMoveBtn.addEventListener('click', nextMove);
  if (DOM.liveModeBtn) DOM.liveModeBtn.addEventListener('click', exitReplayMode);
  if (DOM.historySlider) DOM.historySlider.addEventListener('input', onHistorySliderChange);
  
  // Canvas controls
  if (DOM.zoomInBtn) DOM.zoomInBtn.addEventListener('click', () => changeZoom(0.2));
  if (DOM.zoomOutBtn) DOM.zoomOutBtn.addEventListener('click', () => changeZoom(-0.2));
  if (DOM.centerViewBtn) DOM.centerViewBtn.addEventListener('click', centerView);
  
  // Canvas interaction
  if (Game.canvas) {
    Game.canvas.addEventListener('mousedown', startPan);
    Game.canvas.addEventListener('mousemove', handleMouseMove);
    Game.canvas.addEventListener('mouseup', stopPan);
    Game.canvas.addEventListener('wheel', handleZoom);
    Game.canvas.addEventListener('click', handleCanvasClick);
  }
  
  // Modal controls
  if (DOM.modalClose) DOM.modalClose.addEventListener('click', closeModal);
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
function startNewGame() {
  console.log("Starting new game...");
  
  loadSettings();
  
  Game.currentPlayer = 1;
  Game.diceValues = [1, 1];
  Game.diceRolled = false;
  Game.isKush = false;
  Game.rectangleOrientation = 0;
  Game.rectanglePosition = { x: -1, y: -1 };
  Game.isValidPlacement = false;
  Game.gameOver = false;
  Game.isReplayMode = false;
  Game.replayPosition = 0;
  Game.moveHistory = [];
  Game.currentMoveIndex = 0;
  Game.zoomLevel = 1;
  Game.panOffset = { x: 0, y: 0 };
  
  initializeGrid();
  setStartingPositions();
  updateCanvasSize();
  updateUI();
  updateHistoryUI();
  closeModal();
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
    
    if (!Game.isKush && !hasValidPlacement()) {
      console.log("No valid moves found, auto-skipping turn");
      setTimeout(skipTurn, 1000);
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
  let totalCaptured = 0;
  
  console.log(`Capturing contours for player ${player}...`);
  
  // Алгоритм: расширяем поле виртуальной границей и используем BFS
  // для нахождения всех клеток, достижимых извне
  
  // Размеры расширенного поля (добавляем границу вокруг)
  const expandedWidth = Game.width + 2;
  const expandedHeight = Game.height + 2;
  
  // Массив для отметки клеток игрока как "стен"
  const isWall = Array(expandedHeight).fill().map(() => Array(expandedWidth).fill(false));
  
  // Копируем игровое поле в центр расширенного
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      if (Game.grid[y][x] === player) {
        isWall[y + 1][x + 1] = true;
      }
    }
  }
  
  // Отмечаем всю внешнюю границу как доступную (не стену)
  // Но это не делает ее стеной - она проходима
  for (let x = 0; x < expandedWidth; x++) {
    isWall[0][x] = false;
    isWall[expandedHeight - 1][x] = false;
  }
  for (let y = 0; y < expandedHeight; y++) {
    isWall[y][0] = false;
    isWall[y][expandedWidth - 1] = false;
  }
  
  // Массив для отметки посещенных клеток в BFS
  const visited = Array(expandedHeight).fill().map(() => Array(expandedWidth).fill(false));
  
  // Очередь для BFS - начинаем с угла расширенного поля
  const queue = [{ x: 0, y: 0 }];
  visited[0][0] = true;
  
  const directions = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
  ];
  
  // BFS для нахождения всех клеток, достижимых извне
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (nx >= 0 && nx < expandedWidth && ny >= 0 && ny < expandedHeight) {
        if (!visited[ny][nx] && !isWall[ny][nx]) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }
  
  // Теперь все клетки, которые не посещены и не являются стенами,
  // находятся внутри контура и должны быть захвачены
  
  // Создаем копию сетки для применения изменений
  const newGrid = [];
  for (let y = 0; y < Game.height; y++) {
    newGrid[y] = [...Game.grid[y]];
  }
  
  // Захватываем клетки
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      // Координаты в расширенном поле
      const ex = x + 1;
      const ey = y + 1;
      
      // Если клетка не посещена в BFS (не достижима извне)
      if (!visited[ey][ex]) {
        // Захватываем пустые клетки и клетки противника
        if (Game.grid[y][x] === 0 || Game.grid[y][x] !== player) {
          newGrid[y][x] = player;
          totalCaptured++;
          
          if (Game.grid[y][x] === 0) {
            console.log(`  Captured empty cell at (${x}, ${y})`);
          } else {
            console.log(`  Captured opponent cell at (${x}, ${y}) from player ${Game.grid[y][x]}`);
          }
        }
      }
    }
  }
  
  // Применяем изменения к основной сетке
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      Game.grid[y][x] = newGrid[y][x];
    }
  }
  
  console.log(`Total captured: ${totalCaptured} cells`);
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
  let totalCaptured = 0;
  
  // Упрощенная версия для отладки
  const expandedWidth = Game.width + 2;
  const expandedHeight = Game.height + 2;
  
  const isWall = Array(expandedHeight).fill().map(() => Array(expandedWidth).fill(false));
  
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      if (Game.grid[y][x] === player) {
        isWall[y + 1][x + 1] = true;
      }
    }
  }
  
  for (let x = 0; x < expandedWidth; x++) {
    isWall[0][x] = false;
    isWall[expandedHeight - 1][x] = false;
  }
  for (let y = 0; y < expandedHeight; y++) {
    isWall[y][0] = false;
    isWall[y][expandedWidth - 1] = false;
  }
  
  const visited = Array(expandedHeight).fill().map(() => Array(expandedWidth).fill(false));
  const queue = [{ x: 0, y: 0 }];
  visited[0][0] = true;
  
  const directions = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
  ];
  
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (nx >= 0 && nx < expandedWidth && ny >= 0 && ny < expandedHeight) {
        if (!visited[ny][nx] && !isWall[ny][nx]) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }
  
  for (let y = 0; y < Game.height; y++) {
    for (let x = 0; x < Game.width; x++) {
      const ex = x + 1;
      const ey = y + 1;
      
      if (!visited[ey][ex]) {
        if (Game.grid[y][x] === 0 || Game.grid[y][x] !== player) {
          totalCaptured++;
        }
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
function skipTurn() {
  if (Game.diceRolled || Game.gameOver || Game.isReplayMode) return;
  
  console.log("Skipping turn...");
  
  logMove('skip', {});
  switchPlayer();
  updateUI();
  renderGrid();
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

// ====================================================================
// RENDERING
// ====================================================================

/**
 * Calculate optimal cell size based on canvas and grid dimensions
 * @function calculateCellSize
 */
function calculateCellSize() {
  if (!Game.canvas) return;
  
  const maxWidth = Game.canvas.width / (Game.width * Game.zoomLevel);
  const maxHeight = Game.canvas.height / (Game.height * Game.zoomLevel);
  Game.cellSize = Math.min(maxWidth, maxHeight, 20);
  
  console.log(`Cell size calculated: ${Game.cellSize}px`);
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
  const offsetX = Game.panOffset.x;
  const offsetY = Game.panOffset.y;
  
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
    const screenX = Game.rectanglePosition.x * Game.cellSize * scale + offsetX;
    const screenY = Game.rectanglePosition.y * Game.cellSize * scale + offsetY;
    const previewWidth = dim.width * Game.cellSize * scale;
    const previewHeight = dim.height * Game.cellSize * scale;
    
    ctx.fillStyle = Game.isValidPlacement ? 
      Game.colors.preview : 
      Game.colors.invalid;
    ctx.fillRect(screenX, screenY, previewWidth, previewHeight);
    
    ctx.strokeStyle = Game.isValidPlacement ? Game.colors.highlight : "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, previewWidth, previewHeight);
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
  const offsetX = Game.panOffset.x;
  const offsetY = Game.panOffset.y;
  
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
  if (DOM.skipBtn) DOM.skipBtn.disabled = Game.diceRolled || Game.gameOver || Game.isReplayMode;
  
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
    item.addEventListener('click', () => jumpToMove(index));
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
  
  startNewGame();
  
  for (let i = 0; i < index; i++) {
    const move = Game.moveHistory[i];
    
    if (move.type === 'placement') {
      Game.currentPlayer = move.playerId;
      Game.diceValues = [move.dice1, move.dice2];
      Game.isKush = move.isKush;
      
      const dim = move.orientation === 0 ? 
        { width: move.dice1, height: move.dice2 } :
        { width: move.dice2, height: move.dice1 };
      
      for (let dy = 0; dy < dim.height; dy++) {
        for (let dx = 0; dx < dim.width; dx++) {
          Game.grid[move.y + dy][move.x + dx] = move.playerId;
        }
      }
      
      captureContours();
      Game.currentPlayer = Game.currentPlayer === 1 ? 2 : 1;
    }
  }
  
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
function closeModal() {
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
  const offsetX = Game.panOffset.x;
  const offsetY = Game.panOffset.y;
  
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
    const offsetX = Game.panOffset.x;
    const offsetY = Game.panOffset.y;
    
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
 * Center view on game field
 * @function centerView
 */
function centerView() {
  Game.panOffset.x = (Game.canvas.width - Game.width * Game.cellSize * Game.zoomLevel) / 2;
  Game.panOffset.y = (Game.canvas.height - Game.height * Game.cellSize * Game.zoomLevel) / 2;
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
    case ' ':
      if (DOM.skipBtn && !DOM.skipBtn.disabled) skipTurn();
      event.preventDefault();
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
