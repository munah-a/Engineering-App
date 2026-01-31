// ==========================================
// STRUCTURE LIBRARY MANAGEMENT SYSTEM
// ==========================================

// Database configuration
const DB_NAME = 'CoastalEngineerDB';
const DB_VERSION = 1;
const STORE_NAME = 'structures';

let db = null;

// ==========================================
// INDEXEDDB INITIALIZATION
// ==========================================
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database failed to open');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });

                // Create indexes for efficient searching
                objectStore.createIndex('name', 'name', { unique: false });
                objectStore.createIndex('type', 'type', { unique: false });
                objectStore.createIndex('dateCreated', 'dateCreated', { unique: false });
                objectStore.createIndex('dateModified', 'dateModified', { unique: false });
                objectStore.createIndex('status', 'status', { unique: false });
                objectStore.createIndex('projectName', 'projectName', { unique: false });

                console.log('Object store created');
            }
        };
    });
}

// ==========================================
// STRUCTURE DATA MODEL
// ==========================================
class CoastalStructure {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || 'Untitled Structure';
        this.type = data.type || 'rubble-standard'; // rubble-standard, vertical-wall, etc.
        this.description = data.description || '';

        // Dimensional parameters
        this.dimensions = data.dimensions || {};

        // Material specifications
        this.materials = data.materials || {};

        // Design criteria
        this.designCriteria = data.designCriteria || {};

        // Metadata
        this.projectName = data.projectName || '';
        this.location = data.location || '';
        this.engineerName = data.engineerName || '';
        this.engineerNotes = data.engineerNotes || '';
        this.tags = data.tags || [];

        // Status and dates
        this.status = data.status || 'draft'; // draft, approved, archived
        this.dateCreated = data.dateCreated || new Date().toISOString();
        this.dateModified = data.dateModified || new Date().toISOString();
        this.version = data.version || 1;

        // Thumbnail (base64 encoded image)
        this.thumbnail = data.thumbnail || null;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            dimensions: this.dimensions,
            materials: this.materials,
            designCriteria: this.designCriteria,
            projectName: this.projectName,
            location: this.location,
            engineerName: this.engineerName,
            engineerNotes: this.engineerNotes,
            tags: this.tags,
            status: this.status,
            dateCreated: this.dateCreated,
            dateModified: this.dateModified,
            version: this.version,
            thumbnail: this.thumbnail
        };
    }
}

// ==========================================
// CRUD OPERATIONS
// ==========================================

// Create - Add new structure
async function saveStructure(structure) {
    if (!db) await initDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        structure.dateModified = new Date().toISOString();

        // Get JSON representation
        const structureData = structure.toJSON();

        // Remove id if it's null or undefined (for new structures with autoIncrement)
        if (structureData.id === null || structureData.id === undefined) {
            delete structureData.id;
        }

        const request = structure.id
            ? objectStore.put(structureData)
            : objectStore.add(structureData);

        request.onsuccess = () => {
            console.log('Structure saved successfully', request.result);
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('Error saving structure', request.error);
            reject(request.error);
        };
    });
}

// Read - Get all structures
async function getAllStructures() {
    if (!db) await initDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Read - Get structure by ID
async function getStructureById(id) {
    if (!db) await initDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Update - Handled by saveStructure with existing ID

// Delete - Remove structure
async function deleteStructure(id) {
    if (!db) await initDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            console.log('Structure deleted successfully');
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// ==========================================
// SEARCH AND FILTER
// ==========================================
async function searchStructures(query = '', filters = {}) {
    const allStructures = await getAllStructures();

    let results = allStructures;

    // Filter by type
    if (filters.type && filters.type !== 'all') {
        results = results.filter(s => s.type === filters.type);
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
        results = results.filter(s => s.status === filters.status);
    }

    // Search by name, project, or tags
    if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.projectName.toLowerCase().includes(lowerQuery) ||
            s.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    return results;
}

// ==========================================
// EXPORT/IMPORT FUNCTIONALITY
// ==========================================

// Export single structure as JSON
function exportStructureAsJSON(structure) {
    const dataStr = JSON.stringify(structure, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${structure.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export entire library
async function exportLibrary() {
    const structures = await getAllStructures();
    const dataStr = JSON.stringify(structures, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `structure_library_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Import structures from JSON
async function importStructures(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const structures = Array.isArray(data) ? data : [data];

                const imported = [];
                for (const structureData of structures) {
                    // Remove ID to create new entries
                    delete structureData.id;
                    const structure = new CoastalStructure(structureData);
                    const id = await saveStructure(structure);
                    imported.push(id);
                }

                resolve(imported);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

// ==========================================
// DUPLICATE STRUCTURE
// ==========================================
async function duplicateStructure(id) {
    const original = await getStructureById(id);
    if (!original) return null;

    const duplicate = new CoastalStructure({
        ...original,
        id: null, // Remove ID to create new entry
        name: `${original.name} (Copy)`,
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        status: 'draft'
    });

    return await saveStructure(duplicate);
}

// ==========================================
// AUTO-SAVE FUNCTIONALITY
// ==========================================
let autoSaveTimer = null;
const AUTO_SAVE_DELAY = 3000; // 3 seconds

function scheduleAutoSave(structure) {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }

    autoSaveTimer = setTimeout(async () => {
        try {
            await saveStructure(structure);
            showNotification('Auto-saved successfully', 'success');
        } catch (error) {
            console.error('Auto-save failed:', error);
            showNotification('Auto-save failed', 'error');
        }
    }, AUTO_SAVE_DELAY);
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        background: var(--color-surface);
        border: 1px solid ${type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-danger)' : 'var(--color-info)'};
        color: var(--color-text);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// EXPORT PUBLIC API
// ==========================================
window.StructureLibrary = {
    initDatabase,
    CoastalStructure,
    saveStructure,
    getAllStructures,
    getStructureById,
    deleteStructure,
    searchStructures,
    exportStructureAsJSON,
    exportLibrary,
    importStructures,
    duplicateStructure,
    scheduleAutoSave,
    showNotification
};

// Initialize database on load
initDatabase().catch(err => console.error('Failed to initialize database:', err));
