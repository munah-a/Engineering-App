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
    const safeName = escapeHtml(structure.name || 'Untitled Structure');
    const safeStatus = escapeHtml(structure.status || 'draft');

    card.innerHTML = `
        <div class="structure-thumbnail">
            ${structure.thumbnail
            ? `<img src="${escapeHtml(structure.thumbnail)}" alt="${safeName}">`
            : `<div class="structure-thumbnail-placeholder">${typeIcon}</div>`
        }
        </div>
        <div class="structure-info">
            <div class="structure-header">
                <div>
                    <div class="structure-name">${safeName}</div>
                    <div class="structure-type">${escapeHtml(typeName)}</div>
                </div>
                <span class="structure-status ${safeStatus}">${safeStatus}</span>
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
                <span>Modified: ${escapeHtml(formattedDate)}</span>
                <span>v${structure.version || 1}</span>
            </div>
        </div>
        <div class="structure-actions">
            <button type="button" class="structure-action-btn" data-action="edit">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10 1L13 4L5 12H2V9L10 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Edit
            </button>
            <button type="button" class="structure-action-btn" data-action="duplicate">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="3" y="3" width="8" height="8" stroke="currentColor" stroke-width="1.5" rx="1"/>
                    <path d="M5 3V2C5 1.44772 5.44772 1 6 1H12C12.5523 1 13 1.44772 13 2V8C13 8.55228 12.5523 9 12 9H11" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                Copy
            </button>
            <button type="button" class="structure-action-btn" data-action="export">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 9V2M7 9L4 6M7 9L10 6M2 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Export
            </button>
            <button type="button" class="structure-action-btn danger" data-action="delete">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4H12M5 4V2.5C5 2.22386 5.22386 2 5.5 2H8.5C8.77614 2 9 2.22386 9 2.5V4M5.5 7V10M8.5 7V10M3 4L3.5 11.5C3.5 11.7761 3.72386 12 4 12H10C10.2761 12 10.5 11.7761 10.5 11.5L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Delete
            </button>
        </div>
    `;

    card.querySelector('[data-action="edit"]')?.addEventListener('click', () => loadStructureForEditing(structure.id));
    card.querySelector('[data-action="duplicate"]')?.addEventListener('click', () => duplicateStructureById(structure.id));
    card.querySelector('[data-action="export"]')?.addEventListener('click', () => exportStructureById(structure.id));
    card.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteStructureById(structure.id));

    return card;
}

// ==========================================
// STRUCTURE ACTIONS
// ==========================================
function createNewStructure() {
    navigateToPage('designer');

    if (typeof loadTemplate === 'function') {
        loadTemplate('rubble-standard');
    }

    StructureLibrary.showNotification('Create your structure and use "Save to Library" button', 'info');
}

async function loadStructureForEditing(id) {
    try {
        const lookupId = (typeof id === 'string' && /^\d+$/.test(id)) ? Number(id) : id;
        const structure = await StructureLibrary.getStructureById(lookupId);
        if (!structure) {
            StructureLibrary.showNotification('Structure not found', 'error');
            return;
        }

        if (window.AppState) {
            window.AppState.selectedTemplate = structure.type;
        }

        navigateToPage('designer');

        if (typeof loadTemplate === 'function') {
            loadTemplate(structure.type);
        }

        if (structure.dimensions) {
            const sys = window.AppState?.unitSystem || 'metric';
            Object.entries(structure.dimensions).forEach(([key, val]) => {
                const input = typeof getDesignInput === 'function'
                    ? getDesignInput(key)
                    : (document.getElementById(`design_${key}`) || document.getElementById(key));
                if (!input) return;

                if (input.type === 'checkbox') {
                    input.checked = Boolean(val);
                } else if (input.tagName === 'SELECT') {
                    input.value = String(val);
                } else {
                    const numSI = parseFloat(val);
                    if (Number.isFinite(numSI)) {
                        const unitType = input.dataset.unitType || 'dimensionless';
                        input.dataset.siValue = String(numSI);
                        input.value = (sys === 'imperial' && typeof UnitConverter !== 'undefined')
                            ? String(parseFloat(UnitConverter.fromSI(numSI, unitType, 'imperial').toFixed(3)))
                            : String(numSI);
                    }
                }
            });

            // Trigger derived display updates without resetting custom armour props
            const dnInput = typeof getDesignInput === 'function' ? getDesignInput('armourDn50') : null;
            if (dnInput) {
                dnInput.dispatchEvent(new Event('change'));
            }
        }

        if (typeof drawStructureOnCanvas === 'function') {
            drawStructureOnCanvas(structure.type);
        }
        if (typeof performStructureAnalysis === 'function') {
            performStructureAnalysis();
        }

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
        'rubble-bullnose': '🧱',
        'rubble-berm': '🌊',
        'rubble-reef': '🪸',
        'rubble-low': '📉',
        'rubble-revetment': '🏖️',
        'vertical-wall': '🏢',
        'vertical-composite': '🏗️',
        'vertical-caisson': '📦',
        'vertical-perforated': '⬜',
        'custom': '✏️'
    };
    return icons[type] || '🏗️';
}

