/**
 * Global Parameter Manager
 * Handles central management of engineering parameters with support for
 * global values, local overrides, and parameter flow tracking.
 */

class GlobalParameterManager {
    constructor() {
        // Core storage
        this.globals = new Map();     // Map<paramKey, {value, unit, source, timestamp}>
        this.overrides = new Map();   // Map<moduleId, Map<paramKey, value>>

        // Metadata for parameter definitions
        this.definitions = new Map(); // Map<paramKey, {label, type, defaultUnit, ...}>

        // Event listeners
        this.listeners = new Set();

        console.log('Global Parameter Manager initialized');
    }

    /**
     * Define a parameter that can be managed globally
     * @param {string} key - Unique identifier (e.g., 'waveHeight')
     * @param {object} definition - Metadata {label, defaultUnit, type, min, max, description}
     */
    defineParameter(key, definition) {
        this.definitions.set(key, {
            ...definition,
            key
        });
    }

    /**
     * Set a global parameter value
     * @param {string} key - Parameter key
     * @param {any} value - Value to set
     * @param {string} source - Source of the update (e.g., 'user', 'calculation', 'import')
     */
    setGlobal(key, value, source = 'user') {
        if (!this.definitions.has(key)) {
            console.warn(`GlobalParameterManager: Unknown parameter '${key}'`);
        }

        const previousValue = this.globals.get(key)?.value;

        this.globals.set(key, {
            value,
            source,
            timestamp: Date.now()
        });

        if (previousValue !== value) {
            this.notifyListeners(key, 'global', value);
        }
    }

    /**
     * Set a local override for a specific module
     * @param {string} moduleId - ID of the module (e.g., 'wave-predictor', 'structure-designer')
     * @param {string} key - Parameter key
     * @param {any} value - Value to set
     */
    setOverride(moduleId, key, value) {
        if (!this.overrides.has(moduleId)) {
            this.overrides.set(moduleId, new Map());
        }

        const moduleOverrides = this.overrides.get(moduleId);
        const previousValue = moduleOverrides.get(key);

        moduleOverrides.set(key, value);

        if (previousValue !== value) {
            this.notifyListeners(key, 'override', value, moduleId);
        }
    }

    /**
     * Clear an override, reverting to global value
     * @param {string} moduleId - ID of the module
     * @param {string} key - Parameter key
     */
    clearOverride(moduleId, key) {
        if (this.overrides.has(moduleId)) {
            const moduleOverrides = this.overrides.get(moduleId);
            if (moduleOverrides.has(key)) {
                moduleOverrides.delete(key);
                this.notifyListeners(key, 'override-cleared', this.getEffectiveValue(moduleId, key), moduleId);
            }
        }
    }

    /**
     * Get the effective value for a parameter in a context
     * @param {string} moduleId - Context/Module ID (optional)
     * @param {string} key - Parameter key
     * @returns {any} Effective value (override or global)
     */
    getEffectiveValue(moduleId, key) {
        // 1. Check for override
        if (moduleId && this.overrides.has(moduleId)) {
            const moduleOverrides = this.overrides.get(moduleId);
            if (moduleOverrides.has(key)) {
                return moduleOverrides.get(key);
            }
        }

        // 2. Return global value
        if (this.globals.has(key)) {
            return this.globals.get(key).value;
        }

        // 3. Return default from definition (if available) - optional fallback
        return null;
    }

    /**
     * Get detailed info including if it's overridden
     */
    getParameterState(moduleId, key) {
        const isOverridden = moduleId &&
            this.overrides.has(moduleId) &&
            this.overrides.get(moduleId).has(key);

        const effectiveValue = this.getEffectiveValue(moduleId, key);
        const globalData = this.globals.get(key);

        return {
            key,
            value: effectiveValue,
            isOverridden,
            globalValue: globalData?.value,
            source: isOverridden ? 'override' : (globalData?.source || 'undefined')
        };
    }

    /**
     * Subscribe to changes
     * @param {Function} callback - (key, type, value, moduleId) => void
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(key, type, value, moduleId) {
        for (const listener of this.listeners) {
            try {
                listener(key, type, value, moduleId);
            } catch (e) {
                console.error('Error in parameter listener:', e);
            }
        }
    }

    /**
     * Reset all overrides for a module
     */
    resetModuleOverrides(moduleId) {
        if (this.overrides.has(moduleId)) {
            this.overrides.delete(moduleId);
            this.notifyListeners(null, 'reset-module', null, moduleId);
        }
    }

