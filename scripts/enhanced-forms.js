// ==========================================
// ENHANCED FORM BUILDER
// Utilities to create forms with tooltips and parameter management
// ==========================================

class EnhancedFormBuilder {
    constructor(containerId, moduleId) {
        this.container = document.getElementById(containerId);
        this.moduleId = moduleId || 'default-module';
        this.formData = {};
    }

    /**
     * Create an input field with tooltip and parameter binding
DESCRIPTION = tooltipKey;
     * @param {string} paramCategory - Parameter category from global manager
     * @param {string} paramName - Parameter name
     * @param {object} options - Additional options
     */
    addParameterInput(paramCategory, paramName, options = {}) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        // Create label with tooltip
        const label = document.createElement('label');
        label.textContent = options.label || paramName;
        label.setAttribute('data-tooltip-key', options.tooltipKey || paramName);

        // Get parameter value from global manager
        let paramValue = '';
        let unit = '';
        let isOverridden = false;

        if (window.globalParamManager) {
            const param = window.globalParamManager.getParameter(
                paramCategory,
                paramName,
                this.moduleId
            );

            if (param) {
                paramValue = param.value;
                unit = param.unit;
                isOverridden = param.isOverridden;
            }
        }

        // Create input wrapper
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'parameter-input-wrapper';
        if (isOverridden) {
            inputWrapper.classList.add('has-override');
        }

        // Create input with unit
        const inputWithUnit = document.createElement('div');
        inputWithUnit.className = 'input-with-unit';

        const input = document.createElement('input');
        input.type = options.type || 'number';
        input.id = `${this.moduleId}-${paramName}`;
        input.value = paramValue;
        input.step = options.step || '0.1';

        if (options.readonly) {
            input.readOnly = true;
        }

