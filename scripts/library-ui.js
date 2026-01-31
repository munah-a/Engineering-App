// ==========================================
// LIBRARY UI MANAGEMENT
// ==========================================

let currentStructures = [];
let currentFilters = {
    query: '',
    type: 'all',
    status: 'all',
    sortBy: 'dateModified'
};

// ==========================================
// INITIALIZE LIBRARY PAGE
// ==========================================
async function initLibraryPage() {
    await loadAndDisplayStructures();
    setupLibraryEventListeners();
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupLibraryEventListeners() {
    // Search
    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            currentFilters.query = e.target.value;
            await loadAndDisplayStructures();
        }, 300));
    }

    // Filters
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');
    const sortBy = document.getElementById('sortBy');

    if (filterType) {
        filterType.addEventListener('change', async (e) => {
            currentFilters.type = e.target.value;
            await loadAndDisplayStructures();
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', async (e) => {
            currentFilters.status = e.target.value;
            await loadAndDisplayStructures();
        });
    }

    if (sortBy) {
        sortBy.addEventListener('change', async (e) => {
            currentFilters.sortBy = e.target.value;
            await loadAndDisplayStructures();
        });
    }

    // Action buttons
    const createBtn = document.getElementById('createNewStructure');
    const importBtn = document.getElementById('importBtn');
    const exportLibraryBtn = document.getElementById('exportLibraryBtn');

    if (createBtn) {
        createBtn.addEventListener('click', createNewStructure);
    }

    if (importBtn) {
        importBtn.addEventListener('click', () => {
            // Create hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/json';
            fileInput.addEventListener('change', handleImport);
            fileInput.click();
        });
    }

    if (exportLibraryBtn) {
        exportLibraryBtn.addEventListener('click', async () => {
            try {
                await StructureLibrary.exportLibrary();
                StructureLibrary.showNotification('Library exported successfully', 'success');
            } catch (error) {
                console.error('Export failed:', error);
                StructureLibrary.showNotification('Failed to export library', 'error');
            }
        });
    }
}

// ==========================================
// LOAD AND DISPLAY STRUCTURES
// ==========================================
async function loadAndDisplayStructures() {
    try {
        // Get filtered structures
        const structures = await StructureLibrary.searchStructures(
            currentFilters.query,
            {
                type: currentFilters.type,
                status: currentFilters.status
            }
        );

        // Sort structures
        currentStructures = sortStructures(structures, currentFilters.sortBy);

        // Display structures
        displayStructures(currentStructures);
    } catch (error) {
        console.error('Failed to load structures:', error);
        StructureLibrary.showNotification('Failed to load structures', 'error');
    }
}

// ==========================================
// SORT STRUCTURES
// ==========================================
function sortStructures(structures, sortBy) {
    return structures.sort((a, b) => {
        switch (sortBy) {
            case 'dateModified':
                return new Date(b.dateModified) - new Date(a.dateModified);
            case 'dateCreated':
                return new Date(b.dateCreated) - new Date(a.dateCreated);
            case 'name':
                return a.name.localeCompare(b.name);
            case 'type':
                return a.type.localeCompare(b.type);
            default:
                return 0;
        }
    });
}