    /**
     * Resolve parameter key from optional category + name arguments.
     */
    _resolveKey(paramCategoryOrKey, paramName) {
        if (paramName === undefined || paramName === null || paramName === '') {
            return paramCategoryOrKey;
        }
        if (this.definitions.has(paramName) || this.globals.has(paramName)) {
            return paramName;
        }
        const namespaced = `${paramCategoryOrKey}.${paramName}`;
        if (this.definitions.has(namespaced) || this.globals.has(namespaced)) {
            return namespaced;
        }
        return paramName;
    }

    /**
     * Retrieve parameter details compatible with EnhancedFormBuilder.
     */
    getParameter(paramCategoryOrKey, paramName = undefined, moduleId = null) {
        const key = paramName !== undefined
            ? this._resolveKey(paramCategoryOrKey, paramName)
            : paramCategoryOrKey;
        const state = this.getParameterState(moduleId, key);
        const def = this.definitions.get(key) || {};
        return {
            ...state,
            unit: def.defaultUnit || '',
            label: def.label || key,
            defaultValue: state.value ?? def.defaultValue ?? null
        };
    }

    /**
     * Set a global parameter supporting both (key, value, [source]) and (category, name, value, [source]).
     */
    setGlobalParameter(paramCategoryOrKey, paramNameOrValue, maybeValue = undefined, source = 'user') {
        if (maybeValue === undefined) {
            this.setGlobal(paramCategoryOrKey, paramNameOrValue, source);
            return;
        }
        if (typeof paramNameOrValue === 'string') {
            const resolved = this._resolveKey(paramCategoryOrKey, paramNameOrValue);
            if (this.definitions.has(resolved) || !this.definitions.has(paramCategoryOrKey)) {
                this.setGlobal(resolved, maybeValue, source);
                return;
            }
        }
        this.setGlobal(paramCategoryOrKey, paramNameOrValue, maybeValue);
    }

    /**
     * Set a local module override supporting (moduleId, key, val) and (moduleId, cat, name, val).
     */
    setLocalOverride(moduleId, paramCategoryOrKey, paramNameOrValue, maybeValue = undefined) {
        if (maybeValue !== undefined) {
            const key = this._resolveKey(paramCategoryOrKey, paramNameOrValue);
            this.setOverride(moduleId, key, maybeValue);
        } else {
            this.setOverride(moduleId, paramCategoryOrKey, paramNameOrValue);
        }
    }

    /**
     * Clear a local module override supporting (moduleId, cat, name) and (moduleId, key).
     */
    clearLocalOverride(moduleId, paramCategoryOrKey, paramName = undefined) {
        const key = paramName !== undefined
            ? this._resolveKey(paramCategoryOrKey, paramName)
            : paramCategoryOrKey;
        this.clearOverride(moduleId, key);
    }

    /**
     * Return true if moduleId currently overrides the given parameter.
     */
    hasOverride(moduleId, paramCategoryOrKey, paramName = undefined) {
        const key = paramName !== undefined
            ? this._resolveKey(paramCategoryOrKey, paramName)
            : paramCategoryOrKey;
        return Boolean(moduleId && this.overrides.has(moduleId) && this.overrides.get(moduleId).has(key));
    }

    /**
     * Export globals and module overrides as a plain JSON-serializable object.
     */
    exportParameters() {
        const globals = {};
        for (const [key, entry] of this.globals.entries()) {
            globals[key] = { ...entry };
        }
        const overrides = {};
        for (const [moduleId, moduleMap] of this.overrides.entries()) {
            overrides[moduleId] = Object.fromEntries(moduleMap.entries());
        }
        return {
            version: 1,
            globals,
            overrides
        };
    }