function formatTypeName(type) {
    return (type || 'structure')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Recent';
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
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
function _collectDesignerDimensionsSI() {
    const dimensions = {};
    const paramInputs = document.getElementById('parameterInputs');
    if (!paramInputs) return dimensions;

    const sys = window.AppState?.unitSystem || 'metric';
    paramInputs.querySelectorAll('[data-param-id]').forEach(ctrl => {
        const paramId = ctrl.dataset.paramId;
        if (!paramId) return;

        if (ctrl.type === 'checkbox') {
            dimensions[paramId] = Boolean(ctrl.checked);
        } else if (ctrl.tagName === 'SELECT') {
            dimensions[paramId] = ctrl.value;
        } else if (!ctrl.readOnly) {
            if (ctrl.dataset.siValue !== undefined && ctrl.dataset.siValue !== '') {
                const cached = parseFloat(ctrl.dataset.siValue);
                if (Number.isFinite(cached)) {
                    dimensions[paramId] = cached;
                    return;
                }
            }
            const raw = parseFloat(ctrl.value);
            if (Number.isFinite(raw)) {
                const unitType = ctrl.dataset.unitType || 'dimensionless';
                dimensions[paramId] = typeof UnitConverter !== 'undefined'
                    ? UnitConverter.toSI(raw, unitType, sys)
                    : raw;
            }
        }
    });

    return dimensions;
}

async function saveCurrentStructureData(metadata = {}) {
    const templateType = window.AppState?.selectedTemplate || 'rubble-standard';
    const name = (metadata.name || '').trim() || 'My Coastal Structure';
    const tags = Array.isArray(metadata.tags)
        ? metadata.tags
        : String(metadata.tags || '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

    const dimensions = _collectDesignerDimensionsSI();
    const structure = new StructureLibrary.CoastalStructure({
        name,
        type: templateType,
        dimensions,
        projectName: (metadata.projectName || '').trim(),
        location: (metadata.location || '').trim(),
        description: (metadata.description || '').trim(),
        tags,
        status: metadata.status || 'draft'
    });

    try {
        const canvas = document.getElementById('designCanvas');
        if (canvas) {
            structure.thumbnail = canvas.toDataURL('image/png');
        }

        const id = await StructureLibrary.saveStructure(structure);
        StructureLibrary.showNotification('Structure saved to library!', 'success');

        if (window.AppState?.currentPage === 'library') {
            await loadAndDisplayStructures();
        }

        if (typeof loadRecentProjects === 'function') {
            await loadRecentProjects();
        }

        return id;
    } catch (error) {
        console.error('Failed to save structure:', error);
        StructureLibrary.showNotification('Failed to save structure', 'error');
        return null;
    }
}

function saveCurrentStructureToLibrary() {
    const modal = document.getElementById('saveLibraryModal');
    if (!modal) {
        return saveCurrentStructureData({ name: 'My Coastal Structure' });
    }

    const currentProject = window.projectManager?.getCurrentProject?.();
    const nameEl = document.getElementById('saveStructName');
    const projEl = document.getElementById('saveStructProject');
    const locEl = document.getElementById('saveStructLocation');
    const descEl = document.getElementById('saveStructDesc');
    const tagsEl = document.getElementById('saveStructTags');
    const statusEl = document.getElementById('saveStructStatus');

    if (nameEl && !nameEl.value.trim()) nameEl.value = 'My Coastal Structure';
    if (projEl && currentProject?.name && !projEl.value) projEl.value = currentProject.name;
    if (locEl && currentProject?.location && !locEl.value) locEl.value = currentProject.location;
    if (descEl) descEl.value = '';
    if (tagsEl) tagsEl.value = '';
    if (statusEl) statusEl.value = 'draft';

    if (typeof openModal === 'function') {
        openModal('saveLibraryModal');
    } else {
        modal.classList.add('active');
    }
    nameEl?.focus();
}

function _bindSaveLibraryModalEvents() {
    const modal = document.getElementById('saveLibraryModal');
    if (!modal || modal.dataset.bound === 'true') return;
    modal.dataset.bound = 'true';

    const closeSave = () => {
        if (typeof closeModal === 'function') {
            closeModal('saveLibraryModal');
        } else {
            modal.classList.remove('active');
        }
    };

    document.getElementById('closeSaveLibraryModal')?.addEventListener('click', closeSave);
    document.getElementById('cancelSaveLibraryBtn')?.addEventListener('click', closeSave);
    document.getElementById('confirmSaveLibraryBtn')?.addEventListener('click', async () => {
        const name = document.getElementById('saveStructName')?.value?.trim() || 'My Coastal Structure';
        const projectName = document.getElementById('saveStructProject')?.value || '';
        const location = document.getElementById('saveStructLocation')?.value || '';
        const description = document.getElementById('saveStructDesc')?.value || '';
        const tags = document.getElementById('saveStructTags')?.value || '';
        const status = document.getElementById('saveStructStatus')?.value || 'draft';

        await saveCurrentStructureData({ name, projectName, location, description, tags, status });
        closeSave();
    });
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
window.saveCurrentStructureData = saveCurrentStructureData;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    _bindSaveLibraryModalEvents();

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
