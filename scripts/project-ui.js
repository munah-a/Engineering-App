/**
 * Project UI Manager
 * Handles the user interface for the Project Management system
 */

class ProjectUIManager {
    constructor() {
        this.container = document.getElementById('projectsGrid');
        this.searchInput = document.getElementById('projectSearch');
        this.createBtn = document.getElementById('createNewProjectBtn');

        this.init();
    }

    init() {
        console.log('ProjectUIManager initializing...');

        // Use event delegation since the button might be dynamically created
        document.addEventListener('click', (e) => {
            // Check if the click is on the create button or its children
            const createBtn = e.target.closest('#createNewProjectBtn');
            if (createBtn) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Create button clicked via delegation!');
                this.showCreateProjectModal();
                return false;
            }
        }, true); // Use capture phase to intercept before other handlers

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.renderProjects(e.target.value));
        }

        // Listen for navigation to projects page
        document.querySelectorAll('[data-navigate="projects"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.renderProjects();
            });
        });

        // Initial render if we are on projects page (though default is dashboard)
        if (document.getElementById('projects')?.classList.contains('active')) {
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
            this.container.innerHTML = `<div class="error-message">Error loading projects: ${error.message}</div>`;
        }
    }

    createProjectCard(project) {
        const div = document.createElement('div');
        div.className = 'feature-card project-card';
        div.onclick = () => this.openProject(project.id);

        const lastModified = new Date(project.dateModified).toLocaleDateString();
        const structureCount = project.structures ? project.structures.length : 0;

        div.innerHTML = `
            <div class="card-header">
                <div class="feature-icon project-icon">📁</div>
                <div class="card-actions">
                    <button class="icon-btn delete-project" title="Delete Project">🗑️</button>
                </div>
            </div>
            <h3>${project.name}</h3>
            <p class="client-location">${project.client ? project.client : 'No Client'} • ${project.location ? project.location : 'No Location'}</p>
            <p class="description">${project.description || 'No description'}</p>
            
            <div class="card-meta">
                <span class="meta-item">
                    <span class="label">Structures</span>
                    <span class="value">${structureCount}</span>
                </span>
                <span class="meta-item">
                    <span class="label">Last Modified</span>
                    <span class="value">${lastModified}</span>
                </span>
            </div>
            
            <div class="status-badge ${project.status}">${project.status}</div>
        `;

        // Handle delete specifically
        const deleteBtn = div.querySelector('.delete-project');
        if (deleteBtn) {
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                    window.projectManager.deleteProject(project.id).then(() => {
                        this.renderProjects(this.searchInput?.value);
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
                    <p>No projects found matching "${query}"</p>
                </div>
            `;
        } else {
            this.container.innerHTML = `
                <div class="empty-library-state">
                    <div class="empty-icon">📂</div>
                    <h3>No Projects Yet</h3>
                    <p>Create a new project to start organizing your engineering designs.</p>
                    <button class="btn-primary" onclick="document.getElementById('createNewProjectBtn').click()">
                        Create New Project
                    </button>
                </div>
            `;
        }
    }

    async openProject(projectId) {
        try {
            await window.projectManager.loadProject(projectId);
            // Navigate to Dashboard or Project Overview
            // For now, let's just show an alert or toast, and maybe navigate to Library (filtered?)
            // Or better: Navigate to Dashboard which should now show Project Context

            // Update Dashboard Context
            this.updateDashboardContext();

            // Navigate to dashboard
            navigateToPage('dashboard');

        } catch (error) {
            console.error('Error opening project:', error);
            alert('Failed to open project');
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
        this.renderProjects(this.searchInput?.value || '');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for project manager to be ready
    setTimeout(() => {
        window.projectUI = new ProjectUIManager();
    }, 500);
});
