# 🚀 Quick Start Installation

## 📦 Production Package v1.0.0

### What You Have

```
production-v1.0.0/
├── index.html          # Main game file
├── app.js              # Game engine (with TestMode)
├── ai-player-v3.js     # AI player (Easy + Medium)
├── styles.css          # UI styling
├── README.md           # Full documentation
├── TEST-SCENARIOS.js   # Test examples & guide
└── INSTALL.md          # This file
```

---

## 🎯 Installation Options

### Option 1: Direct Browser (Simplest)
```bash
# Just double-click index.html
# OR right-click → Open with → Chrome/Firefox/Edge
```

**Pros:** Instant, no setup  
**Cons:** Some features may have CORS restrictions

---

### Option 2: Python Web Server (Recommended)
```bash
# Navigate to production folder
cd production-v1.0.0

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Open browser: http://localhost:8000
```

**Pros:** Full functionality, no CORS issues  
**Cons:** Requires Python installed

---

### Option 3: Node.js Server
```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to production folder
cd production-v1.0.0

# Start server
http-server -p 8000

# Open browser: http://localhost:8000
```

**Pros:** Fast, professional  
**Cons:** Requires Node.js

---

### Option 4: PHP Server
```bash
# Navigate to production folder
cd production-v1.0.0

# Start PHP server
php -S localhost:8000

# Open browser: http://localhost:8000
```

---

### Option 5: Production Web Server

#### Apache
```apache
# Copy files to web directory
cp -r production-v1.0.0/* /var/www/html/dices-n-spaces/

# Open: http://your-domain.com/dices-n-spaces/
```

#### Nginx
```nginx
# Copy files
cp -r production-v1.0.0/* /usr/share/nginx/html/dices-n-spaces/

# Configure nginx
location /dices-n-spaces {
    root /usr/share/nginx/html;
    index index.html;
}

# Open: http://your-domain.com/dices-n-spaces/
```

---

## ✅ Verify Installation

After opening in browser:

1. **See Game Board** ✓
2. **Click "New Game"** → Game starts
3. **Click "Roll Dice"** → Dice appear
4. **Click "Enable AI"** → AI button changes to "Disable AI"
5. **Press F12** → Console opens (no errors)
6. **Type:** `TestMode` → Shows object with methods

If all checks pass: ✅ **Installation Successful!**

---

## 🧪 Test the Installation

### Quick Functionality Test
```javascript
// Open console (F12) and run:

// 1. Test mode exists?
console.log(TestMode);  
// Should show: { enabled: false, sequence: [], ... }

// 2. Add test dice
TestMode.clear();
TestMode.addDice(3, 3);
TestMode.addDice(1, 2);

// 3. Enable test mode
TestMode.enabled = true;

// 4. Start new game
// AI should capture opponent's corner with KUSH!
```

### Expected Result:
- Player 1 gets 1×2, places at corner
- AI gets 3×3 KUSH
- **AI places at (0,0), captures Player 1's piece**
- Console shows: `🔒 GUARANTEED CORNER LOCKDOWN at (0,0)!`
- Score: Player 1 = 0, Player 2 = 9

If this works: ✅ **Everything is working!**

---

## 🐛 Troubleshooting

### Problem: Game doesn't load
**Solution:** 
- Check all 4 files are in same folder
- Try different browser (Chrome/Firefox recommended)
- Check console (F12) for errors

### Problem: AI doesn't move
**Solution:**
- Click "Enable AI" button first
- Verify AI Player is set to "Player 2"
- Check console for errors

### Problem: Test mode doesn't work
**Solution:**
- Type `TestMode.enabled = true` in console
- Must start NEW game after enabling
- Clear sequence: `TestMode.clear()`

### Problem: Canvas is blank
**Solution:**
- Browser must support HTML5 Canvas
- Update browser to latest version
- Try different browser

### Problem: CORS errors (file://)
**Solution:**
- Use local web server (Python/Node/PHP)
- Don't use file:// protocol for production

---

## 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| IE      | Any     | ❌ Not Supported |

---

## 🎮 First Game Guide

1. **Click "New Game"**
2. **Click "Roll Dice"** → You get 2 dice
3. **Click on grid** to place your rectangle
4. **Press Space** to rotate (if needed)
5. **Click "Skip Turn"** if no valid moves
6. **Enable AI** to play against computer!

---

## 🧪 Test Mode Quick Reference

```javascript
// Basic usage
TestMode.addDice(3, 3);      // Add KUSH
TestMode.enabled = true;     // Enable
TestMode.clear();            // Clear all
TestMode.enabled = false;    // Disable

// Example test
TestMode.clear();
TestMode.addDice(1, 2);      // Player 1
TestMode.addDice(3, 3);      // AI gets KUSH
TestMode.enabled = true;
// Start new game!
```

See `TEST-SCENARIOS.js` for detailed examples.

---

## 📖 Documentation

- **README.md** → Full game documentation
- **TEST-SCENARIOS.js** → Test examples & debugging guide
- **Console (F12)** → Live AI decision-making logs

---

## ⚙️ Configuration

### Settings Menu
Click ⚙️ icon in top-right to configure:
- Grid size (10×10 to 120×120)
- Player names
- Starting corner position

### AI Settings
- **Difficulty:** Easy / Medium
- **AI Player:** Player 1 / Player 2
- Easy = Random valid moves
- Medium = Strategic AI with lockdown

---

## 🎯 Next Steps

1. ✅ **Play a few games** to learn mechanics
2. ✅ **Enable AI** to test against computer
3. ✅ **Try test mode** (F12 console)
4. ✅ **Read README.md** for full documentation
5. ✅ **Explore TEST-SCENARIOS.js** for advanced testing

---

## 💡 Pro Tips

- **KUSH is powerful** → Roll doubles to place anywhere!
- **AI is aggressive** → It will block your corner
- **Test mode is useful** → Debug AI behavior easily
- **Medium AI is smart** → Especially with first-move KUSH
- **Grid size matters** → 50×50 is balanced, 100×100 is epic

---

## 🆘 Need Help?

1. Check console (F12) for error messages
2. Read README.md for detailed documentation
3. Try TEST-SCENARIOS.js examples
4. Verify all 4 files are present
5. Use a local web server if issues persist

---

## ✨ You're Ready!

Installation complete! Start playing and enjoy! 🎲🤖

**Good luck, and may the dice be in your favor!** 🍀