    /**
     * Import globals and module overrides from exported data.
     */
    importParameters(data) {
        this.globals.clear();
        this.overrides.clear();
        if (!data || typeof data !== 'object') {
            this.notifyListeners(null, 'import', null, null);
            return;
        }

        if (data.globals && typeof data.globals === 'object') {
            for (const [key, entry] of Object.entries(data.globals)) {
                const value = entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry;
                const source = entry && typeof entry === 'object' && entry.source ? entry.source : 'import';
                this.globals.set(key, {
                    value,
                    source,
                    timestamp: (entry && entry.timestamp) || Date.now()
                });
            }
        } else {
            // Legacy flat or category-nested map fallback
            for (const [key, val] of Object.entries(data)) {
                if (key === 'version' || key === 'overrides') continue;
                if (val && typeof val === 'object' && !('value' in val)) {
                    for (const [subKey, subVal] of Object.entries(val)) {
                        this.globals.set(this._resolveKey(key, subKey), {
                            value: subVal,
                            source: 'import',
                            timestamp: Date.now()
                        });
                    }
                } else {
                    const value = val && typeof val === 'object' && 'value' in val ? val.value : val;
                    this.globals.set(key, {
                        value,
                        source: 'import',
                        timestamp: Date.now()
                    });
                }
            }
        }

        if (data.overrides && typeof data.overrides === 'object') {
            for (const [moduleId, moduleEntries] of Object.entries(data.overrides)) {
                if (moduleEntries && typeof moduleEntries === 'object') {
                    const map = new Map(Object.entries(moduleEntries));
                    this.overrides.set(moduleId, map);
                }
            }
        }

        this.notifyListeners(null, 'import', null, null);
    }

    /**
     * Create a badge element indicating a local override is active.
     */
    createOverrideIndicator(paramCategory, paramName, moduleId) {
        if (typeof document === 'undefined') return null;
        if (!this.hasOverride(moduleId, paramCategory, paramName)) return null;

        const key = this._resolveKey(paramCategory, paramName);
        const globalVal = this.globals.get(key)?.value;

        const badge = document.createElement('span');
        badge.className = 'parameter-override-badge';
        badge.textContent = 'Override';
        badge.title = globalVal !== undefined
            ? `Locally overridden (global: ${globalVal})`
            : 'Locally overridden';
        return badge;
    }

    /**
     * Create a button to clear a local override and revert to the global value.
     */
    createResetButton(paramCategory, paramName, moduleId, onReset = null) {
        if (typeof document === 'undefined') return null;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'parameter-reset-btn btn-secondary';
        btn.textContent = '↺ Reset';
        btn.title = 'Revert to global parameter value';
        btn.addEventListener('click', () => {
            this.clearLocalOverride(moduleId, paramCategory, paramName);
            if (typeof onReset === 'function') {
                onReset();
            }
        });
        return btn;
    }
}

// Export singleton
const globalParamsInstance = new GlobalParameterManager();

// Initialize standard definitions
const definitions = [
    // Environmental
    { key: 'waterDepth', label: 'Water Depth', defaultUnit: 'm', type: 'number' },
    { key: 'offshoreDepth', label: 'Offshore Water Depth', defaultUnit: 'm', type: 'number' },
    { key: 'deepWaterDepth', label: 'Deep Water Depth', defaultUnit: 'm', type: 'number' },
    { key: 'toeDepth', label: 'Toe Depth', defaultUnit: 'm', type: 'number' },
    { key: 'waveHeight', label: 'Wave Height (Hs)', defaultUnit: 'm', type: 'number' },
    { key: 'wavePeriod', label: 'Wave Period (Tp)', defaultUnit: 's', type: 'number' },
    { key: 'windSpeed', label: 'Wind Speed', defaultUnit: 'm/s', type: 'number' },
    { key: 'fetchLength', label: 'Fetch Length', defaultUnit: 'm', type: 'number' },

    // Water Levels
    { key: 'msl', label: 'Mean Sea Level', defaultUnit: 'm', type: 'number' },
    { key: 'tidalRange', label: 'Tidal Range', defaultUnit: 'm', type: 'number' },
    { key: 'slr', label: 'Sea Level Rise', defaultUnit: 'm', type: 'number' },

    // Structure
    { key: 'slopeAngle', label: 'Structure Slope', defaultUnit: 'deg', type: 'number' },
    { key: 'armourDensity', label: 'Armour Density', defaultUnit: 'kg/m³', type: 'number' },
    { key: 'freeboard', label: 'Crest Freeboard', defaultUnit: 'm', type: 'number' },
    { key: 'crestWidth', label: 'Crest Width', defaultUnit: 'm', type: 'number' }
];

definitions.forEach(def => globalParamsInstance.defineParameter(def.key, def));

if (typeof window !== 'undefined') {
    window.GlobalParams = globalParamsInstance;
    window.globalParamManager = globalParamsInstance;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobalParameterManager, GlobalParams: globalParamsInstance };
}
