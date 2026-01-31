// ==========================================
// PROJECT-BASED WORKFLOW SYSTEM
// Multi-structure project management as per features.md lines 215-363
// ==========================================

// ==========================================
// PROJECT DATA MODEL
// ==========================================

class CoastalProject {
    constructor(data = {}) {
        // Project metadata
        this.id = data.id || this.generateId();
        this.name = data.name || 'Untitled Project';
        this.description = data.description || '';

        // Client and location information
        this.client = data.client || '';
        this.location = data.location || '';
        this.coordinates = data.coordinates || { lat: null, lon: null };

        // Design information
        this.designDate = data.designDate || new Date().toISOString();
        this.engineerName = data.engineerName || '';
        this.companyName = data.companyName || '';
        this.projectNumber = data.projectNumber || '';

        // Design standards and codes
        this.designStandards = data.designStandards || ['CIRIA', 'CEM', 'EurOtop'];
        this.designLife = data.designLife || 50;

        // Global parameters (referenced from GlobalParameterManager)
        this.globalParameters = data.globalParameters || {};

        // Wave Analysis (shared across all structures in project)
        this.waveAnalysis = data.waveAnalysis || null;

        // Structures array (children of this project)
        this.structures = data.structures || [];

        // Structure Analyses (detailed results for each structure)
        // Format: { structureId: { stability: {...}, serviceability: {...}, diagram: base64Image } }
        this.structureAnalyses = data.structureAnalyses || {};

        // Project status
        this.status = data.status || 'draft'; // draft, in-progress, approved, archived

        // Timestamps
        this.dateCreated = data.dateCreated || new Date().toISOString();
        this.dateModified = data.dateModified || new Date().toISOString();

        // Version control
        this.version = data.version || 1;
        this.versionHistory = data.versionHistory || [];
    }

    generateId() {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add structure to project
    addStructure(structure) {
        structure.projectId = this.id;
        this.structures.push(structure);
        this.dateModified = new Date().toISOString();
    }

    // Remove structure from project
    removeStructure(structureId) {
        const index = this.structures.findIndex(s => s.id === structureId);
        if (index > -1) {
            this.structures.splice(index, 1);
            this.dateModified = new Date().toISOString();
            return true;
        }
        return false;
    }

    // Get structure by ID
    getStructure(structureId) {
        return this.structures.find(s => s.id === structureId);
    }

    // Get structures by type
    getStructuresByType(type) {
        return this.structures.filter(s => s.type === type);
    }

    // Get structures by status
    getStructuresByStatus(status) {
        return this.structures.filter(s => s.status === status);
    }

    // Calculate project summary
    getSummary() {
        const summary = {
            totalStructures: this.structures.length,
            byType: {},
            byStatus: {},
            totalQuantities: {
                armourTonnage: 0,
                concreteVolume: 0,
                filterTonnage: 0
            },
            estimatedCost: 0
        };

        this.structures.forEach(structure => {
            // Count by type
            summary.byType[structure.type] = (summary.byType[structure.type] || 0) + 1;

            // Count by status
            summary.byStatus[structure.status] = (summary.byStatus[structure.status] || 0) + 1;

            // Sum quantities (if available)
            if (structure.quantities) {
                summary.totalQuantities.armourTonnage += structure.quantities.armourTonnage || 0;
                summary.totalQuantities.concreteVolume += structure.quantities.concreteVolume || 0;
                summary.totalQuantities.filterTonnage += structure.quantities.filterTonnage || 0;
            }

            // Sum costs (if available)
            if (structure.estimatedCost) {
                summary.estimatedCost += structure.estimatedCost;
            }
        });

        return summary;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            client: this.client,
            location: this.location,
            coordinates: this.coordinates,
            designDate: this.designDate,
            engineerName: this.engineerName,
            companyName: this.companyName,
            projectNumber: this.projectNumber,
            designStandards: this.designStandards,
            designLife: this.designLife,
            globalParameters: this.globalParameters,
            waveAnalysis: this.waveAnalysis,
            structures: this.structures,
            structureAnalyses: this.structureAnalyses,
            status: this.status,
            dateCreated: this.dateCreated,
            dateModified: this.dateModified,
            version: this.version,
            versionHistory: this.versionHistory
        };
    }
}

// ==========================================
// PROJECT MANAGER
// ==========================================

