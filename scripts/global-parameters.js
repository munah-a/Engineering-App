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
            // Notify general change? Or specific?
            // For now, simpler notification mechanism usually sufficient
            this.notifyListeners(null, 'reset-module', null, moduleId);
        }
    }
}

// Export singleton
window.GlobalParams = new GlobalParameterManager();

// Initialize standard definitions
const definitions = [
    // Environmental
    { key: 'waterDepth', label: 'Water Depth', defaultUnit: 'm', type: 'number' },
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
    { key: 'armourDensity', label: 'Armour Density', defaultUnit: 'kg/m³', type: 'number' }
];

definitions.forEach(def => window.GlobalParams.defineParameter(def.key, def));
