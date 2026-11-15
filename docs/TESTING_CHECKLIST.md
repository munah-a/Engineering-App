# Manual Testing Checklist for Refactored Application

## Prerequisites
- Ensure the development server is running: `python -m http.server 8000`
- Open your browser and navigate to `http://localhost:8000`
- Open the browser's Developer Console (F12) to monitor for any errors

## Test Suite

### Test 1: Navigation
- [ ] Verify the "Library" navigation link appears in the top navigation bar
- [ ] Click on "Library" - the page should load without errors
- [ ] Check console for any JavaScript errors

### Test 2: Empty Library State
- [ ] On the Library page, verify you see:
  - [ ] Search bar at the top
  - [ ] Filter dropdowns (Type, Status, Sort By)
  - [ ] Action buttons (Import, Export All, New Structure)
  - [ ] Empty state message: "No Structures Found"
  - [ ] "Create New Structure" button in the center

### Test 3: Create and Save a Structure
- [ ] Navigate to "Structure Design" page
- [ ] Verify the "Save to Library" button appears below "Analyze Structure"
- [ ] Select a template (e.g., Standard Breakwater)
- [ ] Modify some parameters
- [ ] Click "Save to Library"
- [ ] Enter structure name: "Test Structure 1"
- [ ] Enter project name: "Test Project"
- [ ] Enter location: "Test Location"
- [ ] Verify success notification appears

### Test 4: View Saved Structure
- [ ] Navigate to "Library" page
- [ ] Verify the structure card is displayed
- [ ] Check the card shows:
  - [ ] Structure name ("Test Structure 1")
  - [ ] Structure type icon and name
  - [ ] Status badge (should be "DRAFT" with yellow color)
  - [ ] Project name
  - [ ] Location
  - [ ] Last modified date
  - [ ] Version number (v1)
  - [ ] Action buttons (Edit, Copy, Export, Delete)

### Test 5: Search Functionality
- [ ] In the search bar, type "Test"
- [ ] Verify the structure appears
- [ ] Type "NonExistent"
- [ ] Verify empty state appears
- [ ] Clear search
- [ ] Verify structure reappears

### Test 6: Filter Functionality
- [ ] Filter by Type - Select "Standard Rubble Mound"
- [ ] Verify the structure appears (or disappears if wrong type)
- [ ] Filter by Status - Select "Draft"
- [ ] Verify the structure appears
- [ ] Select "Approved"
- [ ] Verify empty state (no approved structures yet)
- [ ] Reset filters to "All"

### Test 7: Sort Functionality
- [ ] Create a second structure with different name
- [ ] Test Sort by "Name (A-Z)" - verify alphabetical order
- [ ] Test Sort by "Last Modified" - most recent first
- [ ] Test Sort by "Type"

### Test 8: Edit Structure
- [ ] Click "Edit" button on a structure card
- [ ] Verify navigation to Designer page
- [ ] Verify parameters are populated with saved values
- [ ] Modify a parameter
- [ ] Click "Save to Library" again
- [ ] Use same name or modify it
- [ ] Return to Library
- [ ] Verify modified date updated

### Test 9: Duplicate Structure
- [ ] Click "Copy" button on a structure card
- [ ] Verify success notification
- [ ] Verify a new card appears with "(Copy)" appended to name
- [ ] Verify it has its own ID and creation date

### Test 10: Export Structure
- [ ] Click "Export" button on a structure card
- [ ] Verify a JSON file downloads
- [ ] Open the file in a text editor
- [ ] Verify it contains structure data in JSON format

### Test 11: Export Library
- [ ] Click "Export All" button
- [ ] Verify a JSON file downloads
- [ ] Open the file
- [ ] Verify it contains an array of all structures

### Test 12: Import Structure
- [ ] Click "Import" button
- [ ] Select the previously exported JSON file
- [ ] Verify success notification
- [ ] Verify imported structure(s) appear in the grid
- [ ] Note: Imported structures get new IDs

### Test 13: Delete Structure
- [ ] Click "Delete" button on a structure
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" - verify structure remains
- [ ] Click "Delete" again, then "OK"
- [ ] Verify success notification
- [ ] Verify structure is removed from grid

### Test 14: Persistence
- [ ] Create multiple structures
- [ ] Close the browser tab
- [ ] Reopen `http://localhost:8000`
- [ ] Navigate to Library
- [ ] Verify all structures are still present (IndexedDB persistence)

### Test 15: Mobile Responsiveness
- [ ] Open Developer Tools
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select a mobile device (e.g., iPhone 12)
- [ ] Navigate through pages
- [ ] Verify:
  - [ ] Library toolbar stacks vertically
  - [ ] Structure grid shows single column
  - [ ] Buttons are full width
  - [ ] Search bar is full width

### Test 16: IndexedDB Inspection
- [ ] Open Developer Tools
- [ ] Go to Application tab (Chrome) or Storage tab (Firefox)
- [ ] Expand IndexedDB
- [ ] Find "CoastalEngineerDB"
- [ ] Inspect "structures" object store
- [ ] Verify saved structures are present
- [ ] Check indexes (name, type, dateCreated, etc.)

### Test 17: Error Handling
- [ ] Try importing an invalid JSON file
- [ ] Verify error notification appears
- [ ] Try importing a non-JSON file
- [ ] Verify error notification appears

### Test 18: Workflow Integration
- [ ] Create a structure in Designer
- [ ] Save to Library
- [ ] Navigate to Library
- [ ] Load structure for editing
- [ ] Modify parameters
- [ ] Run calculations (if implemented)
- [ ] Save as new structure
- [ ] Verify both original and modified exist

## Console Checks
Throughout testing, monitor the console for:
- ✅ "CoastalEngineer Pro - Initializing..."
- ✅ "Database opened successfully"
- ✅ "CoastalEngineer Pro - Ready!"
- ❌ No errors related to undefined functions
- ❌ No errors related to database operations
- ❌ No CSS styling issues

## Expected Results Summary
- All features should work without console errors
- IndexedDB should persist data across sessions
- UI should be responsive and visually appealing
- Notifications should provide clear feedback
- Export/Import should maintain data integrity
- Search and filters should work in real-time
- Structure reuse workflow should be seamless

## Troubleshooting
If you encounter issues:

1. **Library page doesn't load**
   - Check console for JavaScript errors
   - Verify all script files are loaded
   - Check Network tab for 404 errors

2. **Structures don't save**
   - Check IndexedDB is supported
   - Check browser storage quota
   - Verify no console errors during save

3. **Empty state always shows**
   - Check console for database errors
   - Verify structures exist in IndexedDB
   - Check filter settings aren't hiding structures

4. **Import doesn't work**
   - Verify JSON file format is correct
   - Check console for parsing errors
   - Ensure file contains structure data

## Success Criteria
✅ All navigation works correctly
✅ Library page displays properly
✅ Structures can be created and saved
✅ Structures persist across sessions
✅ Search and filters work correctly
✅ Export/Import maintains data integrity
✅ Edit workflow functions properly
✅ No console errors during normal operation
✅ Mobile responsive design works
✅ Notifications provide clear feedback

---

**Note**: If any test fails, check the console for specific error messages and verify that all files have been properly saved and the server has been restarted if necessary.
