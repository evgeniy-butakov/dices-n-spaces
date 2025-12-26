/**
 * AI Player Module for Dices-n-Spaces - WITH MEDIUM AI PROTOTYPE
 * 
 * This module provides AI functionality that can be integrated into the game.
 * The AI makes decisions based on the current game state.
 * 
 * @module AIPlayer
 * @version 1.1.0-prototype
 */

// ====================================================================
// AI PLAYER CLASS
// ====================================================================

class AIPlayer {
  /**
   * Create an AI player
   * @param {string} difficulty - AI difficulty level: 'easy', 'medium', 'hard'
   * @param {number} playerId - Player ID (1 or 2)
   * @param {Object} options - Additional options
   */
  constructor(difficulty = 'easy', playerId = 2, options = {}) {
    this.difficulty = difficulty;
    this.playerId = playerId;
    this.options = {
      moveDelay: options.moveDelay || 800,        // Delay before AI makes move (ms)
      thinkingDelay: options.thinkingDelay || 400 // Delay to simulate "thinking" (ms)
    };
    
    // Scoring weights for Medium AI
    this.weights = {
      cellGain: 10,                    // Points per cell gained
      cornerBonus: 20,                 // Bonus for corner positions
      edgeBonus: 10,                   // Bonus for edge positions
      connectionBonus: 15,             // Bonus per connected side
      contourCaptureMultiplier: 10,    // PHASE 2 STEP 2: Points per captured cell
      opponentLockdownBonus: 100       // PHASE 2 STEP 4: Bonus for blocking opponent's corner
    };
    
    console.log(`AI Player created: difficulty=${difficulty}, playerId=${playerId}`);
  }
  
  /**
   * Main entry point: AI makes a complete turn
   * This should be called when it's AI's turn to play
   * 
   * @param {Object} gameAPI - Game API object with methods to interact with game
   * @returns {Promise<Object>} Result of the move
   */
  async takeTurn(gameAPI) {
    console.log(`AI Player ${this.playerId} taking turn...`);
    
    try {
      // Wait a bit before doing anything (simulate human reaction time)
      await this._delay(this.options.thinkingDelay);
      
      // Step 1: ALWAYS roll dice for AI turn
      console.log('AI: Rolling dice...');
      await gameAPI.rollDice();
      await this._delay(this.options.moveDelay);
      
      // Step 2: Get current game state
      console.log('AI: Getting game state...');
      const gameState = gameAPI.getGameState();
      console.log(`AI: Game state - diceValues: [${gameState.diceValues}], isKush: ${gameState.isKush}, currentPlayer: ${gameState.currentPlayer}`);
      
      // CRITICAL: Check if we're still the current player
      // (auto-skip might have switched players already)
      if (gameState.currentPlayer !== this.playerId) {
        console.log(`AI: Player switched to ${gameState.currentPlayer}, aborting turn`);
        return { action: 'abort', reason: 'player_switched' };
      }
      
      // Step 3: Decide on placement
      console.log('AI: Choosing placement...');
      const placement = this.choosePlacement(gameState);
      
      if (!placement) {
        console.log('AI: No valid placement found, skipping turn');
        await gameAPI.skipTurn();
        return { action: 'skip' };
      }
      
      // Step 4: Execute placement
      console.log(`AI: Placing at (${placement.x}, ${placement.y}), orientation=${placement.orientation}, score=${placement.score}`);
      await gameAPI.placePiece(placement.x, placement.y, placement.orientation);
      
      console.log('AI: Turn completed successfully');
      return { 
        action: 'place', 
        x: placement.x, 
        y: placement.y, 
        orientation: placement.orientation,
        score: placement.score
      };
    } catch (error) {
      console.error('AI: Error during turn:', error);
      console.error('AI: Error stack:', error.stack);
      
      // Try to skip turn as fallback
      try {
        console.log('AI: Attempting to skip turn after error...');
        await gameAPI.skipTurn();
      } catch (skipError) {
        console.error('AI: Failed to skip turn:', skipError);
      }
      
      throw error;
    }
  }
  
  /**
   * Choose where to place the rectangle
   * 
   * @param {Object} gameState - Current game state
   * @returns {Object|null} Placement {x, y, orientation, score} or null if no valid move
   */
  choosePlacement(gameState) {
    const { grid, width, height, diceValues, isKush, currentPlayer } = gameState;
    
    // Generate all possible placements
    const possibleMoves = this._generatePossibleMoves(gameState);
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    // Choose based on difficulty
    if (this.difficulty === 'medium') {
      return this._chooseBestMove(possibleMoves, gameState);
    } else {
      // Easy AI: Random
      return this._chooseRandomMove(possibleMoves);
    }
  }
  
