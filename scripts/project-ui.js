/**
 * Project UI Manager
 * Handles the user interface for the Project Management system
 */

const _escProjectHtml = (val) => {
    if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
        return window.escapeHtml(val);
    }
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

class ProjectUIManager {
    constructor() {
        this.container = document.getElementById('projectsGrid');
        this.searchInput = document.getElementById('projectSearch');
        this.createBtn = document.getElementById('createNewProjectBtn');

        this.init();
    }

    init() {
        console.log('ProjectUIManager initializing...');

        document.addEventListener('click', (e) => {
            const createBtn = e.target.closest('#createNewProjectBtn, .empty-create-project-btn');
            if (createBtn) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.showCreateProjectModal();
                return false;
            }
        }, true);

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.renderProjects(e.target.value));
        }

        document.querySelectorAll('[data-navigate="projects"], [data-navigate="dashboard"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.renderProjects(this.searchInput?.value || '');
            });
        });

        // Initial render whenever #projectsGrid is present in DOM (including Dashboard)
        if (this.container) {
            this.renderProjects();
        }
    }

    async renderProjects(query = '') {
        if (!window.projectManager || !this.container) return;

        this.container.innerHTML = '<div class="loading-spinner">Loading projects...</div>';

        try {
            const projects = await window.projectManager.searchProjects(query);

            this.container.innerHTML = '';

            if (projects.length === 0) {
                this.renderEmptyState(query);
                return;
            }

            projects.forEach(project => {
                const card = this.createProjectCard(project);
                this.container.appendChild(card);
            });

        } catch (error) {
            console.error('Error rendering projects:', error);
            this.container.innerHTML = `<div class="error-message">Error loading projects: ${_escProjectHtml(error.message)}</div>`;
        }
    }

    createProjectCard(project) {
        const div = document.createElement('div');
        div.className = 'feature-card project-card';
        div.onclick = () => this.openProject(project.id);

        const lastModified = new Date(project.dateModified).toLocaleDateString();
        const structureCount = project.structures ? project.structures.length : 0;
        const safeStatus = _escProjectHtml(project.status || 'draft');

        div.innerHTML = `
            <div class="card-header">
                <div class="feature-icon project-icon">📁</div>
                <div class="card-actions">
                    <button type="button" class="icon-btn delete-project" title="Delete Project">🗑️</button>
                </div>
            </div>
            <h3>${_escProjectHtml(project.name)}</h3>
            <p class="client-location">${_escProjectHtml(project.client || 'No Client')} • ${_escProjectHtml(project.location || 'No Location')}</p>
            <p class="description">${_escProjectHtml(project.description || 'No description')}</p>

            <div class="card-meta">
                <span class="meta-item">
                    <span class="label">Structures</span>
                    <span class="value">${structureCount}</span>
                </span>
                <span class="meta-item">
                    <span class="label">Last Modified</span>
                    <span class="value">${_escProjectHtml(lastModified)}</span>
                </span>
            </div>

            <div class="status-badge ${safeStatus}">${safeStatus}</div>
        `;

        const deleteBtn = div.querySelector('.delete-project');
        if (deleteBtn) {
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                    window.projectManager.deleteProject(project.id).then(() => {
                        this.renderProjects(this.searchInput?.value || '');
                    });
                }
            };
        }

        return div;
    }

    renderEmptyState(query) {
        if (query) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>No projects found matching "${_escProjectHtml(query)}"</p>
                </div>
            `;
        } else {
            this.container.innerHTML = `
                <div class="empty-library-state">
                    <div class="empty-icon">📂</div>
                    <h3>No Projects Yet</h3>
                    <p>Create a new project to start organizing your coastal engineering designs.</p>
                    <button type="button" class="btn-primary empty-create-project-btn">
                        Create New Project
                    </button>
                </div>
            `;
        }
    }

    async openProject(projectId) {
        try {
            const project = await window.projectManager.loadProject(projectId);
            this.updateDashboardContext();

            if (project && window.AppState) {
                window.AppState.projectData = {
                    name: project.name || '',
                    location: project.location || '',
                    engineer: project.engineerName || '',
                    company: project.companyName || ''
                };
                if (project.waveAnalysis) {
                    window.AppState.waveData = project.waveAnalysis;
                }
                const setVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el && val) el.value = val;
                };
                setVal('projectName', project.name);
                setVal('projectLocation', project.location);
                setVal('engineerName', project.engineerName);
                setVal('companyName', project.companyName);
            }

            if (typeof navigateToPage === 'function') {
                navigateToPage('dashboard');
            }
        } catch (error) {
            console.error('Error opening project:', error);
            if (typeof StructureLibrary !== 'undefined') {
                StructureLibrary.showNotification('Failed to open project', 'error');
            }
        }
    }

    updateDashboardContext() {
        // Find dashboard header and update it
        const header = document.querySelector('#dashboard .page-header');
        const currentProject = window.projectManager.getCurrentProject();

        if (header && currentProject) {
            header.querySelector('h1').textContent = currentProject.name;
            header.querySelector('p').textContent = `${currentProject.client} | ${currentProject.location}`;
        }
    }

    showCreateProjectModal() {
        console.log('showCreateProjectModal called');
        console.log('projectWizard available:', window.projectWizard);

        // Launch the project creation wizard
        if (window.projectWizard) {
            console.log('Launching wizard...');
            window.projectWizard.start();

            // Wire up wizard navigation buttons
            document.getElementById('wizardNextBtn').onclick = () => window.projectWizard.nextStep();
            document.getElementById('wizardPrevBtn').onclick = () => window.projectWizard.previousStep();
            document.getElementById('closeWizardModal').onclick = () => window.projectWizard.hideWizardModal();
        } else {
            console.error('Project wizard not initialized');
            alert('Project wizard is not ready. Please refresh the page.');
        }
    }

    refreshProjectList() {
        return this.renderProjects(this.searchInput?.value || '');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for project manager to be ready
    setTimeout(() => {
        window.projectUI = new ProjectUIManager();
    }, 500);
});
