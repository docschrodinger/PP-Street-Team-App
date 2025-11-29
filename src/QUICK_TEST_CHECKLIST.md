# ⚡ QUICK TEST CHECKLIST (5 MINUTES)

## Speed Run - Test These FIRST

Use this for a quick sanity check before deep testing.

---

## ✅ THE ESSENTIALS

### **1. NO PLACEHOLDERS** (2 min)
Open each screen and verify NO placeholder data:

- [ ] Dashboard → Streak shows real number (not "3")
- [ ] Dashboard → Live venues shows number (not "--")  
- [ ] Dashboard → Mission progress shows real % (not "40%")
- [ ] Profile → All 6 stats show real numbers
- [ ] Leaderboard → Streaks show real numbers (not "0")
- [ ] Earnings → Monthly $ is calculated (not "$0")

**If ANY show placeholders → BUG, report it**

---

### **2. ANIMATIONS WORK** (1 min)
Check these key animations:

- [ ] Dashboard → Progress bars animate left-to-right
- [ ] Missions → Sparkles float on claimable missions
- [ ] Leaderboard → Gold podium shines/rotates
- [ ] Active Run → Timer counts up every second
- [ ] Add Lead → Heat score bar animates

**If choppy or broken → PERFORMANCE ISSUE**

---

### **3. CRITICAL PATH** (2 min)
Walk through the main user journey:

1. [ ] Login with test@patronpass.com / test123
2. [ ] Dashboard loads with real data
3. [ ] Click "Start Run" → Timer starts
4. [ ] Click "Add Lead" → Form opens
5. [ ] Fill Step 1 (venue name, address, type) → Continue works
6. [ ] Skip Step 2 → Continue works
7. [ ] Fill Step 3 → Submit works
8. [ ] See success toast with "+25 XP"
9. [ ] Lead appears in Active Run list
10. [ ] End run → XP awarded

**If ANY step fails → CRITICAL BUG**

---

## 🎯 EXPECTED vs ACTUAL

### **Dashboard:**
- **Expected:** Real numbers everywhere, smooth animations
- **Check:** Streak, Live venues, XP progress

### **Missions:**
- **Expected:** Claimable missions glow gold with sparkles
- **Check:** Click "Claim Reward" works

### **Rank System:**
- **Expected:** Visual ladder, past ranks green, future gray
- **Check:** Black Key has gold border

### **Earnings:**
- **Expected:** Big $ number, venue breakdown
- **Check:** Math is correct (venues × $150 × commission%)

### **Add Lead:**
- **Expected:** 3-step wizard, heat score 30-100
- **Check:** Can't submit without venue info

---

## 🐛 QUICK BUG REPORT

If you find a bug, tell me:

```
SCREEN: [name]
WHAT: [what's broken]
EXPECTED: [what should happen]
CONSOLE: [any red errors in F12]
```

Example:
```
SCREEN: Dashboard  
WHAT: Streak shows "3" instead of real number
EXPECTED: Should calculate from my activity
CONSOLE: No errors
```

---

## ✨ FAST FEEDBACK

**Just tell me:**
1. Does it work? (Yes/No)
2. What's broken? (List)
3. What feels off? (Ideas)

That's it! Then we'll fix and move forward.

---

## 🚀 AFTER QUICK TEST

**ALL GREEN?** → Do full testing with TESTING_GUIDE.md  
**FOUND BUGS?** → Report them, I'll fix  
**LOOKS GOOD?** → Move to legal docs + iOS setup

---

**Let's go! 🔥**
