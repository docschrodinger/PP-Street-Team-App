# Testing the Rank-Up Celebration Modal

## Quick Test in Browser Console

Once your app is running, you can trigger the rank-up modal manually to see it in action:

### Method 1: Dispatch Event Directly

Open your browser console (F12) and paste:

```javascript
// Test Bronze → Silver rank up
const event = new CustomEvent('rank-up', {
  detail: {
    previousRank: 'Bronze',
    newRank: 'Silver',
    totalXP: 500
  }
});
window.dispatchEvent(event);
```

### Method 2: Award XP to Trigger Naturally

```javascript
// Import and use the awardXP function
// (Assuming you're logged in as a test user)

// This would need to be done in the app code, not console
// Add a lot of XP to cross a rank threshold
```

---

## Testing Different Rank Progressions

### Bronze → Silver (500 XP)
```javascript
window.dispatchEvent(new CustomEvent('rank-up', {
  detail: { previousRank: 'Bronze', newRank: 'Silver', totalXP: 500 }
}));
```

### Silver → Gold (1500 XP)
```javascript
window.dispatchEvent(new CustomEvent('rank-up', {
  detail: { previousRank: 'Silver', newRank: 'Gold', totalXP: 1500 }
}));
```

### Gold → Platinum (3500 XP)
```javascript
window.dispatchEvent(new CustomEvent('rank-up', {
  detail: { previousRank: 'Gold', newRank: 'Platinum', totalXP: 3500 }
}));
```

### Platinum → Diamond (7000 XP)
```javascript
window.dispatchEvent(new CustomEvent('rank-up', {
  detail: { previousRank: 'Platinum', newRank: 'Diamond', totalXP: 7000 }
}));
```

### Diamond → Black Key (15000 XP)
```javascript
window.dispatchEvent(new CustomEvent('rank-up', {
  detail: { previousRank: 'Diamond', newRank: 'Black Key', totalXP: 15000 }
}));
```

---

## Natural Testing Flow

To see the modal trigger naturally during normal app usage:

1. **Login** as test user (Bronze rank with ~0 XP)

2. **Add multiple leads** to gain XP:
   - New lead: +25 XP
   - Contact a lead: +10 XP
   - Move to follow-up: +15 XP
   - Schedule demo: +25 XP
   - Verbal yes: +50 XP
   - Signed pending: +100 XP
   - Live: +200 XP

3. **Complete street runs** for bonus XP:
   - Run completion: +50 XP
   - Each hour of run time: +10 XP

4. **Watch for the modal:**
   - When you cross 500 XP (Bronze → Silver), modal appears!
   - Confetti explodes across the screen
   - Your new rank is displayed with animation

---

## What to Look For

### ✅ Visual Elements
- [ ] Modal slides in with 3D rotation
- [ ] Rank icon displays with correct color
- [ ] Previous rank shows crossed out
- [ ] New rank shows in large text with rank color
- [ ] Total XP displays in highlighted box
- [ ] Confetti particles fall from top of screen
- [ ] Close button (X) in top-right
- [ ] "Let's Go!" CTA button at bottom

### ✅ Animations
- [ ] Modal entrance: scale + rotate
- [ ] Rank icon: delayed entrance with spring
- [ ] Glow effect: pulsing border around icon
- [ ] Confetti: 50+ particles falling with rotation
- [ ] Fade out after 5 seconds (or click to close)

### ✅ Colors by Rank
- **Bronze**: #CD7F32 (copper/bronze)
- **Silver**: #C0C0C0 (silver)
- **Gold**: #FFD700 (gold)
- **Platinum**: #E5E4E2 (platinum white)
- **Diamond**: #B9F2FF (light blue)
- **Black Key**: #1A1A1A (nearly black)

### ✅ Behavior
- [ ] Modal auto-closes after 5 seconds
- [ ] Clicking backdrop closes modal
- [ ] Clicking "Let's Go!" closes modal
- [ ] Clicking X closes modal
- [ ] Confetti stops when modal closes
- [ ] Can't trigger multiple modals simultaneously

---

## Troubleshooting

### Modal doesn't appear
- Check browser console for errors
- Verify `RankUpModal` is imported in App.tsx
- Confirm event listener is set up in App.tsx
- Make sure `showRankUpModal` state exists

### Confetti doesn't show
- Check if window.innerWidth/innerHeight are available
- Verify Motion (framer-motion) is installed
- Look for z-index conflicts

### Animation is janky
- Check if `motion` library is properly imported
- Verify no CSS conflicts with `transform` properties
- Test in different browsers

### Wrong rank displayed
- Verify rank calculation in `xpService.ts`
- Check `street_ranks` table has correct `min_xp` values
- Ensure XP is being awarded correctly

---

## Expected User Flow

1. **User performs action** (e.g., moves lead to "live")
2. **XP is awarded** via `awardXP()` function
3. **Rank is recalculated** based on new total XP
4. **If rank changed:**
   - Event dispatched: `rank-up`
   - Modal opens with previous → new rank
   - Confetti explodes
   - User sees celebration for 5 seconds
   - Toast notification also shows rank-up
5. **User continues** with more motivation!

---

## Integration with XP System

The rank-up modal is automatically triggered by the XP service:

**File:** `/lib/xpService.ts`

```typescript
const rankUp = previousRank !== newRank;

// Dispatch rank-up event if rank changed
if (rankUp && typeof window !== 'undefined') {
  const event = new CustomEvent('rank-up', {
    detail: {
      previousRank,
      newRank,
      totalXP: newTotalXP,
    },
  });
  window.dispatchEvent(event);
}
```

**Any time XP is awarded and causes a rank change, the modal triggers automatically.**

---

## Video Demo Script

If you want to record a demo:

1. Start recording
2. Show dashboard with current rank (Bronze)
3. Navigate to "Add Lead"
4. Fill out lead details
5. Submit → watch XP toast appear
6. Repeat multiple times
7. When XP crosses threshold:
   - **BOOM** - Rank-Up Modal appears
   - Confetti everywhere
   - New rank celebrated
8. Click "Let's Go!" to continue
9. Show updated rank in profile/dashboard

---

## Perfect! 🎉

The rank-up modal is fully functional and will automatically trigger whenever a user earns enough XP to reach a new rank. Enjoy the celebration!
