# Testing Guide - Refactored Coastal Engineering App

## Quick Start Testing

### 1. Start the Server
The server should already be running. If not:
```bash
python -m http.server 8000
```

### 2. Open in Browser
Navigate to: **http://localhost:8000**

---

## What to Look For

### ✅ Material Design 3 Theme

#### Light Theme (Default)
**Primary Color:** Ocean Blue (#0061A4)
- Navigation bar should have ocean blue accents
- Active nav links highlighted in ocean blue
- Primary buttons with ocean blue background
- Feature card hover effects with ocean blue top border

**Background Colors:**
- Page background: Very light blue-white (#FDFCFF)
- Cards/surfaces: Slightly lighter (#F2F6FF - #DFE9FF)
- Subtle depth through elevation shadows

**Typography:**
- Headers should use Roboto font
- Clean, professional appearance
- Proper font weights (500 for titles, 400 for body)

#### Dark Theme (if system is set to dark mode)
**Primary Color:** Light Blue (#9ECAFF)
- Softer, more comfortable for eyes
- Dark background (#1A1C1E)
- Elevated surfaces slightly lighter (#22252A - #31343A)

### ✅ Tooltip System

#### How to Test Tooltips

1. **Navigate to Wave Predictor page**
   - Click "Wave Analysis" in navigation

2. **Hover over labels** - Should see tooltips with:
   - ⓘ info icon next to labels
   - Tooltip appears on hover
   - Shows engineering definition
   - Includes typical ranges
   - Has colored badge (📋 Definition, ⚙️ Parameter, or 📊 Result)

3. **Test these specific tooltips:**

   **Label Tooltip Example:**
   - Hover over "Significant Wave Height (Hs)" label
   - Should see: "The average height of the highest one-third of waves in a sea state..."
   - Badge should show: "📋 Definition"

   **Input Tooltip Example:**
   - Hover over "Wind Speed (U₁₀)" input field
   - Should see: "Wind speed at 10m above water surface in m/s. Typical range: 10-30 m/s..."
   - Badge should show: "⚙️ Parameter"

   **Output Tooltip Example:**
   - After running calculations, hover over result labels
   - Should see interpretation guidance
   - Badge should show: "📊 Result"

4. **Mobile/Touch Testing:**
   - Tap on labels with ⓘ icon
   - Tooltip should appear for 3 seconds then auto-hide

---

## Visual Checklist

### Navigation Bar
- [ ] Ocean blue gradient background
- [ ] Brand icon with ocean blue background
- [ ] "CoastalEngineer Pro" text with gradient effect
- [ ] Nav links change color on hover
- [ ] Active page has ocean blue highlight
- [ ] Smooth transitions on all interactions

### Dashboard
- [ ] "Welcome to CoastalEngineer Pro" header with gradient text
- [ ] Recent Projects section (may show empty state)
- [ ] 6 feature cards in grid layout
- [ ] Each card has:
  - [ ] Icon with ocean blue background
  - [ ] Title and description
  - [ ] Feature list with arrow bullets
  - [ ] Hover effect (lifts up, shows ocean blue top border)
  - [ ] Smooth shadow transition

### Cards & Surfaces
- [ ] Rounded corners (12px for medium, 16px for large)
- [ ] Subtle elevation shadows
- [ ] Light background with slight blue tint
- [ ] Border: 1px solid with low opacity

### Buttons
- [ ] Primary buttons: Ocean blue gradient background
- [ ] Secondary buttons: Light surface with border
- [ ] Hover effects: Lift up slightly, shadow increases
- [ ] Icons aligned with text

### Forms & Inputs
- [ ] Input fields with rounded corners
- [ ] Focus state: Ocean blue border + glow
- [ ] Unit labels on right side of inputs
- [ ] Proper spacing and alignment

---

## Tooltip Content Verification

### Test These Specific Tooltips:

#### Wave Predictor Page

1. **"Significant Wave Height (Hs)"**
   - Type: 📋 Definition
   - Should mention: "highest one-third of waves"
   - Should include: "primary design wave parameter"

2. **"Wind Speed (U₁₀)"**
   - Type: ⚙️ Parameter
   - Should mention: "10m above water surface"
   - Should include: "Typical range: 10-30 m/s"

3. **"Fetch Length (F)"**
   - Type: ⚙️ Parameter
   - Should mention: "Distance over water that wind blows"
   - Should include: "Typical range: 1,000m - 100,000m"

#### Structure Designer Page

1. **"Armour Density (ρa)"**
   - Type: ⚙️ Parameter
   - Should list: Granite, Concrete, Coral rock densities
   - Should mention: "Higher density = more stable units"

2. **"Structure Slope (cotα)"**
   - Type: ⚙️ Parameter
   - Should explain: "Horizontal to vertical ratio"
   - Should mention: "Steeper slopes require larger armour"

#### After Running Calculations

1. **"Required Armour Stone Mass (M50)"**
   - Type: 📊 Result
   - Should explain: "Median mass of primary armour units"
   - Should mention: "Round up to available quarry sizes"

2. **"Stability Number (Ns)"**
   - Type: 📊 Result
   - Should explain: "Dimensionless parameter"
   - Should include: "If Ns > limit, armour is too light"

---

## Theme Switching Test

### Test Light Theme
1. Set system to light mode
2. Refresh page
3. Should see:
   - Light backgrounds (#FDFCFF)
   - Dark text (#1A1C1E)
   - Ocean blue primary (#0061A4)

### Test Dark Theme
1. Set system to dark mode (Windows: Settings > Personalization > Colors)
2. Refresh page
3. Should see:
   - Dark backgrounds (#1A1C1E)
   - Light text (#E2E2E6)
   - Light blue primary (#9ECAFF)
   - Darker elevated surfaces

---

## Browser DevTools Inspection

### Check CSS Variables
1. Open DevTools (F12)
2. Go to Elements/Inspector tab
3. Select `<html>` or `<body>` element
4. In Styles panel, look for `:root` variables
5. Verify these exist:
   ```css
   --md-sys-color-primary: #0061A4;
   --md-sys-color-surface: #FDFCFF;
   --md-sys-shape-corner-medium: 12px;
   --md-sys-elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15)...
   ```

### Check Font Loading
1. In DevTools, go to Network tab
2. Refresh page
3. Filter by "Font"
4. Should see Roboto font files loading:
   - Roboto-Regular
   - Roboto-Medium
   - Roboto-Bold

### Check Tooltip System
1. In DevTools Console, type:
   ```javascript
   window.tooltipSystem
   ```
2. Should see: `TooltipSystem {tooltips: Map(25), ...}`
3. Check tooltip count:
   ```javascript
   window.tooltipSystem.tooltips.size
   ```
4. Should return: `25` or more

---

## Common Issues & Solutions

### Issue: Tooltips Not Showing
**Solution:**
1. Check console for errors
2. Verify `tooltip-system.js` is loaded
3. Check if elements have `data-tooltip` attribute
4. Try refreshing page

### Issue: Wrong Colors
**Solution:**
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check if dark mode is enabled in system

### Issue: Font Not Loading
**Solution:**
1. Check internet connection (fonts load from Google)
2. Check Network tab for font loading errors
3. Verify font link in `<head>` of index.html

### Issue: Theme Not Switching
**Solution:**
1. Check system theme settings
2. Try toggling system theme
3. Hard refresh browser
4. Check `@media (prefers-color-scheme: dark)` in DevTools

---

## Performance Check

### Load Time
- Initial page load should be < 2 seconds
- Font loading should not block rendering
- Tooltips should appear within 200ms of hover

### Smooth Animations
- Card hover effects should be smooth (250ms)
- Tooltip fade-in should be smooth (200ms)
- No janky transitions or layout shifts

---

## Accessibility Check

### Keyboard Navigation
1. Press Tab repeatedly
2. Should see focus indicators on:
   - Navigation links
   - Buttons
   - Input fields
3. Focus indicator should be visible (ocean blue outline)

### Screen Reader Test (Optional)
1. Enable screen reader (Windows: Narrator, Mac: VoiceOver)
2. Navigate through page
3. Tooltips should be announced with role="tooltip"
4. All interactive elements should have proper labels

---

## Screenshot Checklist

Take screenshots of:
1. [ ] Dashboard in light theme
2. [ ] Dashboard in dark theme
3. [ ] Wave Predictor page with tooltip visible
4. [ ] Structure Designer page
5. [ ] Tooltip on hover (showing full content)
6. [ ] Navigation bar active state
7. [ ] Form inputs with focus state

---

## Success Criteria

✅ **Visual Design**
- Ocean blue (#0061A4) is primary color in light theme
- Light blue (#9ECAFF) is primary color in dark theme
- Roboto font is used throughout
- Cards have proper elevation shadows
- Smooth transitions on all interactions

✅ **Tooltip System**
- All 25+ tooltips work correctly
- Info icons (ⓘ) appear next to labels
- Tooltips show on hover
- Touch support works on mobile
- Proper positioning (doesn't go off-screen)
- Type badges display correctly

✅ **Theme Support**
- Light theme works correctly
- Dark theme works correctly
- Automatic switching based on system preference
- All colors have proper contrast

✅ **Functionality**
- All existing features still work
- Navigation functions properly
- Calculators produce results
- Library operations work
- No console errors

---

## Next Steps After Testing

If everything works:
1. ✅ Mark Phase 1 as complete
2. 🔄 Begin implementing Global Parameter Management
3. 🔄 Enhance Project Workflow system
4. 🔄 Implement layer-by-layer cross-section designer

If issues found:
1. Document specific issues
2. Check browser console for errors
3. Verify file paths and imports
4. Test in different browsers

---

## Contact & Support

If you encounter any issues:
1. Check browser console for errors
2. Verify all files are in correct locations
3. Ensure server is running on port 8000
4. Try different browser (Chrome, Firefox, Safari)

**Files Modified:**
- `styles.css` - Material Design 3 tokens
- `index.html` - Roboto font import
- `scripts/tooltip-system.js` - NEW tooltip system

**Files to Create Next:**
- `scripts/global-parameters.js` - Parameter management
- Enhanced project workflow features
- Layer-by-layer designer components
