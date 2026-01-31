# Structure Library - Quick Start Guide

## What is the Structure Library?

The Structure Library is a powerful new feature that allows you to save, manage, and reuse your coastal structure designs across different projects. Think of it as your personal catalog of proven structural designs.

## Getting Started

### Accessing the Library
1. Open the CoastalEngineer Pro application
2. Click the **"Library"** button in the top navigation bar
3. You'll see your structure library (initially empty)

## Core Features

### 📝 Creating Your First Structure

1. **Design Your Structure**
   - Navigate to **"Structure Design"** from the top menu
   - Select a template from the left sidebar (e.g., Standard Breakwater)
   - Enter your design parameters (height, width, slope, etc.)
   - Optionally run stability analysis

2. **Save to Library**
   - Click the **"Save to Library"** button (below "Analyze Structure")
   - Enter a descriptive name: e.g., "Port Authority Main Breakwater"
   - Enter project name: e.g., "Harbor Expansion Project"
   - Enter location: e.g., "Miami, FL"
   - Click OK

3. **View in Library**
   - Navigate to **"Library"**
   - Your structure now appears as a card with a thumbnail and details

### 🔍 Finding Structures

**Search Bar**
- Type structure name, project name, or tags
- Results update instantly as you type
- Example: Search "breakwater" to find all breakwater designs

**Filters**
- **Filter by Type**: Select structure type (Rubble Mound, Vertical Wall, etc.)
- **Filter by Status**: Draft, Approved, or Archived
- **Sort By**: Date Modified, Date Created, Name, or Type

### ✏️ Editing Structures

1. Find your structure in the library
2. Click the **"Edit"** button on the structure card
3. You're automatically taken to the Designer with all parameters loaded
4. Make your changes
5. Click "Save to Library" again to update

### 📋 Duplicating Structures

When you want to use an existing design as a starting point:
1. Find the structure you want to copy
2. Click the **"Copy"** button
3. A new structure is created with "(Copy)" added to the name
4. Edit the copy as needed without affecting the original

### 💾 Exporting Structures

**Export Single Structure**
1. Click the **"Export"** button on any structure card
2. A JSON file downloads to your computer
3. Share this file with colleagues or save as backup

**Export Entire Library**
1. Click **"Export All"** in the toolbar
2. All structures are exported as a single JSON file
3. Use this for complete backups

### 📥 Importing Structures

