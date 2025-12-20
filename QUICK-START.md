# Quick Start Guide - Dices-n-Spaces with AI

## 🚀 Ready to Test in 30 Seconds!

This archive contains a **fully integrated** version of Dices-n-Spaces with AI player.

---

## 📦 What's Inside

- `index.html` - Game interface with AI controls
- `styles.css` - Styles including AI UI
- `app.js` - Main game code with AI integration
- `ai-player.js` - AI module (Easy difficulty)

---

## ▶️ How to Run

### Option 1: Double-Click (Simplest)

1. **Extract** the zip file
2. **Double-click** `index.html`
3. Opens in your default browser
4. **Done!** ✅

### Option 2: Use Any Browser

1. **Extract** the zip file
2. **Right-click** `index.html`
3. **Open with** → Chrome/Firefox/Edge
4. **Done!** ✅

---

## 🎮 How to Play with AI

### Step 1: Start a Game

1. Click **"New Game"** button (top right)
2. Game board appears with two starting positions

### Step 2: Enable AI

1. Look at **left panel**
2. Find **"🤖 AI Player"** section
3. Click **"Enable AI"** button
4. Button turns **pink** and says "Disable AI"

### Step 3: Play!

1. **You** play as Player 1 (Red)
2. **AI** plays as Player 2 (Blue)
3. Roll dice and place your piece
4. **AI automatically** takes its turn
5. Watch the magic! ✨

---

## 🎯 What You'll See

When AI is active:

```
Console Output:
✅ AI enabled: easy difficulty, Player 2
✅ AI turn detected
✅ AI: Rolling dice...
✅ AI: Found 847 possible moves
✅ AI: Placing at (23, 15)
✅ AI move completed
```

Visual feedback:
- 🔴 Your turn: You control
- 🔵 AI turn: Board updates automatically
- Status shows: "AI (Player 2) is thinking..."

---

## ⚙️ AI Options

**Difficulty:**
- ✅ Easy (available now)
- 🔒 Medium (coming soon)
- 🔒 Hard (coming soon)

**AI Player:**
- Player 1 (AI plays first)
- Player 2 (You play first) ← Default

---

## ✅ Testing Checklist

Try these to verify AI works:

- [ ] Enable AI → Button turns pink
- [ ] Start game → AI plays as Player 2
- [ ] Watch AI roll dice automatically
- [ ] Watch AI place pieces
- [ ] Disable AI → Button turns purple
- [ ] Change "AI Player" to Player 1
- [ ] Enable AI → AI plays first turn
- [ ] Play until KUSH (doubles)
- [ ] Watch AI handle KUSH mode

---

## 🐛 Troubleshooting

### Problem: AI doesn't appear

**Check:**
- All 4 files extracted from zip
- Files in same folder
- Opened `index.html` (not other files)

### Problem: AI doesn't move

**Check console (F12):**
```javascript
// Should see:
AI enabled: easy difficulty, Player 2
AI turn detected
```

**If not, check:**
- Button actually says "Disable AI" (pink)
- It's AI's turn (Player 2 by default)
- Game not in replay mode

### Problem: "AIPlayer is not defined"

**Solution:**
- Make sure `ai-player.js` is in same folder
- Refresh page (Ctrl+R)

---

## 📊 Expected Behavior

### Normal Game Flow

1. You roll dice → place piece
2. **AI automatically:**
   - Waits ~400ms (thinking)
   - Rolls dice (animation plays)
   - Waits ~800ms
   - Places piece (appears on board)
3. Back to your turn

### KUSH Mode

When doubles are rolled:
- 👑 "KUSH MODE" appears
- Preview pulses with player color
- AI can place **anywhere** on board
- AI finds **many more** possible moves

---

## 🎮 Advanced Testing

### Test AI as Player 1

1. Disable AI (if enabled)
2. Change dropdown to "Player 1"
3. Enable AI
4. Click "New Game"
5. **AI plays first move immediately**

### Test Mid-Game Toggle

1. Play a few turns with AI
2. Click "Disable AI"
3. Continue playing manually
4. Click "Enable AI" again
5. AI resumes on its turn

### Test with Replay

1. Play full game with AI
2. Use history slider
3. Click "Live" to return
4. AI continues playing correctly

---

## 🎉 Success!

If you see:
- ✅ AI section in left panel
- ✅ AI makes moves automatically
- ✅ Console shows AI logs
- ✅ Game plays smoothly

**Congratulations!** AI is working perfectly! 🎊

---

## 📝 What's Next?

### Current: Easy AI
- Random selection from valid moves
- ~5000 positions evaluated per turn
- <50ms decision time
- Perfect rule compliance

### Future: Medium AI (Planned)
- Territory evaluation
- Opponent blocking
- Strategic positioning

### Future: Hard AI (Planned)
- Contour capture strategy
- Multi-move planning
- Monte Carlo tree search
- Endgame optimization

---

## 💬 Notes

- **No server needed** - runs entirely in browser
- **No installation** - just open HTML file
- **Works offline** - all files local
- **Modern browsers** - Chrome, Firefox, Edge, Safari

---

## 📞 Need Help?

**Console is your friend:**
1. Press F12 (or Cmd+Option+I on Mac)
2. Click "Console" tab
3. Look for AI messages
4. Check for errors (red text)

**Common commands to test:**
```javascript
// Check AI state
console.log('AI enabled:', AIState.enabled);
console.log('AI player:', AIState.playerId);

// Manually trigger AI
checkAITurn();

// Check game state
console.log('Current player:', Game.currentPlayer);
console.log('Game over:', Game.gameOver);
```

---

## 🎯 Enjoy!

Have fun playing against the AI! 

Report any bugs or suggestions for improvement.

**Happy gaming!** 🎮🤖
