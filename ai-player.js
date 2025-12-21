/**
 * AI Player Module for Dices-n-Spaces
 * 
 * This module provides AI functionality that can be integrated into the game.
 * The AI makes decisions based on the current game state.
 * 
 * @module AIPlayer
 * @version 1.0.0
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
      
      // Step 1: Roll dice (if not already rolled)
      if (!gameAPI.isDiceRolled()) {
        console.log('AI: Rolling dice...');
        await gameAPI.rollDice();
        await this._delay(this.options.moveDelay);
      } else {
        console.log('AI: Dice already rolled');
      }
      
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
      console.log(`AI: Placing at (${placement.x}, ${placement.y}), orientation=${placement.orientation}`);
      await gameAPI.placePiece(placement.x, placement.y, placement.orientation);
      
      console.log('AI: Turn completed successfully');
      return { 
        action: 'place', 
        x: placement.x, 
        y: placement.y, 
        orientation: placement.orientation 
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
   * @returns {Object|null} Placement {x, y, orientation} or null if no valid move
   */
  choosePlacement(gameState) {
    const { grid, width, height, diceValues, isKush, currentPlayer } = gameState;
    
    // Generate all possible placements
    const possibleMoves = this._generatePossibleMoves(gameState);
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    // Easy AI: Choose random valid placement
    return this._chooseRandomMove(possibleMoves);
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
            if (validationFn) {
              isValid = validationFn(x, y, dim.width, dim.height);
            } else {
              isValid = this._isValidPlacement(grid, x, y, dim.width, dim.height, currentPlayer, isKush, width, height);
            }
            
            if (isValid) {
              possibleMoves.push({
                x: x,
                y: y,
                orientation: orientation,
                score: 0 // For future: score can be used for better AI strategies
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
    
    // KUSH mode: can place anywhere
    if (isKush) {
      return true;
    }
    
    // Normal mode: must touch own territory (8-neighborhood)
    let touchesOwnTerritory = false;
    
    // Find player's territory on grid first (for debugging)
    let playerCells = [];
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        if (grid[gy][gx] === player) {
          playerCells.push(`(${gx},${gy})`);
        }
      }
    }
    
    console.log(`AI Validation: Checking placement at (${x},${y}) ${width}x${height} for player ${player}`);
    console.log(`AI Validation: Player ${player} owns ${playerCells.length} cells:`, playerCells.slice(0, 10).join(', '));
    
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
              console.log(`AI Validation: ✓ Found adjacent cell at (${checkX},${checkY})`);
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
    
    if (!touchesOwnTerritory) {
      console.log(`AI Validation: ✗ No adjacent territory found!`);
    }
    
    return touchesOwnTerritory;
  }
  
  /**
   * Choose a random move from possible moves (Easy AI strategy)
   * 
   * @param {Array} possibleMoves - Array of possible moves
   * @returns {Object} Chosen move {x, y, orientation}
   * @private
   */
  _chooseRandomMove(possibleMoves) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
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