  /**
   * Generate all possible valid placements
   * 
   * @param {Object} gameState - Current game state
   * @returns {Array} Array of possible placements [{x, y, orientation, score}, ...]
   * @private
   */
  _generatePossibleMoves(gameState) {
    const { grid, width, height, diceValues, isKush, currentPlayer, validationFn } = gameState;
    const possibleMoves = [];
    
    console.log(`AI: Generating moves for ${diceValues[0]}×${diceValues[1]}, player=${currentPlayer}, KUSH=${isKush}`);
    
    // Get rectangle dimensions for both orientations
    const dim1 = { width: diceValues[0], height: diceValues[1] };
    const dim2 = { width: diceValues[1], height: diceValues[0] };
    
    // Try both orientations (unless it's a square)
    const orientations = diceValues[0] === diceValues[1] ? [0] : [0, 1];
    
    let checkedCount = 0;
    let errorCount = 0;
    
    for (let orientation of orientations) {
      const dim = orientation === 0 ? dim1 : dim2;
      
      // Try all positions on the grid
      for (let y = 0; y <= height - dim.height; y++) {
        for (let x = 0; x <= width - dim.width; x++) {
          checkedCount++;
          
          try {
            // Use game's validation function if provided, otherwise use our own
            let isValid;
            // CRITICAL: For KUSH mode, always use our own validation
            // because game's validation doesn't handle KUSH correctly
            if (isKush) {
              isValid = this._isValidPlacement(grid, x, y, dim.width, dim.height, currentPlayer, isKush, width, height);
            } else if (validationFn) {
              isValid = validationFn(x, y, dim.width, dim.height);
            } else {
              isValid = this._isValidPlacement(grid, x, y, dim.width, dim.height, currentPlayer, isKush, width, height);
            }
            
            if (isValid) {
              possibleMoves.push({
                x: x,
                y: y,
                orientation: orientation,
                width: dim.width,
                height: dim.height,
                score: 0 // Will be calculated later for Medium AI
              });
            }
          } catch (error) {
            errorCount++;
            if (errorCount <= 3) {  // Log only first 3 errors
              console.error(`AI: Validation error at (${x},${y}) orientation=${orientation}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`AI: Checked ${checkedCount} positions, found ${possibleMoves.length} valid moves, ${errorCount} errors`);
    return possibleMoves;
  }
  
  // ====================================================================
  // MEDIUM AI: MOVE EVALUATION
  // ====================================================================
  
  /**
   * Choose best move based on evaluation (Medium AI)
   * 
   * @param {Array} possibleMoves - Array of possible moves
   * @param {Object} gameState - Current game state
   * @returns {Object} Best move {x, y, orientation, score}
   * @private
   */
  _chooseBestMove(possibleMoves, gameState) {
    console.log(`AI Medium: Evaluating ${possibleMoves.length} moves...`);
    
    // PRIORITY STRATEGY: Check if KUSH can capture opponent's pieces
    // This applies to ANY turn where we have KUSH, not just first turn
    const { grid, width, height, diceValues, isKush, currentPlayer, turnNumber } = gameState;
    
    // Check if this is AI's first turn (for logging purposes)
    // Turn sequence: 1=P1 roll, 2=P1 place, 3=P2 roll, 4=P2 place, 5=P1 roll, etc.
    // So first turn for Player 2 is turns 3-4, for Player 1 is turns 1-2
    const isFirstAITurn = (currentPlayer === 2 && turnNumber <= 4) || 
                          (currentPlayer === 1 && turnNumber <= 2);
    
    // ALWAYS check for KUSH capture opportunities (not just first turn!)
    if (isKush) {
      const logPrefix = isFirstAITurn ? "🎯 FIRST AI MOVE" : "🎯 KUSH CAPTURE OPPORTUNITY";
      console.log(`${logPrefix} WITH KUSH ${diceValues[0]}×${diceValues[1]} - CHECKING COVERAGE...`);
      console.log(`   Turn number: ${turnNumber}, Current player: ${currentPlayer}, Is first AI turn: ${isFirstAITurn}`);
      
      const kushWidth = diceValues[0];
      const kushHeight = diceValues[1];
      
      // Opponent is player 1 for AI (player 2), their corner is (0,0)
      const opponentId = currentPlayer === 2 ? 1 : 2;
      const opponentCorner = currentPlayer === 2 ? {x: 0, y: 0} : {x: width-kushWidth, y: height-kushHeight};
      
      console.log(`   Opponent ID: ${opponentId}, Opponent corner: (${opponentCorner.x}, ${opponentCorner.y})`);
      
      // Find all opponent cells on the grid
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let opponentCellCount = 0;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[y][x] === opponentId) {
            opponentCellCount++;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
      
      if (opponentCellCount > 0) {
        // Calculate opponent's bounding box
        const opponentWidth = maxX - minX + 1;
        const opponentHeight = maxY - minY + 1;
        
        console.log(`   Opponent has ${opponentCellCount} cells in area ${opponentWidth}×${opponentHeight} at (${minX},${minY})`);
        console.log(`   Our KUSH: ${kushWidth}×${kushHeight}`);
        
        // Check if our KUSH completely covers opponent's piece
        // IMPORTANT: In this game, we can place OVER opponent's pieces (CONTOUR CAPTURE)!
        // So equal dimensions (3×3 vs 3×3) is VALID - we capture their piece!
        // We just need kushWidth >= opponentWidth AND kushHeight >= opponentHeight
        const opponentInCorner = (minX === 0 && minY === 0) || 
                                 (minX === width - opponentWidth && minY === height - opponentHeight);
        
        const kushCoversPiece = kushWidth >= opponentWidth && kushHeight >= opponentHeight;
        
        console.log(`   Checks: opponentInCorner=${opponentInCorner}, kushCoversPiece=${kushCoversPiece}`);
        
        if (opponentInCorner && kushCoversPiece) {
          console.log(`   ✅ KUSH COMPLETELY COVERS OPPONENT! ${kushWidth}×${kushHeight} >= ${opponentWidth}×${opponentHeight}`);
          console.log(`   💡 We will CAPTURE opponent's piece via CONTOUR CAPTURE!`);
          
          // DEBUG: Show all possible moves
          console.log(`   DEBUG: Total possible moves = ${possibleMoves.length}`);
          const cornerMoves = possibleMoves.filter(m => m.x === 0 && m.y === 0);
          console.log(`   DEBUG: Moves at (0,0) = ${cornerMoves.length}`);
          if (cornerMoves.length > 0) {
            console.log(`   DEBUG: Corner move found:`, cornerMoves[0]);
          } else {
            console.log(`   DEBUG: First 5 possible moves:`, possibleMoves.slice(0, 5).map(m => `(${m.x},${m.y})`).join(', '));
          }
          
          // Find move that places at opponent's corner
          const cornerMove = possibleMoves.find(m => 
            m.x === opponentCorner.x && m.y === opponentCorner.y
          );
          
          if (cornerMove) {
            console.log(`   🔒 GUARANTEED CORNER LOCKDOWN at (${opponentCorner.x},${opponentCorner.y})!`);
            console.log(`   📊 Opponent blocked until they roll KUSH! We eat ${opponentCellCount} cells!`);
            cornerMove.score = 99999; // Maximum score
            return cornerMove;
          } else {
            console.log(`   ⚠️ Corner position not available! This means validation rejected it.`);
            console.log(`   ⚠️ This shouldn't happen - checking why...`);
          }
        } else {
          console.log(`   ❌ KUSH does NOT fully cover opponent`);
          console.log(`      - Opponent in corner: ${opponentInCorner}`);
          console.log(`      - KUSH covers piece: ${kushCoversPiece} (need kushWidth >= oppWidth AND kushHeight >= oppHeight)`);
          console.log(`   → Using normal strategy`);
        }
      } else {
        console.log(`   ⚠️ No opponent cells found (shouldn't happen on turn 2!)`);
      }
    }
    
    let bestMove = null;
    let bestScore = -Infinity;
    
    // Evaluate each move
    for (let move of possibleMoves) {
      const score = this._evaluateMove(move, gameState);
      move.score = score;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    // Log top 3 moves for debugging
    const sortedMoves = [...possibleMoves].sort((a, b) => b.score - a.score);
    console.log('AI Medium: Top 3 moves:');
    for (let i = 0; i < Math.min(3, sortedMoves.length); i++) {
      const m = sortedMoves[i];
      console.log(`  ${i + 1}. (${m.x},${m.y}) orient=${m.orientation} score=${m.score.toFixed(1)}`);
    }
    
    console.log(`AI Medium: Selected move at (${bestMove.x},${bestMove.y}) with score=${bestScore.toFixed(1)}`);
    return bestMove;
  }
  
  /**
   * Evaluate a single move
   * 
   * @param {Object} move - Move to evaluate {x, y, width, height, orientation}
   * @param {Object} gameState - Current game state
   * @returns {number} Score for this move
   * @private
   */
  _evaluateMove(move, gameState) {
    let totalScore = 0;
    
    // 1. Cell gain score
    const cellScore = this._scoreCellGain(move);
    totalScore += cellScore;
    
    // 2. Position score (corners/edges)
    const posScore = this._scorePosition(move, gameState);
    totalScore += posScore;
    
    // 3. Connection score (reduced for KUSH)
    const connScore = this._scoreConnection(move, gameState);
    totalScore += connScore;
    
    // 4. Contour capture prediction (PHASE 2 STEP 2)
    const contourScore = this._scoreContourCapture(move, gameState);
    totalScore += contourScore;
    
    // 5. Risk assessment (PHASE 2 STEP 3)
    const riskPenalty = this._scoreRisk(move, gameState);
    totalScore += riskPenalty;  // This is a penalty (negative score)
    
    // 6. Opponent lockdown opportunity (PHASE 2 STEP 4)
    const lockdownScore = this._scoreLockdownOpportunity(move, gameState);
    totalScore += lockdownScore;
    
    // Debug breakdown (only for first few moves)
    if (Math.random() < 0.1) {  // Log 10% of evaluations
      console.log(`    Eval (${move.x},${move.y}): cells=${cellScore.toFixed(1)}, pos=${posScore.toFixed(1)}, conn=${connScore.toFixed(1)}, contour=${contourScore.toFixed(1)}, risk=${riskPenalty.toFixed(1)}, lockdown=${lockdownScore.toFixed(1)}, total=${totalScore.toFixed(1)}`);
    }
    
    return totalScore;
  }
  
  /**
   * Score based on cell gain (rectangle area)
   * 
   * @param {Object} move - Move to evaluate
   * @returns {number} Score
   * @private
   */
  _scoreCellGain(move) {
    const area = move.width * move.height;
    return area * this.weights.cellGain;
  }
  
  /**
   * Score based on position value (corners and edges)
   * 
   * @param {Object} move - Move to evaluate
   * @param {Object} gameState - Current game state
   * @returns {number} Score
   * @private
   */
  _scorePosition(move, gameState) {
    let score = 0;
    const { x, y, width, height } = move;
    const gridW = gameState.width;
    const gridH = gameState.height;
    
    // Define grid corners
    const corners = [
      { x: 0, y: 0 },                    // Top-left
      { x: gridW - 1, y: 0 },            // Top-right
      { x: 0, y: gridH - 1 },            // Bottom-left
      { x: gridW - 1, y: gridH - 1 }     // Bottom-right
    ];
    
    // Check if rectangle touches any corner
    for (let corner of corners) {
      if (this._rectangleTouchesPoint(x, y, width, height, corner.x, corner.y)) {
        score += this.weights.cornerBonus;
      }
    }
    
    // Edge bonus (if on any edge but not already counted in corner)
    const onEdge = (x === 0 || y === 0 || x + width === gridW || y + height === gridH);
    if (onEdge && score === 0) {  // Only if no corner bonus already given
      score += this.weights.edgeBonus;
    }
    
    return score;
  }
  
  /**
   * Score based on territory connection (how many sides connect to existing territory)
   * 
   * @param {Object} move - Move to evaluate
   * @param {Object} gameState - Current game state
   * @returns {number} Score
   * @private
   */
  _scoreConnection(move, gameState) {
    const { x, y, width, height } = move;
    const { grid, currentPlayer, isKush } = gameState;
    const gridW = gameState.width;
    const gridH = gameState.height;
    
    let connectedSides = 0;
    
    // Check top side
    if (y > 0 && this._hasPlayerCellsInRange(grid, x, y - 1, width, 1, currentPlayer)) {
      connectedSides++;
    }
    
    // Check bottom side
    if (y + height < gridH && this._hasPlayerCellsInRange(grid, x, y + height, width, 1, currentPlayer)) {
      connectedSides++;
    }
    
    // Check left side
    if (x > 0 && this._hasPlayerCellsInRange(grid, x - 1, y, 1, height, currentPlayer)) {
      connectedSides++;
    }
    
    // Check right side
    if (x + width < gridW && this._hasPlayerCellsInRange(grid, x + width, y, 1, height, currentPlayer)) {
      connectedSides++;
    }
    
    // IMPORTANT: Reduce connection bonus in KUSH mode
    // KUSH is about freedom of placement, not joining territory
    const bonus = isKush 
      ? connectedSides * 5  // Much lower bonus in KUSH
      : connectedSides * this.weights.connectionBonus;
    
    return bonus;
  }
  
  /**
   * Score based on predicted contour capture (PHASE 2 STEP 2 - DEBUG v2)
   * Simulates the move and checks how many cells would be captured
   * 
   * @param {Object} move - Move to evaluate
   * @param {Object} gameState - Current game state
   * @returns {number} Score based on captured cells
   * @private
   */
  _scoreContourCapture(move, gameState) {
    const { x, y, width, height } = move;
    const { grid, currentPlayer } = gameState;
    const W = gameState.width;
    const H = gameState.height;
    const opponent = currentPlayer === 1 ? 2 : 1;
    
    // DIAGNOSTIC: Count captures BEFORE move (for both players)
    const myCapturedBefore = this._simulateContourCapture(grid, currentPlayer, W, H);
    const opponentCapturedBefore = this._simulateContourCapture(grid, opponent, W, H);
    
    // DEBUG: Always log what we see BEFORE the move
    if (opponentCapturedBefore > 0 || myCapturedBefore > 0) {
      console.log(`    PRE-MOVE (${x},${y}): Me(P${currentPlayer})=${myCapturedBefore}, Opp(P${opponent})=${opponentCapturedBefore}`);
    }
    
    // Create a copy of the grid to simulate the move
    const gridCopy = grid.map(row => [...row]);
    
    // Place the rectangle on the copy
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const cellX = x + dx;
        const cellY = y + dy;
        if (cellX >= 0 && cellX < W && cellY >= 0 && cellY < H) {
          gridCopy[cellY][cellX] = currentPlayer;
        }
      }
    }
    
    // DIAGNOSTIC: Count captures AFTER move (for both players)
    const myCapturedAfter = this._simulateContourCapture(gridCopy, currentPlayer, W, H);
    const opponentCapturedAfter = this._simulateContourCapture(gridCopy, opponent, W, H);
    
    // DIAGNOSTIC: Log interesting cases
    const myDelta = myCapturedAfter - myCapturedBefore;
    const opponentDelta = opponentCapturedBefore - opponentCapturedAfter;
    const totalDelta = myDelta + opponentDelta;
    
    // Log only if there's significant territory change
    if (Math.abs(totalDelta) > 5 || myCapturedBefore > 10 || opponentCapturedBefore > 10) {
      console.log(`    POST-MOVE (${x},${y}): Me=${myCapturedAfter} (Δ${myDelta}), Opp=${opponentCapturedAfter} (Δ${opponentDelta}), TOTAL_GAIN=${totalDelta}`);
    }
    
    // NEW ALGORITHM (BUG #17 FIX): Count BOTH gains and opponent losses
    // This correctly values moves that break opponent contours
    return totalDelta * this.weights.contourCaptureMultiplier;
  }
  
  /**
   * Simulate contour capture algorithm
   * Simplified version of captureContours() from app.js
   * 
   * @param {Array} grid - Grid to check (already has move placed)
   * @param {number} player - Current player
   * @param {number} W - Grid width
   * @param {number} H - Grid height
   * @returns {number} Number of cells that would be captured
   * @private
   */
  _simulateContourCapture(grid, player, W, H) {
    const expandedWidth = W + 2;
    const expandedHeight = H + 2;
    const isWall = Array.from({ length: expandedHeight }, () => Array(expandedWidth).fill(false));
    
    // Mark player's cells as walls
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (grid[y][x] === player) {
          isWall[y + 1][x + 1] = true;
        }
      }
    }
    
    // Add virtual border walls (simplified - just the basics)
    this._addVirtualBorderWalls(grid, player, W, H, isWall);
    
    // Flood-fill outside air from all borders
    const visitedAir = Array.from({ length: expandedHeight }, () => Array(expandedWidth).fill(false));
    const queue = [];
    
    // Seed from all border cells
    for (let x = 0; x < expandedWidth; x++) {
      this._enqueueBorderCell(x, 0, expandedWidth, expandedHeight, visitedAir, isWall, queue);
      this._enqueueBorderCell(x, expandedHeight - 1, expandedWidth, expandedHeight, visitedAir, isWall, queue);
    }
    for (let y = 0; y < expandedHeight; y++) {
      this._enqueueBorderCell(0, y, expandedWidth, expandedHeight, visitedAir, isWall, queue);
      this._enqueueBorderCell(expandedWidth - 1, y, expandedWidth, expandedHeight, visitedAir, isWall, queue);
    }
    
    // BFS flood-fill
    const dirs4 = [{dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}];
    
    while (queue.length > 0) {
      const {x, y} = queue.shift();
      
      for (const d of dirs4) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (nx < 0 || nx >= expandedWidth || ny < 0 || ny >= expandedHeight) continue;
        if (visitedAir[ny][nx]) continue;
        if (isWall[ny][nx]) continue;
        visitedAir[ny][nx] = true;
        queue.push({x: nx, y: ny});
      }
    }
    