**Import from File**
1. Click **"Import"** in the toolbar
2. Select a JSON file (previously exported structure or library)
3. Structures are added to your library
4. Imported structures get new IDs (won't overwrite existing)

**Common Use Cases**
- Receiving structures from colleagues
- Restoring from backup
- Moving structures between computers
- Sharing company-standard designs

## Structure Card Information

Each structure card displays:

```
┌─────────────────────────────────────┐
│ [Thumbnail Image or Icon]           │
├─────────────────────────────────────┤
│ Structure Name          [STATUS]    │
│ Structure Type                      │
│                                     │
│ Project: Project Name               │
│ Location: City, State               │
│                                     │
│ Modified: 2 days ago        v1      │
├─────────────────────────────────────┤
│ [Edit] [Copy] [Export] [Delete]     │
└─────────────────────────────────────┘
```

**Status Badges**
- 🟡 **DRAFT** - Work in progress
- 🟢 **APPROVED** - Reviewed and approved for use
- ⚪ **ARCHIVED** - Historical record, not actively used

## Best Practices

### Organization Tips

1. **Use Descriptive Names**
   - ❌ Bad: "Structure 1"
   - ✅ Good: "Type-A Rubble Mound Breakwater - Wave Height 3m"

2. **Include Project Information**
   - Always fill in Project Name
   - Add Location for site-specific designs
   - This helps when searching later

3. **Use Consistent Naming**
   - Develop a naming convention
   - Example: "[Type] - [Location] - [Key Parameter]"
   - "Vertical Wall - North Pier - 8m Height"

4. **Manage Status**
   - Keep designs as DRAFT while developing
   - Mark as APPROVED after internal review
   - ARCHIVE old designs instead of deleting

5. **Regular Backups**
   - Export your library monthly
   - Store backups in safe location
   - Consider version-controlled backups

### Workflow Examples

**Scenario 1: Similar Projects**
```
1. Create structure for Project A
2. Save to library as "Project A - Main Breakwater"
3. Start Project B (similar conditions)
4. Load Project A structure from library
5. Modify for Project B conditions
6. Save as "Project B - Main Breakwater"
```

**Scenario 2: Design Standards**
```
1. Engineering team develops standard designs
2. Export approved structures
3. Distribute JSON files to team members
4. All import standard designs
5. Everyone uses same proven designs
```

**Scenario 3: Design Evolution**
```
1. Create initial design (v1)
2. Save to library
3. Client requests changes
4. Load from library
5. Modify parameters
6. Save again (v2 - automatically tracked)
7. Compare original vs. modified
```

## Advanced Features

### Version Control
- Every time you save a structure, the version number increments
- The "Modified" date updates automatically
- Keep track of design iterations

### Thumbnails
- Automatically captured from the design canvas
- Visual preview of your structure
- Helps identify designs quickly

### Auto-Complete
- Search suggestions based on existing structures
- Faster navigation in large libraries
- Smart filtering

## Troubleshooting

### "Structure not saving"
- Check browser console for errors
- Ensure browser supports IndexedDB
- Check available storage space
- Try a different browser

### "Import failed"
- Verify JSON file format
- Check file isn't corrupted
- Ensure it's a valid structure export
- Try exporting again

### "Structures disappeared"
- Check filter settings (might be hiding structures)
- Clear search bar
- Set filters to "All"
- Check browser's IndexedDB (Developer Tools)

### "Can't find a structure"
- Use search function
- Check all filter combinations
- Sort by "Date Created" to find oldest/newest
- Export library and search JSON file

## Keyboard Shortcuts

Currently, the library uses standard browser shortcuts:
- **Ctrl+F** in exported JSON to search offline
- **F12** to open Developer Tools and inspect database
- **Ctrl+Click** on structure card to open in new context

## Data Safety

### Where is data stored?
- Locally in your browser's IndexedDB
- Not sent to any server
- Persists until you clear browser data

### Moving to another computer?
1. Export entire library
2. Copy JSON file to new computer
3. Open application on new computer
4. Import JSON file
5. All structures now available

### Clearing browser data?
⚠️ **Warning**: Clearing browser data will delete your library!
- Always export before clearing data
- Create regular backups
- Consider storing exports in cloud storage

## Tips for Large Libraries

Once you have 50+ structures:

1. **Use Filters Effectively**
   - Filter by type for specific projects
   - Use status to separate active/archived
   - Sort by date to find recent work

2. **Develop Naming Convention**
   - Prefix by client: "ClientA - ..."
   - Prefix by year: "2024 - ..."
   - Use tags in names: "[Urgent] ..."

3. **Regular Cleanup**
   - Archive old designs quarterly
   - Delete true duplicates
   - Export archives separately

4. **Performance**
   - Library handles hundreds of structures
   - Search remains fast with indexing
   - Consider archiving very old designs

## Getting Help

If you encounter issues:

1. Check the browser console (F12) for error messages
2. Verify browser compatibility (Chrome, Firefox, Safari, Edge)
3. Clear cache and reload page
4. Export library as backup before troubleshooting
5. Try incognito/private mode to rule out extensions

## Next Steps

Now that you understand the Structure Library:

1. ✅ Create your first structure and save it
2. ✅ Practice searching and filtering
3. ✅ Try the duplicate and edit workflow
4. ✅ Export your library as a backup
5. ✅ Develop your naming convention
6. ✅ Build your catalog of proven designs!

---

**Remember**: The library is **offline-first** - your data stays on your computer, giving you full control and instant access without internet dependency.

Happy designing! 🏗️🌊