// ==========================================
// DISPLAY STRUCTURES
// ==========================================
function displayStructures(structures) {
    const grid = document.getElementById('structureGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    // Clear existing cards (except empty state)
    const cards = grid.querySelectorAll('.structure-card');
    cards.forEach(card => card.remove());

    if (structures.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        return;
    }

    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // Create structure cards
    structures.forEach(structure => {
        const card = createStructureCard(structure);
        grid.appendChild(card);
    });
}

// ==========================================
// CREATE STRUCTURE CARD
// ==========================================
function createStructureCard(structure) {
    const card = document.createElement('div');
    card.className = 'structure-card';
    card.dataset.structureId = structure.id;

    const typeIcon = getTypeIcon(structure.type);
    const formattedDate = formatDate(structure.dateModified);
    const typeName = formatTypeName(structure.type);

    card.innerHTML = `
        <div class="structure-thumbnail">
            ${structure.thumbnail
            ? `<img src="${structure.thumbnail}" alt="${structure.name}">`
            : `<div class="structure-thumbnail-placeholder">${typeIcon}</div>`
        }
        </div>
        <div class="structure-info">
            <div class="structure-header">
                <div>
                    <div class="structure-name">${escapeHtml(structure.name)}</div>
                    <div class="structure-type">${typeName}</div>
                </div>
                <span class="structure-status ${structure.status}">${structure.status}</span>
            </div>
            ${structure.projectName ? `
                <div class="structure-details">
                    <div class="structure-detail">
                        <span>Project:</span>
                        <strong>${escapeHtml(structure.projectName)}</strong>
                    </div>
                    ${structure.location ? `
                        <div class="structure-detail">
                            <span>Location:</span>
                            <strong>${escapeHtml(structure.location)}</strong>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="structure-meta">
                <span>Modified: ${formattedDate}</span>
                <span>v${structure.version || 1}</span>
            </div>
        </div>
        <div class="structure-actions">
            <button class="structure-action-btn" onclick="loadStructureForEditing(${structure.id})">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10 1L13 4L5 12H2V9L10 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Edit
            </button>
            <button class="structure-action-btn" onclick="duplicateStructureById(${structure.id})">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="3" y="3" width="8" height="8" stroke="currentColor" stroke-width="1.5" rx="1"/>
                    <path d="M5 3V2C5 1.44772 5.44772 1 6 1H12C12.5523 1 13 1.44772 13 2V8C13 8.55228 12.5523 9 12 9H11" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                Copy
            </button>
            <button class="structure-action-btn" onclick="exportStructureById(${structure.id})">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 9V2M7 9L4 6M7 9L10 6M2 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Export
            </button>
            <button class="structure-action-btn danger" onclick="deleteStructureById(${structure.id})">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4H12M5 4V2.5C5 2.22386 5.22386 2 5.5 2H8.5C8.77614 2 9 2.22386 9 2.5V4M5.5 7V10M8.5 7V10M3 4L3.5 11.5C3.5 11.7761 3.72386 12 4 12H10C10.2761 12 10.5 11.7761 10.5 11.5L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Delete
            </button>
        </div>
    `;

    return card;
}

// ==========================================
// STRUCTURE ACTIONS
// ==========================================
function createNewStructure() {
    // Navigate to designer page
    navigateToPage('designer');

    // Reset designer to fresh state
    if (typeof loadTemplate === 'function') {
        loadTemplate('rubble-standard');
    }

    // Show notification
    StructureLibrary.showNotification('Create your structure and use "Save to Library" button', 'info');
}

async function loadStructureForEditing(id) {
    try {
        const structure = await StructureLibrary.getStructureById(id);
        if (!structure) {
            StructureLibrary.showNotification('Structure not found', 'error');
            return;
        }

        // Load structure into designer
        if (window.AppState) {
            window.AppState.selectedTemplate = structure.type;
            window.AppState.structureData = structure;
        }

        // Navigate to designer
        navigateToPage('designer');

        // Load template with structure data
        if (typeof loadTemplate === 'function') {
            loadTemplate(structure.type);
        }

        // Populate form fields with structure dimensions
        setTimeout(() => {
            if (structure.dimensions) {
                Object.keys(structure.dimensions).forEach(key => {
                    const input = document.getElementById(key);
                    if (input) {
                        input.value = structure.dimensions[key];
                    }
                });
            }
        }, 200);

        StructureLibrary.showNotification(`Loaded: ${structure.name}`, 'success');
    } catch (error) {
        console.error('Failed to load structure:', error);
        StructureLibrary.showNotification('Failed to load structure', 'error');
    }
}

async function duplicateStructureById(id) {
    try {
        const newId = await StructureLibrary.duplicateStructure(id);
        StructureLibrary.showNotification('Structure duplicated successfully', 'success');
        await loadAndDisplayStructures();
    } catch (error) {
        console.error('Failed to duplicate structure:', error);
        StructureLibrary.showNotification('Failed to duplicate structure', 'error');
    }
}

async function exportStructureById(id) {
    try {
        const structure = await StructureLibrary.getStructureById(id);
        if (structure) {
            StructureLibrary.exportStructureAsJSON(structure);
            StructureLibrary.showNotification('Structure exported successfully', 'success');
        }
    } catch (error) {
        console.error('Failed to export structure:', error);
        StructureLibrary.showNotification('Failed to export structure', 'error');
    }
}

async function deleteStructureById(id) {
    if (!confirm('Are you sure you want to delete this structure? This action cannot be undone.')) {
        return;
    }

    try {
        await StructureLibrary.deleteStructure(id);
        StructureLibrary.showNotification('Structure deleted successfully', 'success');
        await loadAndDisplayStructures();
    } catch (error) {
        console.error('Failed to delete structure:', error);
        StructureLibrary.showNotification('Failed to delete structure', 'error');
    }
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const importedIds = await StructureLibrary.importStructures(file);
        StructureLibrary.showNotification(`Successfully imported ${importedIds.length} structure(s)`, 'success');
        await loadAndDisplayStructures();
    } catch (error) {
        console.error('Import failed:', error);
        StructureLibrary.showNotification('Failed to import structures', 'error');
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function getTypeIcon(type) {
    const icons = {
        'rubble-standard': '🏔️',
        'rubble-berm': '🌊',
        'rubble-reef': '🪸',
        'rubble-low': '📉',
        'vertical-wall': '🏢',
        'vertical-composite': '🏗️',
        'vertical-caisson': '📦',
        'vertical-perforated': '⬜'
    };
    return icons[type] || '🏗️';
}

function formatTypeName(type) {
    return type
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// ==========================================
// SAVE CURRENT STRUCTURE TO LIBRARY
// ==========================================
async function saveCurrentStructureToLibrary() {
    // Gather current structure data from designer
    const templateType = window.AppState?.selectedTemplate || 'rubble-standard';

    // Collect dimensions from input fields
    const dimensions = {};
    const paramInputs = document.getElementById('parameterInputs');
    if (paramInputs) {
        paramInputs.querySelectorAll('input[type="number"]').forEach(input => {
            dimensions[input.id] = parseFloat(input.value) || 0;
        });
    }

    // Prompt for structure details
    const name = prompt('Enter structure name:', 'My Coastal Structure');
    if (!name) return; // User cancelled

    const projectName = prompt('Enter project name (optional):') || '';
    const location = prompt('Enter location (optional):') || '';

    // Create structure object
    const structure = new StructureLibrary.CoastalStructure({
        name: name,
        type: templateType,
        dimensions: dimensions,
        projectName: projectName,
        location: location,
        status: 'draft'
    });

    try {
        // Generate thumbnail from canvas if available
        const canvas = document.getElementById('designCanvas');
        if (canvas) {
            structure.thumbnail = canvas.toDataURL('image/png');
        }

        // Save to library
        const id = await StructureLibrary.saveStructure(structure);
        StructureLibrary.showNotification('Structure saved to library!', 'success');

        // Refresh library if on library page
        if (window.AppState?.currentPage === 'library') {
            await loadAndDisplayStructures();
        }

        // Refresh dashboard recent projects
        if (typeof loadRecentProjects === 'function') {
            loadRecentProjects();
        }
    } catch (error) {
        console.error('Failed to save structure:', error);
        StructureLibrary.showNotification('Failed to save structure', 'error');
    }
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
window.initLibraryPage = initLibraryPage;
window.loadStructureForEditing = loadStructureForEditing;
window.loadStructureFromLibrary = loadStructureForEditing; // Alias for dashboard
window.duplicateStructureById = duplicateStructureById;
window.exportStructureById = exportStructureById;
window.deleteStructureById = deleteStructureById;
window.saveCurrentStructureToLibrary = saveCurrentStructureToLibrary;

// Initialize when page becomes active
document.addEventListener('DOMContentLoaded', () => {
    // Listen for navigation to library page
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('active') && mutation.target.id === 'library') {
                initLibraryPage();
            }
        });
    });

    const libraryPage = document.getElementById('library');
    if (libraryPage) {
        observer.observe(libraryPage, { attributes: true, attributeFilter: ['class'] });
    }
});