    // Count captured cells
    let captured = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ex = x + 1;
        const ey = y + 1;
        if (!visitedAir[ey][ex] && grid[y][x] !== player) {
          captured++;
        }
      }
    }
    
    return captured;
  }
  
  /**
   * Add virtual border walls for contour detection
   * Simplified version - just handles basic П-closures
   * 
   * @param {Array} grid - Game grid
   * @param {number} player - Current player
   * @param {number} W - Grid width
   * @param {number} H - Grid height
   * @param {Array} isWall - Wall map (expanded grid)
   * @private
   */
  _addVirtualBorderWalls(grid, player, W, H, isWall) {
    const visited = Array.from({ length: H }, () => Array(W).fill(false));
    const dirs8 = [
      {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1},
      {dx: 1, dy: 1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: -1, dy: -1}
    ];
    
    // Find connected components and their border touches
    for (let startY = 0; startY < H; startY++) {
      for (let startX = 0; startX < W; startX++) {
        if (grid[startY][startX] !== player || visited[startY][startX]) continue;
        
        // BFS to find component
        const queue = [{x: startX, y: startY}];
        visited[startY][startX] = true;
        
        let topMin = Infinity, topMax = -Infinity, topCount = 0;
        let bottomMin = Infinity, bottomMax = -Infinity, bottomCount = 0;
        let leftMin = Infinity, leftMax = -Infinity, leftCount = 0;
        let rightMin = Infinity, rightMax = -Infinity, rightCount = 0;
        
        while (queue.length > 0) {
          const {x, y} = queue.shift();
          
          // Check border touches
          if (y === 0) { topMin = Math.min(topMin, x); topMax = Math.max(topMax, x); topCount++; }
          if (y === H - 1) { bottomMin = Math.min(bottomMin, x); bottomMax = Math.max(bottomMax, x); bottomCount++; }
          if (x === 0) { leftMin = Math.min(leftMin, y); leftMax = Math.max(leftMax, y); leftCount++; }
          if (x === W - 1) { rightMin = Math.min(rightMin, y); rightMax = Math.max(rightMax, y); rightCount++; }
          
          // Explore neighbors
          for (const d of dirs8) {
            const nx = x + d.dx;
            const ny = y + d.dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            if (visited[ny][nx]) continue;
            if (grid[ny][nx] !== player) continue;
            visited[ny][nx] = true;
            queue.push({x: nx, y: ny});
          }
        }
        
        // Add П-closure walls (touches same side 2+ times)
        if (topCount >= 2) {
          for (let x = Math.max(0, topMin); x <= Math.min(W - 1, topMax); x++) {
            isWall[0][x + 1] = true;
          }
        }
        if (bottomCount >= 2) {
          for (let x = Math.max(0, bottomMin); x <= Math.min(W - 1, bottomMax); x++) {
            isWall[H + 1][x + 1] = true;
          }
        }
        if (leftCount >= 2) {
          for (let y = Math.max(0, leftMin); y <= Math.min(H - 1, leftMax); y++) {
            isWall[y + 1][0] = true;
          }
        }
        if (rightCount >= 2) {
          for (let y = Math.max(0, rightMin); y <= Math.min(H - 1, rightMax); y++) {
            isWall[y + 1][W + 1] = true;
          }
        }
        
        // Add corner closures (simplified - touches 2 adjacent sides)
        if (topCount >= 1 && leftCount >= 1) {
          for (let x = 0; x <= topMin; x++) isWall[0][x + 1] = true;
          for (let y = 0; y <= leftMin; y++) isWall[y + 1][0] = true;
        }
        if (topCount >= 1 && rightCount >= 1) {
          for (let x = topMax; x < W; x++) isWall[0][x + 1] = true;
          for (let y = 0; y <= rightMin; y++) isWall[y + 1][W + 1] = true;
        }
        if (bottomCount >= 1 && leftCount >= 1) {
          for (let x = 0; x <= bottomMin; x++) isWall[H + 1][x + 1] = true;
          for (let y = leftMax; y < H; y++) isWall[y + 1][0] = true;
        }
        if (bottomCount >= 1 && rightCount >= 1) {
          for (let x = bottomMax; x < W; x++) isWall[H + 1][x + 1] = true;
          for (let y = rightMax; y < H; y++) isWall[y + 1][W + 1] = true;
        }
      }
    }
    
    // Never block the BFS start
    isWall[0][0] = false;
  }
  
  /**
   * Helper to enqueue border cell for flood-fill
   * @private
   */
  _enqueueBorderCell(bx, by, expandedWidth, expandedHeight, visitedAir, isWall, queue) {
    if (bx < 0 || bx >= expandedWidth || by < 0 || by >= expandedHeight) return;
    if (visitedAir[by][bx]) return;
    if (isWall[by][bx]) return;
    visitedAir[by][bx] = true;
    queue.push({x: bx, y: by});
  }
  
  /**
   * Score based on risk assessment (PHASE 2 STEP 3)
   * Evaluates if a position is dangerous (surrounded by enemy, isolated, etc.)
   * Returns NEGATIVE score (penalty) for risky positions
   * 
   * @param {Object} move - Move to evaluate
   * @param {Object} gameState - Current game state
   * @returns {number} Negative score (penalty) for risk
   * @private
   */
  _scoreRisk(move, gameState) {
    const { x, y, width, height } = move;
    const { grid, currentPlayer, isKush } = gameState;
    const W = gameState.width;
    const H = gameState.height;
    const opponent = currentPlayer === 1 ? 2 : 1;
    
    let totalPenalty = 0;
    
    // 1. Check if surrounded by enemy (especially dangerous in KUSH)
    const surroundingPenalty = this._evaluateSurrounding(x, y, width, height, grid, opponent, W, H);
    totalPenalty += surroundingPenalty;
    
    // 2. Check isolation from own territory (only in KUSH)
    if (isKush) {
      const isolationPenalty = this._evaluateIsolation(x, y, width, height, grid, currentPlayer, W, H);
      totalPenalty += isolationPenalty;
    }
    
    // 3. Predict enemy can capture this next turn
    const captureThreatPenalty = this._evaluateCaptureThreat(x, y, width, height, grid, currentPlayer, opponent, W, H);
    totalPenalty += captureThreatPenalty;
    
    return totalPenalty;
  }
  
  /**
   * Score based on opportunity to lock down opponent's corner (PHASE 2 STEP 4)
   * This is a powerful early-game strategy:
   * - Block opponent in their starting corner
   * - Force them to skip turns while AI expands
   * - Most effective with KUSH moves
   * 
   * @param {Object} move - Move to evaluate
   * @param {Object} gameState - Current game state
   * @returns {number} Bonus score for lockdown potential
   * @private
   */
  _scoreLockdownOpportunity(move, gameState) {
    const { x, y, width, height } = move;
    const { grid, currentPlayer, isKush } = gameState;
    const W = gameState.width;
    const H = gameState.height;
    const opponent = currentPlayer === 1 ? 2 : 1;
    
    // Get turn number (fallback: estimate from filled cells)
    const turnNumber = gameState.turnNumber || this._estimateTurnNumber(grid, W, H);
    
    // Determine opponent's starting corner
    // P1 starts at (0,0), P2 starts at (W-1, H-1)
    const opponentCorner = opponent === 1 
      ? { x: 0, y: 0, quadrant: 'TL' }
      : { x: W - 1, y: H - 1, quadrant: 'BR' };
    
    // Only valuable in early game (first 15 turns)
    if (turnNumber > 15) {
      return 0;
    }
    
    // Check how much opponent has expanded from corner
    const opponentExpansion = this._measureOpponentExpansion(grid, opponent, opponentCorner, W, H);
    
    // If opponent has expanded far (>15 cells), lockdown is less effective
    if (opponentExpansion > 15) {
      return 0;
    }
    
    // Calculate how well this move blocks the opponent
    const blockingValue = this._calculateBlockingValue(
      x, y, width, height, 
      opponentCorner, 
      opponentExpansion,
      grid, opponent, W, H
    );
    
    // KUSH moves are especially good for blocking (can place anywhere)
    const kushMultiplier = isKush ? 2.0 : 1.0;
    
    // Early game multiplier (turns 1-5 are critical)
    const earlyGameMultiplier = turnNumber <= 5 ? 2.0 : 
                                 turnNumber <= 10 ? 1.5 : 1.0;
    
    const totalBonus = blockingValue * kushMultiplier * earlyGameMultiplier * this.weights.opponentLockdownBonus;
    
    // Debug log for significant lockdown opportunities
    if (totalBonus > 50) {
      console.log(`    LOCKDOWN (${x},${y}): blocking=${blockingValue.toFixed(2)}, kush=${kushMultiplier}x, early=${earlyGameMultiplier}x, BONUS=${totalBonus.toFixed(1)}`);
    }
    
    return totalBonus;
  }
  
  /**
   * Measure how far opponent has expanded from their corner
   * @private
   */
  _measureOpponentExpansion(grid, opponent, corner, W, H) {
    let count = 0;
    const searchRadius = 10; // Check 10x10 area around corner
    
    for (let dy = 0; dy < searchRadius && corner.y + dy < H; dy++) {
      for (let dx = 0; dx < searchRadius && corner.x + dx < W; dx++) {
        const checkX = corner.x + (corner.quadrant === 'BR' ? -dx : dx);
        const checkY = corner.y + (corner.quadrant === 'BR' ? -dy : dy);
        
        if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
          if (grid[checkY][checkX] === opponent) {
            count++;
          }
        }
      }
    }
    
    return count;
  }
  
  /**
   * Calculate how well this move blocks opponent's expansion
   * Returns value between 0.0 (no blocking) and 1.0 (perfect block)
   * @private
   */
  _calculateBlockingValue(x, y, width, height, opponentCorner, opponentSize, grid, opponent, W, H) {
    // Strategy depends on piece size:
    // - SMALL pieces (1x1, 1x2): Safe blocking far from corner (avoid trap)
    // - LARGE pieces (4x4+): AGGRESSIVE - attack corner directly to lock opponent!
    
    const moveEndX = x + width - 1;
    const moveEndY = y + height - 1;
    const moveArea = width * height;
    
    let blockingValue = 0;
    
    // AGGRESSIVE STRATEGY: Large pieces (16+ cells) should attack corner directly!
    // A 6×6 or 5×5 placed at opponent's corner locks them completely until KUSH
    if (moveArea >= 16) {
      console.log(`    🔥 LARGE PIECE (${width}×${height}=${moveArea}) - AGGRESSIVE MODE!`);
      
      // Check if this piece is IMMEDIATELY ADJACENT to opponent's territory
      let adjacentToOpponent = false;
      for (let dy = -1; dy <= height; dy++) {
        for (let dx = -1; dx <= width; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          
          // Skip cells inside the piece itself
          if (dx >= 0 && dx < width && dy >= 0 && dy < height) continue;
          
          // Check if this adjacent cell has opponent
          if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
            if (grid[checkY][checkX] === opponent) {
              adjacentToOpponent = true;
              break;
            }
          }
        }
        if (adjacentToOpponent) break;
      }
      
      // For large pieces, CLOSER = BETTER!
      if (opponentCorner.quadrant === 'TL') {
        const distFromCorner = Math.max(x, y);
        
        // IMMEDIATE BLOCKING: Adjacent to opponent = MAXIMUM VALUE!
        if (adjacentToOpponent) {
          blockingValue = 1.0;
          console.log(`    ⚔️ CORNER LOCKDOWN! Adjacent to opponent territory - BLOCKING EXPANSION!`);
        }
        // DIRECT CORNER ATTACK (0-3 cells from corner) = VERY HIGH!
        else if (distFromCorner <= 3) {
          blockingValue = 0.9;
          console.log(`    ⚔️ CORNER ATTACK! Distance=${distFromCorner} from corner`);
        }
        // Close attack (4-7 cells) = Still very good
        else if (distFromCorner <= 7) {
          blockingValue = 0.7;
          console.log(`    ⚔️ CLOSE ATTACK! Distance=${distFromCorner}`);
        }
        // Medium distance (8-10 cells) = Okay
        else if (distFromCorner <= 10) {
          blockingValue = 0.5;
        }
        
      } else {
        // Opponent in bottom-right
        const distFromCorner = Math.max(W - 1 - moveEndX, H - 1 - moveEndY);
        
        // IMMEDIATE BLOCKING: Adjacent to opponent = MAXIMUM VALUE!
        if (adjacentToOpponent) {
          blockingValue = 1.0;
          console.log(`    ⚔️ CORNER LOCKDOWN! Adjacent to opponent territory - BLOCKING EXPANSION!`);
        }
        else if (distFromCorner <= 3) {
          blockingValue = 0.9;
          console.log(`    ⚔️ CORNER ATTACK! Distance=${distFromCorner} from corner`);
        }
        else if (distFromCorner <= 7) {
          blockingValue = 0.7;
          console.log(`    ⚔️ CLOSE ATTACK! Distance=${distFromCorner}`);
        }
        else if (distFromCorner <= 10) {
          blockingValue = 0.5;
        }
      }
      
      return Math.min(blockingValue, 1.0);
    }
    
    // SAFE STRATEGY: Small pieces need to avoid traps
    const minSafeDistance = moveArea <= 2 ? 8 : moveArea <= 4 ? 6 : 3;
    const maxEffectiveDistance = moveArea <= 2 ? 14 : moveArea <= 4 ? 12 : 10;
    
    console.log(`    🛡️ SMALL PIECE (${width}×${height}=${moveArea}) - SAFE MODE (dist ${minSafeDistance}-${maxEffectiveDistance})`);
    
    if (opponentCorner.quadrant === 'TL') {
      const distFromCorner = Math.max(x, y);
      
      // TOO CLOSE = TRAP!
      if (distFromCorner < minSafeDistance && moveArea <= 2) {
        console.log(`    ⚠️ TOO CLOSE TO CORNER! Distance=${distFromCorner} (min safe=${minSafeDistance})`);
        return 0.0;
      }
      
      // OPTIMAL BLOCKING ZONE
      if (distFromCorner >= minSafeDistance && distFromCorner <= maxEffectiveDistance) {
        const optimalDist = (minSafeDistance + maxEffectiveDistance) / 2;
        const distFromOptimal = Math.abs(distFromCorner - optimalDist);
        const maxDeviation = (maxEffectiveDistance - minSafeDistance) / 2;
        blockingValue = 1.0 - (distFromOptimal / maxDeviation) * 0.3;
        console.log(`    ✅ OPTIMAL BLOCKING ZONE! Distance=${distFromCorner}, value=${blockingValue.toFixed(2)}`);
      }
      
      // Block horizontal expansion
      if (y <= 5 && x > opponentSize && x >= minSafeDistance && x < 15) {
        blockingValue += 0.3;
      }
      
      // Block vertical expansion
      if (x <= 5 && y > opponentSize && y >= minSafeDistance && y < 15) {
        blockingValue += 0.3;
      }
      
      // Diagonal block
      if (x >= minSafeDistance && y >= minSafeDistance && x < 15 && y < 15 && Math.abs(x - y) < 3) {
        blockingValue += 0.2;
      }
      
    } else {
      // Opponent is in bottom-right
      const distFromCorner = Math.max(W - 1 - moveEndX, H - 1 - moveEndY);
      
      // TOO CLOSE = TRAP!
      if (distFromCorner < minSafeDistance && moveArea <= 2) {
        console.log(`    ⚠️ TOO CLOSE TO CORNER! Distance=${distFromCorner} (min safe=${minSafeDistance})`);
        return 0.0;
      }
      
      // OPTIMAL BLOCKING ZONE
      if (distFromCorner >= minSafeDistance && distFromCorner <= maxEffectiveDistance) {
        const optimalDist = (minSafeDistance + maxEffectiveDistance) / 2;
        const distFromOptimal = Math.abs(distFromCorner - optimalDist);
        const maxDeviation = (maxEffectiveDistance - minSafeDistance) / 2;
        blockingValue = 1.0 - (distFromOptimal / maxDeviation) * 0.3;
        console.log(`    ✅ OPTIMAL BLOCKING ZONE! Distance=${distFromCorner}, value=${blockingValue.toFixed(2)}`);
      }
      
      // Block horizontal expansion
      if (y >= H - 6 && moveEndX < W - opponentSize - 1 && moveEndX <= W - minSafeDistance - 1 && moveEndX > W - 16) {
        blockingValue += 0.3;
      }
      
      // Block vertical expansion
      if (moveEndX >= W - 6 && moveEndY < H - opponentSize - 1 && moveEndY <= H - minSafeDistance - 1 && moveEndY > H - 16) {
        blockingValue += 0.3;
      }
      
      // Diagonal block
      const distFromBR = (W - 1 - moveEndX) + (H - 1 - moveEndY);
      if (distFromBR >= minSafeDistance * 2 && distFromBR < 30 && Math.abs((W - 1 - moveEndX) - (H - 1 - moveEndY)) < 3) {
        blockingValue += 0.2;
      }
    }
    
    // Check if inside opponent territory (dangerous for small pieces)
    const insideOpponentTerritory = this._isInsideOpponentTerritory(x, y, width, height, grid, opponent, W, H);
    if (insideOpponentTerritory && moveArea <= 2) {
      console.log(`    🚨 INSIDE OPPONENT TERRITORY! Applying heavy penalty`);
      blockingValue *= 0.1;
    }
    
    return Math.min(blockingValue, 1.0);
  }
  
  /**
   * Check if placing this move would completely seal opponent in their corner
   * @private
   */
  _checksIfOpponentSealed(x, y, width, height, opponentCorner, grid, opponent, W, H) {
    // This is a simplified check - in practice, full sealing is complex
    // We check if the move creates a barrier close to opponent's territory
    
    // Create temporary grid with the move placed
    const tempGrid = grid.map(row => [...row]);
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const cellX = x + dx;
        const cellY = y + dy;
        if (cellX >= 0 && cellX < W && cellY >= 0 && cellY < H) {
          tempGrid[cellY][cellX] = -1; // Mark as barrier
        }
      }
    }
    
    // Check if opponent has any valid expansion routes
    // (This is expensive, so we do a quick heuristic check)
    
    const expansionRoutes = this._countExpansionRoutes(tempGrid, opponent, opponentCorner, W, H);
    
    // If opponent has very few expansion routes (≤2), they're getting sealed
    return expansionRoutes <= 2;
  }
  
  /**
   * Count how many free expansion routes opponent has from their corner
   * @private
   */
  _countExpansionRoutes(grid, opponent, corner, W, H) {
    // Check 8 directions from opponent's territory
    let routes = 0;
    const searchRadius = 8;
    
    // Find the edge of opponent's territory
    const edges = this._findTerritoryEdges(grid, opponent, corner, W, H);
    
    // For each edge cell, check if there's free space to expand
    for (const edge of edges) {
      const dirs = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
        {dx: 0, dy: 1}, {dx: 0, dy: -1},
        {dx: 1, dy: 1}, {dx: 1, dy: -1},
        {dx: -1, dy: 1}, {dx: -1, dy: -1}
      ];
      
      for (const dir of dirs) {
        let hasRoute = true;
        for (let i = 1; i <= 3; i++) {
          const checkX = edge.x + dir.dx * i;
          const checkY = edge.y + dir.dy * i;
          
          if (checkX < 0 || checkX >= W || checkY < 0 || checkY >= H) {
            hasRoute = false;
            break;
          }
          
          if (grid[checkY][checkX] !== 0) {
            hasRoute = false;
            break;
          }
        }
        
        if (hasRoute) {
          routes++;
        }
      }
    }
    
    return routes;
  }
  
  /**
   * Find edge cells of opponent's territory
   * @private
   */
  _findTerritoryEdges(grid, opponent, corner, W, H) {
    const edges = [];
    const searchRadius = 10;
    
    for (let dy = 0; dy < searchRadius; dy++) {
      for (let dx = 0; dx < searchRadius; dx++) {
        const checkX = corner.x + (corner.quadrant === 'BR' ? -dx : dx);
        const checkY = corner.y + (corner.quadrant === 'BR' ? -dy : dy);
        
        if (checkX < 0 || checkX >= W || checkY < 0 || checkY >= H) continue;
        
        if (grid[checkY][checkX] === opponent) {
          // Check if this is an edge cell (has at least one empty neighbor)
          const hasEmptyNeighbor = this._hasEmptyNeighbor(grid, checkX, checkY, W, H);
          if (hasEmptyNeighbor) {
            edges.push({x: checkX, y: checkY});
          }
        }
      }
    }
    
    return edges;
  }
  
  /**
   * Check if cell has at least one empty neighbor
   * @private
   */
  _hasEmptyNeighbor(grid, x, y, W, H) {
    const dirs = [{dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}];
    
    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        if (grid[ny][nx] === 0) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if move would be placed inside opponent's territory
   * Being inside enemy territory is dangerous for small pieces - they get trapped!
   * @private
   */
  _isInsideOpponentTerritory(x, y, width, height, grid, opponent, W, H) {
    // Count how many cells around the move belong to opponent
    let opponentCells = 0;
    let totalChecked = 0;
    
    // Check a 2-cell perimeter around the move
    for (let dy = -2; dy < height + 2; dy++) {
      for (let dx = -2; dx < width + 2; dx++) {
        // Skip cells inside the rectangle
        if (dx >= 0 && dx < width && dy >= 0 && dy < height) continue;
        
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
          totalChecked++;
          if (grid[checkY][checkX] === opponent) {
            opponentCells++;
          }
        }
      }
    }
    
    if (totalChecked === 0) return false;
    
    // If >60% of surrounding is opponent territory, we're inside it
    const opponentRatio = opponentCells / totalChecked;
    return opponentRatio > 0.6;
  }
  
  /**
   * Estimate current turn number based on filled cells
   * @private
   */
  _estimateTurnNumber(grid, W, H) {
    let filledCells = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (grid[y][x] !== 0) {
          filledCells++;
        }
      }
    }
    
    // Rough estimate: average ~10 cells per turn
    return Math.floor(filledCells / 10) + 1;
  }
  
  /**
   * Evaluate how much the move is surrounded by enemy cells
   * More enemy cells around = higher penalty
   * 
   * @private
   */
  _evaluateSurrounding(x, y, width, height, grid, opponent, W, H) {
    let enemyCells = 0;
    let totalChecked = 0;
    
    // Check perimeter around the rectangle (1 cell margin)
    for (let dy = -1; dy <= height; dy++) {
      for (let dx = -1; dx <= width; dx++) {
        // Skip cells inside the rectangle
        if (dx >= 0 && dx < width && dy >= 0 && dy < height) continue;
        
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
          totalChecked++;
          if (grid[checkY][checkX] === opponent) {
            enemyCells++;
          }
        }
      }
    }
    
    if (totalChecked === 0) return 0;
    
    // Calculate percentage of surrounding that is enemy
    const enemyRatio = enemyCells / totalChecked;
    
    // Heavy penalty if >70% surrounded by enemy
    // This prevents placing in "dead corners"
    if (enemyRatio > 0.7) {
      return -200;  // SEVERE penalty
    } else if (enemyRatio > 0.5) {
      return -100;  // Heavy penalty
    } else if (enemyRatio > 0.3) {
      return -30;   // Moderate penalty
    }
    
    return 0;
  }
  
  /**
   * Evaluate if the move is isolated from own territory
   * Isolated pieces in KUSH are vulnerable
   * 
   * @private
   */
  _evaluateIsolation(x, y, width, height, grid, currentPlayer, W, H) {
    // Check if this move connects to own territory
    // Using BFS to find if there's a path to existing territory
    
    // Quick check: is there any own territory adjacent?
    const hasAdjacentOwn = this._hasAdjacentCells(x, y, width, height, grid, currentPlayer, W, H);
    if (hasAdjacentOwn) {
      return 0;  // Not isolated - connected to own territory
    }
    
    // Check distance to nearest own territory
    const distance = this._distanceToOwnTerritory(x, y, width, height, grid, currentPlayer, W, H);
    
    if (distance > 10) {
      return -150;  // Very isolated - severe penalty
    } else if (distance > 5) {
      return -80;   // Moderately isolated
    } else if (distance > 2) {
      return -30;   // Slightly isolated
    }
    
    return 0;
  }
  
  /**
   * Evaluate if opponent can easily capture this move via contour
   * 
   * @private
   */
  _evaluateCaptureThreat(x, y, width, height, grid, currentPlayer, opponent, W, H) {
    // Simulate: what if we place here, can opponent complete a contour around us?
    // This is expensive, so we do a simplified check
    
    // Check if opponent has pieces that could form a П-shape or corner closure
    const threatLevel = this._assessContourThreat(x, y, width, height, grid, opponent, W, H);
    
    if (threatLevel === 'immediate') {
      return -300;  // Can be captured immediately next turn
    } else if (threatLevel === 'high') {
      return -100;  // High risk of capture
    } else if (threatLevel === 'medium') {
      return -40;   // Some risk
    }
    
    return 0;
  }
  
  /**
   * Check if move has adjacent cells of given player
   * @private
   */
  _hasAdjacentCells(x, y, width, height, grid, player, W, H) {
    // Check all 4 sides
    // Top
    if (y > 0) {
      for (let dx = 0; dx < width; dx++) {
        if (grid[y - 1][x + dx] === player) return true;
      }
    }
    // Bottom
    if (y + height < H) {
      for (let dx = 0; dx < width; dx++) {
        if (grid[y + height][x + dx] === player) return true;
      }
    }
    // Left
    if (x > 0) {
      for (let dy = 0; dy < height; dy++) {
        if (grid[y + dy][x - 1] === player) return true;
      }
    }
    // Right
    if (x + width < W) {
      for (let dy = 0; dy < height; dy++) {
        if (grid[y + dy][x + width] === player) return true;
      }
    }
    return false;
  }
  
  /**
   * Calculate approximate distance to nearest own territory
   * @private
   */
  _distanceToOwnTerritory(x, y, width, height, grid, player, W, H) {
    const centerX = x + Math.floor(width / 2);
    const centerY = y + Math.floor(height / 2);
    
    let minDistance = Infinity;
    
    // Sample grid to find nearest own cell (don't check every cell - too slow)
    for (let gy = 0; gy < H; gy += 3) {  // Sample every 3rd row
      for (let gx = 0; gx < W; gx += 3) {  // Sample every 3rd column
        if (grid[gy][gx] === player) {
          const dist = Math.abs(gx - centerX) + Math.abs(gy - centerY);  // Manhattan distance
          minDistance = Math.min(minDistance, dist);
        }
      }
    }
    
    return minDistance;
  }
  
  /**
   * Assess threat level of opponent forming contour around this position
   * @private
   */
  _assessContourThreat(x, y, width, height, grid, opponent, W, H) {
    // Check if opponent has strong presence around this area
    let opponentNearby = 0;
    let borderTouches = 0;
    
    // Check larger area around move (3 cell radius)
    const checkRadius = 3;
    for (let dy = -checkRadius; dy < height + checkRadius; dy++) {
      for (let dx = -checkRadius; dx < width + checkRadius; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (checkX >= 0 && checkX < W && checkY >= 0 && checkY < H) {
          if (grid[checkY][checkX] === opponent) {
            opponentNearby++;
          }
        }
      }
    }
    
    // Check border touches (for corner/П closures)
    if (x < 3) borderTouches++;
    if (y < 3) borderTouches++;
    if (x + width > W - 3) borderTouches++;
    if (y + height > H - 3) borderTouches++;
    
    // High threat if lots of opponent nearby AND near borders
    if (opponentNearby > 30 && borderTouches >= 2) {
      return 'immediate';
    } else if (opponentNearby > 20 && borderTouches >= 1) {
      return 'high';
    } else if (opponentNearby > 10) {
      return 'medium';
    }
    
    return 'low';
  }
  
  // ====================================================================
  // HELPER METHODS
  // ====================================================================
  
  /**
   * Check if rectangle touches a specific point
   * 
   * @param {number} rx - Rectangle x
   * @param {number} ry - Rectangle y
   * @param {number} rw - Rectangle width
   * @param {number} rh - Rectangle height
   * @param {number} px - Point x
   * @param {number} py - Point y
   * @returns {boolean} True if rectangle touches point
   * @private
   */
  _rectangleTouchesPoint(rx, ry, rw, rh, px, py) {
    return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
  }
  
  /**
   * Check if there are player cells in a rectangular range
   * 
   * @param {Array} grid - Game grid
   * @param {number} x - Start x
   * @param {number} y - Start y
   * @param {number} w - Width
   * @param {number} h - Height
   * @param {number} player - Player ID
   * @returns {boolean} True if at least one player cell found
   * @private
   */
  _hasPlayerCellsInRange(grid, x, y, w, h, player) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const checkY = y + dy;
        const checkX = x + dx;
        if (checkY >= 0 && checkY < grid.length && 
            checkX >= 0 && checkX < grid[0].length &&
            grid[checkY][checkX] === player) {
          return true;
        }
      }
    }
    return false;
  }
  
  // ====================================================================
  // EASY AI: RANDOM SELECTION
  // ====================================================================
  
  /**
   * Choose a random move from possible moves (Easy AI strategy)
   * 
   * @param {Array} possibleMoves - Array of possible moves
   * @returns {Object} Chosen move {x, y, orientation}
   * @private
   */
  _chooseRandomMove(possibleMoves) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    const move = possibleMoves[randomIndex];
    move.score = 0; // Random move has no score
    return move;
  }
  
  // ====================================================================
  // VALIDATION (FALLBACK - GAME'S VALIDATION IS PREFERRED)
  // ====================================================================
  
  /**
   * Check if a placement is valid
   * 
   * @param {Array} grid - Game grid
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {number} player - Current player ID
   * @param {boolean} isKush - Is KUSH mode active
   * @param {number} gridWidth - Grid width
   * @param {number} gridHeight - Grid height
   * @returns {boolean} True if placement is valid
   * @private
   */
  _isValidPlacement(grid, x, y, width, height, player, isKush, gridWidth, gridHeight) {
    // Check boundaries
    if (x < 0 || y < 0 || x + width > gridWidth || y + height > gridHeight) {
      return false;
    }
    
    // KUSH mode: can place on empty or opponent cells, but NOT on own territory
    if (isKush) {
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          const cellX = x + dx;
          const cellY = y + dy;
          // Cannot overwrite own cells
          if (grid[cellY][cellX] === player) {
            return false;
          }
        }
      }
      return true; // Valid if no cells belong to current player
    }
    
    // Normal mode: must touch own territory (8-neighborhood)
    let touchesOwnTerritory = false;
    
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const cellX = x + dx;
        const cellY = y + dy;
        
        // Check 8 neighbors
        for (let ny = -1; ny <= 1; ny++) {
          for (let nx = -1; nx <= 1; nx++) {
            if (nx === 0 && ny === 0) continue; // Skip center
            
            const checkX = cellX + nx;
            const checkY = cellY + ny;
            
            // Check bounds
            if (checkX < 0 || checkX >= gridWidth || checkY < 0 || checkY >= gridHeight) {
              continue;
            }
            
            // Check if neighbor is part of rectangle being placed
            const isDx = checkX >= x && checkX < x + width;
            const isDy = checkY >= y && checkY < y + height;
            if (isDx && isDy) continue;
            
            // Check if neighbor belongs to current player
            if (grid[checkY][checkX] === player) {
              touchesOwnTerritory = true;
              break;
            }
          }
          if (touchesOwnTerritory) break;
        }
        if (touchesOwnTerritory) break;
      }
      if (touchesOwnTerritory) break;
    }
    
    return touchesOwnTerritory;
  }
  
  /**
   * Utility: Delay execution
   * 
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ====================================================================
// GAME API INTERFACE
// ====================================================================

/**
 * Game API Builder
 * Creates an API object that allows AI to interact with the game
 * This acts as an adapter between AI module and game code
 * 
 * @param {Object} Game - Game state object
 * @param {Object} gameFunctions - Object containing game functions
 * @returns {Object} Game API
 */