        // Add input event listener to update global/local parameter
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);

            if (options.localOverride && window.globalParamManager) {
                // Set as local override
                window.globalParamManager.setLocalOverride(
                    this.moduleId,
                    paramCategory,
                    paramName,
                    value
                );
                inputWrapper.classList.add('has-override');
                this.updateOverrideBadge(inputWrapper, paramCategory, paramName);
            } else if (window.globalParamManager) {
                // Update global parameter
                window.globalParamManager.setGlobalParameter(
                    paramCategory,
                    paramName,
                    value
                );
            }

            this.formData[paramName] = value;

            // Trigger custom event
            this.container.dispatchEvent(new CustomEvent('parameterChanged', {
                detail: { paramCategory, paramName, value }
            }));
        });

        const unitSpan = document.createElement('span');
        unitSpan.className = 'unit';
        unitSpan.textContent = unit;

        inputWithUnit.appendChild(input);
        inputWithUnit.appendChild(unitSpan);
        inputWrapper.appendChild(inputWithUnit);

        // Add override badge if exists
        if (isOverridden) {
            const badge = window.globalParamManager.createOverrideIndicator(
                paramCategory,
                paramName,
                this.moduleId
            );
            if (badge) {
                inputWrapper.appendChild(badge);
            }
        }

        // Add reset button if this supports local overrides
        if (options.allowOverride) {
            const resetBtn = window.globalParamManager.createResetButton(
                paramCategory,
                paramName,
                this.moduleId,
                () => {
                    // Reload value from global
                    const param = window.globalParamManager.getParameter(
                        paramCategory,
                        paramName,
                        this.moduleId
                    );
                    input.value = param.value;
                    inputWrapper.classList.remove('has-override');

                    // Remove override badge
                    const badge = inputWrapper.querySelector('.parameter-override-badge');
                    if (badge) badge.remove();

                    // Trigger event
                    this.container.dispatchEvent(new CustomEvent('overrideRemoved', {
                        detail: { paramCategory, paramName }
                    }));
                }
            );
            inputWrapper.appendChild(resetBtn);
        }

        // Add help text if provided
        if (options.helpText) {
            const helpText = document.createElement('small');
            helpText.className = 'help-text';
            helpText.textContent = options.helpText;
            formGroup.appendChild(label);
            formGroup.appendChild(inputWrapper);
            formGroup.appendChild(helpText);
        } else {
            formGroup.appendChild(label);
            formGroup.appendChild(inputWrapper);
        }

        this.container.appendChild(formGroup);

        // Attach tooltip after DOM insertion
        if (window.tooltipManager && options.tooltipKey) {
            window.tooltipManager.attachTooltip(label, options.tooltipKey);
        }

        return input;
    }

    updateOverrideBadge(wrapper, paramCategory, paramName) {
        // Remove existing badge
        const existingBadge = wrapper.querySelector('.parameter-override-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add new badge
        if (window.globalParamManager) {
            const badge = window.globalParamManager.createOverrideIndicator(
                paramCategory,
                paramName,
                this.moduleId
            );
            if (badge) {
                const inputWithUnit = wrapper.querySelector('.input-with-unit');
                inputWithUnit.after(badge);
            }
        }
    }

    /**
     * Add a section header
     */
    addSection(title, description = '') {
        const section = document.createElement('div');
        section.className = 'panel-section';

        const header = document.createElement('h3');
        header.textContent = title;
        section.appendChild(header);

        if (description) {
            const desc = document.createElement('p');
            desc.className = 'section-description';
            desc.textContent = description;
            desc.style.color = 'var(--color-text-muted)';
            desc.style.fontSize = '0.9rem';
            desc.style.marginBottom = 'var(--spacing-lg)';
            section.appendChild(desc);
        }

        this.container.appendChild(section);
        return section;
    }

    /**
     * Add a select dropdown
     */
    addSelect(label, options, selectedValue = '', tooltipKey = null) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        if (tooltipKey) {
            labelElement.setAttribute('data-tooltip-key', tooltipKey);
        }

        const select = document.createElement('select');

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        formGroup.appendChild(labelElement);
        formGroup.appendChild(select);
        this.container.appendChild(formGroup);

        if (window.tooltipManager && tooltipKey) {
            window.tooltipManager.attachTooltip(labelElement, tooltipKey);
        }

        return select;
    }

    /**
     * Add a button
     */
    addButton(text, className = 'btn-primary btn-large', onClick = null) {
        const button = document.createElement('button');
        button.className = className;
        button.textContent = text;

        if (onClick) {
            button.addEventListener('click', onClick);
        }

        this.container.appendChild(button);
        return button;
    }

    /**
     * Clear all form contents
     */
    clear() {
        this.container.innerHTML = '';
        this.formData = {};
    }

    /**
     * Get all form data
     */
    getData() {
        return this.formData;
    }
}

// ==========================================
// RESULT DISPLAY BUILDER
// ==========================================

class ResultDisplayBuilder {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    addResultCard(title, results = []) {
        const card = document.createElement('div');
        card.className = 'results-card';

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        card.appendChild(titleElement);

        results.forEach(result => {
            this.addResultItem(card, result);
        });

        this.container.appendChild(card);
        return card;
    }

    addResultItem(parent, result) {
        const item = document.createElement('div');
        item.className = `result-item ${result.highlight ? 'highlight' : ''}`;

        const label = document.createElement('span');
        label.className = 'result-label';
        label.textContent = result.label;

        // Add tooltip if specified
        if (result.tooltipKey && window.tooltipManager) {
            label.setAttribute('data-tooltip-key', result.tooltipKey);
            window.tooltipManager.attachTooltip(label, result.tooltipKey);
        }

        const value = document.createElement('span');
        value.className = 'result-value';
        value.textContent = `${result.value} ${result.unit || ''}`;

        item.appendChild(label);
        item.appendChild(value);
        parent.appendChild(item);

        return item;
    }

    clear() {
        this.container.innerHTML = '';
    }

    showLoading(message = 'Calculating...') {
        this.clear();
        const loading = document.createElement('div');
        loading.className = 'loading-indicator';
        loading.textContent = message;
        loading.style.textAlign = 'center';
        loading.style.padding = 'var(--spacing-xl)';
        loading.style.color = 'var(--color-text-muted)';
        this.container.appendChild(loading);
    }
}

// ==========================================
// EXPORT
// ==========================================

window.EnhancedFormBuilder = EnhancedFormBuilder;
window.ResultDisplayBuilder = ResultDisplayBuilder;