class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.projects = [];
        this.db = null;
        this.DB_NAME = 'CoastalEngineerProjectDB';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'projects';
    }

    // ==========================================
    // DATABASE INITIALIZATION
    // ==========================================

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open project database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Project database initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });

                    // Create indexes
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('client', 'client', { unique: false });
                    objectStore.createIndex('status', 'status', { unique: false });
                    objectStore.createIndex('dateModified', 'dateModified', { unique: false });
                    objectStore.createIndex('dateCreated', 'dateCreated', { unique: false });

                    console.log('Project object store created');
                }
            };
        });
    }

    // ==========================================
    // PROJECT CRUD OPERATIONS
    // ==========================================

    async createProject(projectData) {
        const project = new CoastalProject(projectData);

        // Initialize global parameters from current manager state
        if (window.globalParamManager) {
            project.globalParameters = window.globalParamManager.exportParameters();
        }

        await this.saveProject(project);
        this.currentProject = project;

        return project;
    }

    async saveProject(project) {
        if (!(project instanceof CoastalProject)) {
            project = new CoastalProject(project);
        }

        project.dateModified = new Date().toISOString();

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            const request = objectStore.put(project.toJSON());

            request.onsuccess = () => {
                console.log(`Project saved: ${project.name}`);
                resolve(project);
            };

            request.onerror = () => {
                console.error('Error saving project');
                reject(request.error);
            };
        });
    }

    async getAllProjects() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                this.projects = request.result.map(data => new CoastalProject(data));
                resolve(this.projects);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getProjectById(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            const request = objectStore.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(new CoastalProject(request.result));
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async deleteProject(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(this.STORE_NAME);
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                console.log('Project deleted');
                if (this.currentProject && this.currentProject.id === id) {
                    this.currentProject = null;
                }
                resolve(true);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // ==========================================
    // CURRENT PROJECT MANAGEMENT
    // ==========================================

    async loadProject(id) {
        const project = await this.getProjectById(id);
        if (project) {
            this.currentProject = project;

            // Load global parameters into manager
            if (window.globalParamManager && project.globalParameters) {
                window.globalParamManager.importParameters(project.globalParameters);
            }
        }
        return project;
    }

    async saveCurrentProject() {
        if (!this.currentProject) {
            throw new Error('No current project to save');
        }

        // Update global parameters
        if (window.globalParamManager) {
            this.currentProject.globalParameters = window.globalParamManager.exportParameters();
        }

        return await this.saveProject(this.currentProject);
    }

    getCurrentProject() {
        return this.currentProject;
    }

    // ==========================================
    // STRUCTURE MANAGEMENT WITHIN PROJECT
    // ==========================================

    addStructureToCurrentProject(structureData) {
        if (!this.currentProject) {
            throw new Error('No current project');
        }

        // Use existing structure library structure format
        if (window.StructureLibrary && window.StructureLibrary.CoastalStructure) {
            const structure = new window.StructureLibrary.CoastalStructure(structureData);
            this.currentProject.addStructure(structure);
        } else {
            this.currentProject.addStructure(structureData);
        }

        return this.saveCurrentProject();
    }

    removeStructureFromCurrentProject(structureId) {
        if (!this.currentProject) {
            throw new Error('No current project');
        }

        const removed = this.currentProject.removeStructure(structureId);
        if (removed) {
            return this.saveCurrentProject();
        }
        return Promise.resolve(false);
    }

    updateStructureInCurrentProject(structureId, updates) {
        if (!this.currentProject) {
            throw new Error('No current project');
        }

        const structure = this.currentProject.getStructure(structureId);
        if (structure) {
            Object.assign(structure, updates);
            structure.dateModified = new Date().toISOString();
            return this.saveCurrentProject();
        }

        return Promise.resolve(false);
    }

    // ==========================================
    // WAVE ANALYSIS MANAGEMENT
    // ==========================================

    saveWaveAnalysisToCurrentProject(waveData) {
        if (!this.currentProject) {
            throw new Error('No current project');
        }

        this.currentProject.waveAnalysis = {
            ...waveData,
            timestamp: new Date().toISOString()
        };

        return this.saveCurrentProject();
    }

    // ==========================================
    // STRUCTURE ANALYSIS MANAGEMENT
    // ==========================================

    saveStructureAnalysisToCurrentProject(structureId, analysisData) {
        if (!this.currentProject) {
            throw new Error('No current project');
        }

        this.currentProject.structureAnalyses[structureId] = {
            ...analysisData,
            timestamp: new Date().toISOString()
        };

        return this.saveCurrentProject();
    }

    getStructureAnalysis(structureId) {
        if (!this.currentProject) {
            return null;
        }
        return this.currentProject.structureAnalyses[structureId];
    }

    // ==========================================
    // EXPORT/IMPORT
    // ==========================================

    exportProjectAsJSON(project) {
        const blob = new Blob([JSON.stringify(project.toJSON(), null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importProjectFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Create new project from imported data
                    const project = new CoastalProject(data);

                    // Generate new ID to avoid conflicts
                    project.id = project.generateId();
                    project.name += ' (Imported)';

                    await this.saveProject(project);
                    resolve(project);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // ==========================================
    // SEARCH AND FILTER
    // ==========================================

    async searchProjects(query = '', filters = {}) {
        const allProjects = await this.getAllProjects();

        return allProjects.filter(project => {
            // Search in name, client, location
            if (query) {
                const searchStr = query.toLowerCase();
                const matchesSearch =
                    project.name.toLowerCase().includes(searchStr) ||
                    project.client.toLowerCase().includes(searchStr) ||
                    project.location.toLowerCase().includes(searchStr);

                if (!matchesSearch) return false;
            }

            // Filter by status
            if (filters.status && filters.status !== 'all') {
                if (project.status !== filters.status) return false;
            }

            return true;
        });
    }
}

// ==========================================
// EXPORT
// ==========================================

window.CoastalProject = CoastalProject;
window.ProjectManager = ProjectManager;

// Initialize project manager
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.projectManager) {
        window.projectManager = new ProjectManager();
        try {
            await window.projectManager.initDatabase();
            console.log('Project Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Project Manager:', error);
        }
    }
});