function createGameAPI(Game, gameFunctions) {
  return {
    /**
     * Check if dice have been rolled
     */
    isDiceRolled() {
      return Game.diceRolled;
    },
    
    /**
     * Get current game state (snapshot for AI decision making)
     */
    getGameState() {
      return {
        grid: Game.grid.map(row => [...row]), // Deep copy
        width: Game.width,
        height: Game.height,
        diceValues: [...Game.diceValues],
        isKush: Game.isKush,
        currentPlayer: Game.currentPlayer,
        rectangleOrientation: Game.rectangleOrientation,
        turnNumber: Game.moveHistory.length + 1,  // Current turn number
        // Provide game's validation function for accurate checking
        validationFn: (x, y, width, height) => {
          // Temporarily set rectangle dimensions for validation
          const savedOrientation = Game.rectangleOrientation;
          
          // Determine needed orientation based on dimensions
          // diceValues[0] x diceValues[1] = orientation 0
          // diceValues[1] x diceValues[0] = orientation 1
          const dim0 = { width: Game.diceValues[0], height: Game.diceValues[1] };
          const dim1 = { width: Game.diceValues[1], height: Game.diceValues[0] };
          
          let neededOrientation;
          if (width === dim0.width && height === dim0.height) {
            neededOrientation = 0;
          } else if (width === dim1.width && height === dim1.height) {
            neededOrientation = 1;
          } else {
            // Invalid dimensions
            Game.rectangleOrientation = savedOrientation;
            return false;
          }
          
          // Set orientation for validation
          Game.rectangleOrientation = neededOrientation;
          
          // Check validity using game's function
          const result = gameFunctions.canPlaceRectangle(x, y);
          
          // Restore state
          Game.rectangleOrientation = savedOrientation;
          
          return result;
        }
      };
    },
    
    /**
     * Roll dice
     */
    async rollDice() {
      return new Promise((resolve) => {
        // CRITICAL: Reset diceRolled so AI can roll new dice
        if (Game) {
          Game.diceRolled = false;
        }
        gameFunctions.rollDice();
        // Wait for dice roll animation to complete
        setTimeout(resolve, 1000);
      });
    },
    
    /**
     * Place piece at position
     */
    async placePiece(x, y, orientation) {
      return new Promise((resolve) => {
        // Set orientation
        if (Game.rectangleOrientation !== orientation) {
          gameFunctions.rotateRectangle();
        }
        
        // Set position
        Game.rectanglePosition = { x, y };
        Game.isValidPlacement = true;
        
        // Place
        gameFunctions.placeRectangle();
        
        setTimeout(resolve, 100);
      });
    },
    
    /**
     * Skip turn
     */
    async skipTurn() {
      return new Promise((resolve) => {
        gameFunctions.skipTurn();
        setTimeout(resolve, 100);
      });
    }
  };
}

// ====================================================================
// EXPORTS
// ====================================================================

// For ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIPlayer, createGameAPI };
}

// For browser (global scope)
if (typeof window !== 'undefined') {
  window.AIPlayer = AIPlayer;
  window.createGameAPI = createGameAPI;
}
