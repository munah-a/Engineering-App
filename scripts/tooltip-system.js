/**
 * Tooltip System for Coastal Engineering App
 * Implements comprehensive tooltips for labels, inputs, and outputs
 * as specified in features.md
 */

class TooltipSystem {
    constructor() {
        this.tooltips = new Map();
        this.activeTooltip = null;
        this.init();
    }

    init() {
        // Create tooltip container
        this.createTooltipContainer();

        // Initialize tooltip data
        this.initializeTooltipData();

        // Attach event listeners
        this.attachEventListeners();
    }

    createTooltipContainer() {
        const container = document.createElement('div');
        container.id = 'tooltip-container';
        container.className = 'tooltip-container';
        container.style.cssText = `
            position: fixed;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
        `;
        document.body.appendChild(container);
        this.container = container;
    }

    initializeTooltipData() {
        // Label Tooltips - Engineering Terms
        this.tooltips.set('significant-wave-height', {
            type: 'label',
            title: 'Significant Wave Height (Hs)',
            content: 'The average height of the highest one-third of waves in a sea state. Used as the primary design wave parameter in coastal engineering. Typical range: 0.5-10m depending on location and storm conditions.'
        });

        this.tooltips.set('peak-period', {
            type: 'label',
            title: 'Peak Wave Period (Tp)',
            content: 'The wave period associated with the most energetic waves in the spectrum. Typical range: 4-15s. Longer periods increase wave forces and overtopping. Source: Wave measurement data or fetch calculations.'
        });

        this.tooltips.set('design-water-level', {
            type: 'label',
            title: 'Design Water Level (DWL)',
            content: 'The maximum expected water level including tide, surge, wave setup, and sea level rise. Critical for determining structure crest elevation. Calculated as: DWL = MSL + Tide + Surge + Setup + SLR. <br><br><strong>Ref:</strong> USACE Coastal Engineering Manual (CEM), Part II.'
        });

        this.tooltips.set('tide-station', {
            type: 'input',
            title: 'Tide Station',
            content: 'Select a reference tide station to auto-fill the Tidal Range parameter. Includes standard gauges from UHSLC (Male, Gan, Hanimaadhoo). Select "Manual / User Defined" to enter custom values. <br><br><strong>Ref:</strong> University of Hawaii Sea Level Center (UHSLC) Datums.'
        });

        this.tooltips.set('tidal-range', {
            type: 'input',
            title: 'Tidal Range',
            content: 'The vertical difference between high and low tide (MHHW - MLLW). Used to calculate High Tide Level ≈ MSL + (Range / 2). For Maldives, typically 0.7m to 1.2m. <br><br><strong>Ref:</strong> Admiralty Tide Tables / UHSLC.'
        });

        this.tooltips.set('mean-sea-level', {
            type: 'input',
            title: 'Mean Sea Level (MSL)',
            content: 'Elevation of MSL relative to your project datum. If using Chart Datum (CD), this is usually positive (e.g., +0.6m to +1.0m). If your survey is already relative to MSL, enter 0.'
        });

        this.tooltips.set('sea-level-rise', {
            type: 'input',
            title: 'Sea Level Rise (SLR)',
            content: 'Allowable sea level rise allowance over the design life of the structure (e.g., 50 or 100 years). Typically 0.5m - 1.0m depending on climate scenarios. <br><br><strong>Ref:</strong> IPCC AR6 (2021) / RCP8.5 Projections.'
        });

        this.tooltips.set('damage-level', {
            type: 'label',
            title: 'Damage Level (S)',
            content: 'Acceptable damage parameter for Van der Meer formula. S=2-3 for initial damage (start of damage), S=5-8 for intermediate damage, S=8+ for severe reshaping. Lower values = more conservative design.'
        });

        this.tooltips.set('armour-density', {
            type: 'input',
            title: 'Armour Density (ρa)',
            content: 'Mass density of armour material in kg/m³. Common values: Granite: ~2650, Concrete: ~2400, Coral rock: ~2100, Basalt: ~2800. Higher density = more stable units but heavier to place.'
        });

        this.tooltips.set('structure-slope', {
            type: 'input',
            title: 'Structure Slope (cotα)',
            content: 'Horizontal to vertical ratio (e.g., 1.5 = 3V:2H, 2.0 = 1V:2H). Steeper slopes (lower values like 1.5) require larger armour but use less material overall. Gentler slopes (higher values like 3.0) use lighter armour but wider structure.'
        });

        this.tooltips.set('crest-freeboard', {
            type: 'input',
            title: 'Crest Freeboard (Rc)',
            content: 'Vertical distance from Design Water Level to structure crest. Typical range: 1.5-4.0m. Controls overtopping discharge. Higher freeboard = less overtopping but more expensive structure.'
        });

        this.tooltips.set('armour-mass', {
            type: 'output',
            title: 'Required Armour Stone Mass (M50)',
            content: 'Median mass of primary armour units in tonnes. Result indicates the 50-percentile weight needed for stability under design wave conditions. Round up to available quarry sizes. Check M85 and M15 for grading requirements.'
        });

        this.tooltips.set('stability-number', {
            type: 'output',
            title: 'Stability Number (Ns)',
            content: 'Dimensionless parameter indicating armour stability: Ns = Hs/(Δ×Dn50). Compare with allowable values from Van der Meer (typically 1.5-3.0). If Ns > limit, armour is too light; increase unit size.'
        });

        this.tooltips.set('overtopping-discharge', {
            type: 'output',
            title: 'Overtopping Discharge (q)',
            content: 'Mean overtopping rate in l/s/m. Allowable limits: q<0.01 for pedestrian safety, q<0.05 for trained personnel, q<10 for vehicles, q<50 for property protection. Based on EurOtop guidelines.'
        });

        this.tooltips.set('factor-of-safety', {
            type: 'output',
            title: 'Factor of Safety (FoS)',
            content: 'Ratio of resisting forces to driving forces. Recommended minimum: FoS > 1.5 for sliding, FoS > 1.2 for overturning, FoS > 2.0 for bearing capacity. Values below indicate unsafe design requiring revision.'
        });

        this.tooltips.set('wave-setup', {
            type: 'label',
            title: 'Wave Setup (η)',
            content: 'Increase in mean water level due to wave breaking. Typically 10-20% of breaking wave height. Calculated using: η ≈ 0.2 × Hb. Important component of Design Water Level in shallow water.'
        });

        this.tooltips.set('fetch-length', {
            type: 'input',
            title: 'Fetch Length (F)',
            content: 'Distance over water that wind blows to generate waves, measured in meters. Typical range: 1,000m - 100,000m. Longer fetch = larger waves. Measure from upwind shore to structure location.'
        });

        this.tooltips.set('wind-speed', {
            type: 'input',
            title: 'Wind Speed (U₁₀)',
            content: 'Wind speed at 10m above water surface in m/s. Typical range: 10-30 m/s. Use sustained wind speed for design storm, not gusts. Source: Meteorological data or design standards.'
        });

        this.tooltips.set('water-depth', {
            type: 'input',
            title: 'Water Depth (d)',
            content: 'Depth of water at structure location in meters. Measured from seabed to Design Water Level. Affects wave transformation, breaking, and structure design. Typical range: 2-20m for coastal structures.'
        });

        this.tooltips.set('permeability-coefficient', {
            type: 'input',
            title: 'Permeability Coefficient (P)',
            content: 'Van der Meer parameter indicating core permeability. Range: 0.1 (impermeable core) to 0.6 (highly permeable). P=0.1 for concrete core, P=0.4-0.5 for conventional rubble core, P=0.6 for homogeneous structure.'
        });

        this.tooltips.set('number-of-waves', {
            type: 'input',
            title: 'Number of Waves (N)',
            content: 'Number of waves in design storm. Typical values: N=1000 for short storm, N=3000 for standard storm, N=7500 for severe storm. Higher N = more damage accumulation, requires heavier armour.'
        });

        this.tooltips.set('kd-coefficient', {
            type: 'input',
            title: 'Stability Coefficient (KD)',
            content: 'Hudson formula coefficient depending on armour type and placement. Rock: KD=2-4, Cubes: KD=5.5-7.5, Tetrapods: KD=7-12, Accropode: KD=15-20. Higher KD = more stable unit type.'
        });

        this.tooltips.set('crest-width', {
            type: 'input',
            title: 'Crest Width (Gc)',
            content: 'Width of structure crest in meters. Calculated as: Gc = multiplier × Dn50. Minimum: Gc = 3 × Dn50 or 3m for maintenance access. Typical range: 3-8m. Wider crest for road access or crane operations. Affects overtopping and construction cost.'
        });

        this.tooltips.set('crest-width-multiplier', {
            type: 'input',
            title: 'Crest Width Multiplier',
            content: 'Multiplier for crest width calculation: Gc = multiplier × Dn50. Typical: 3 (minimum for access), 4-5 (standard), 6+ (vehicle access). Higher values = wider crest but more material cost.'
        });

        this.tooltips.set('toe-width-multiplier', {
            type: 'input',
            title: 'Toe Width Multiplier',
            content: 'Multiplier for toe width calculation: B_toe = multiplier × Dn50_filter. Typical: 3-4 (standard), 5-6 (wide for stability). Filter stone size Dn50_filter ≈ Dn50_armour / 2.15. Higher values = wider toe but more material cost.'
        });

        this.tooltips.set('filter-type', {
            type: 'input',
            title: 'Filter Layer Material Type',
            content: 'Material type for filter/underlayer. Typically uses smaller rock (Dn50 ≈ Dn50_armour / 2.15) or graded stone. Filter prevents core material migration through armour voids. Common: angular rock, quarry run.'
        });

        this.tooltips.set('toe-type', {
            type: 'input',
            title: 'Toe Material Type',
            content: 'Material type for toe berm. Typically same as filter layer or slightly larger. Provides foundation stability and scour protection. Common: angular rock, concrete units for deep water.'
        });

        this.tooltips.set('filter-weight-ratio', {
            type: 'input',
            title: 'Filter Weight Ratio (W_f/W_a)',
            content: 'Weight ratio of filter stones to armour stones per EM 1110-2-1100 (CEM) Table VI-5-127. Standard: 1/10 (Dn50_filter ≈ Dn50_armour / 2.15). Coarse: 1/5. Fine: 1/15. Auto-calculates filter Dn50.'
        });

        this.tooltips.set('toe-weight-ratio', {
            type: 'input',
            title: 'Toe Weight Ratio (W_t/W_a)',
            content: 'Weight ratio of toe stones to armour stones per CEM Table VI-5-127. Standard: 1/10 (same as filter). Heavy: 1/5 for deep water. Light: 1/15 for shallow water. Auto-calculates toe Dn50.'
        });

        this.tooltips.set('core-weight-ratio', {
            type: 'input',
            title: 'Core Weight Ratio (W_c/W_a)',
            content: 'Weight ratio of core material to armour stones per CEM Table VI-5-127. Standard: 1/200 (quarry run). Coarse: 1/100. Fine: 1/500. Auto-calculates core Dn50.'
        });

        this.tooltips.set('toe-width', {
            type: 'input',
            title: 'Toe Width (Btoe)',
            content: 'Width of toe berm at structure base. Empirical: Btoe = 3-5 × Dn50(toe). Typical: 5-12m depending on water depth and wave height. Minimum: 3m for stability. Critical for preventing structure failure.'
        });

        this.tooltips.set('embedment-depth', {
            type: 'input',
            title: 'Embedment Depth (he)',
            content: 'Depth of toe below natural seabed to prevent scour undermining. Calculate scour depth S, then he = S + 0.5m safety margin. Typical: 1.0-3.0m. Absolute minimum: 1.0m below seabed.'
        });

        this.tooltips.set('layer-thickness', {
            type: 'output',
            title: 'Layer Thickness',
            content: 'Thickness of armour or filter layer. Armour: t = 2-3 × Dn50 (2-3 layers minimum). Filter: t = 2 × D50 or 0.3m minimum. Proper thickness prevents layer mixing and maintains stability.'
        });

        this.tooltips.set('volume-required', {
            type: 'output',
            title: 'Volume Required',
            content: 'Total volume of material needed for the layer in cubic meters (m³). Used for quantity estimation and cost calculation. Includes porosity adjustments. Order 10-20% extra for construction losses.'
        });

        this.tooltips.set('bearing-pressure', {
            type: 'output',
            title: 'Bearing Pressure',
            content: 'Pressure exerted on foundation soil in kPa. Compare with soil bearing capacity. Typical allowable: Sand 100-300 kPa, Clay 50-200 kPa, Rock >500 kPa. Excessive pressure causes settlement or failure.'
        });

        this.tooltips.set('filter-rule-compliance', {
            type: 'output',
            title: 'Filter Rule Compliance',
            content: 'Check if filter layer meets Terzaghi criteria: D15(filter)/d85(core) < 5 (retention) and D15(filter)/d15(core) > 4 (permeability). Pass = filter prevents core washout while maintaining drainage. Fail = redesign required.'
        });

        // Added Definitions
        this.tooltips.set('armour-dn50', {
            type: 'input',
            title: 'Armour Stone Dn50',
            content: 'Nominal diameter of primary armour stones. Must be greater than or equal to the required Dn50 calculated in Stability analysis.'
        });
        this.tooltips.set('layer-count', {
            type: 'input',
            title: 'Number of Layers',
            content: 'Depth of the structure layers. 1 = Armour only, 2 = Armour + Core, 3 = Armour + Filter + Core.'
        });
        this.tooltips.set('crest-elevation', {
            type: 'input',
            title: 'Crest Elevation (Rc)',
            content: 'Crest height relative to SWL or Chart Datum. Determines runup and overtopping performance.'
        });
        this.tooltips.set('core-dn50', {
            type: 'input',
            title: 'Core Material Dn50',
            content: 'Nominal diameter of core material. Should be significantly smaller than armour and filter. Typically 1-500kg stone.'
        });

        this.tooltips.set('armour-layers', {
            type: 'input',
            title: 'Armour Layer Count (n)',
            content: 'Number of armour stone layers. Typical: 2-3 layers. Thickness = n × Dn50. More layers = more stability but higher cost. Minimum 2 layers for stability.'
        });

        this.tooltips.set('filter-layers', {
            type: 'input',
            title: 'Filter Layer Count (n)',
            content: 'Number of filter/underlayer stone layers. Typical: 2 layers. Thickness = n × Dn50_filter. Prevents core material migration through armour.'
        });

        this.tooltips.set('toe-layers', {
            type: 'input',
            title: 'Toe Layer Count (n)',
            content: 'Number of toe berm stone layers. Typical: 2-3 layers. Thickness = n × Dn50_toe. Provides foundation stability and prevents scour.'
        });
    }

    attachEventListeners() {
        // Use event delegation for better performance
        document.addEventListener('mouseenter', (e) => {
            // Check if target is an element before calling closest
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE) {
                const target = e.target.closest('[data-tooltip]');
                if (target) {
                    this.showTooltip(target);
                }
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            // Check if target is an element before calling closest
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE) {
                const target = e.target.closest('[data-tooltip]');
                if (target) {
                    this.hideTooltip();
                }
            }
        }, true);

        // Touch support for mobile
        document.addEventListener('touchstart', (e) => {
            // Check if target is an element before calling closest
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE) {
                const target = e.target.closest('[data-tooltip]');
                if (target) {
                    e.preventDefault();
                    this.showTooltip(target);
                    setTimeout(() => this.hideTooltip(), 3000);
                }
            }
        }, { passive: false });
    }

    showTooltip(element) {
        const tooltipId = element.getAttribute('data-tooltip');
        const tooltipData = this.tooltips.get(tooltipId);

        if (!tooltipData) return;

        // Create tooltip content
        this.container.innerHTML = `
            <div class="tooltip-content" role="tooltip">
                <div class="tooltip-header">
                    <strong>${tooltipData.title}</strong>
                    <span class="tooltip-type-badge">${this.getTypeBadge(tooltipData.type)}</span>
                </div>
                <div class="tooltip-body">
                    ${tooltipData.content}
                </div>
            </div>
        `;

        // Position tooltip
        this.positionTooltip(element);

        // Show tooltip with animation
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });

        this.activeTooltip = element;
    }

    hideTooltip() {
        this.container.style.opacity = '0';
        this.activeTooltip = null;
    }

    positionTooltip(element) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.container.firstElementChild?.getBoundingClientRect();

        if (!tooltipRect) return;

        let top = rect.bottom + 8;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // Adjust if tooltip goes off-screen
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        // Show above if not enough space below
        if (top + tooltipRect.height > window.innerHeight - 8) {
            top = rect.top - tooltipRect.height - 8;
        }

        this.container.style.top = `${top}px`;
        this.container.style.left = `${left}px`;
    }

    getTypeBadge(type) {
        const badges = {
            'label': '📋 Definition',
            'input': '⚙️ Parameter',
            'output': '📊 Result'
        };
        return badges[type] || '💡 Info';
    }

    // Method to add tooltip to element programmatically
    addTooltip(element, tooltipId) {
        element.setAttribute('data-tooltip', tooltipId);

        // Add info icon if it's a label
        if (!element.querySelector('.tooltip-icon')) {
            const icon = document.createElement('span');
            icon.className = 'tooltip-icon';
            icon.innerHTML = ' ⓘ';
            icon.style.cssText = `
                color: var(--md-sys-color-primary);
                cursor: help;
                font-size: 0.9em;
                opacity: 0.7;
                transition: opacity 200ms;
            `;
            icon.addEventListener('mouseenter', () => icon.style.opacity = '1');
            icon.addEventListener('mouseleave', () => icon.style.opacity = '0.7');
            element.appendChild(icon);
        }
    }
}

// Add tooltip styles
const tooltipStyles = document.createElement('style');
tooltipStyles.textContent = `
    .tooltip-content {
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--md-sys-shape-corner-medium);
        box-shadow: var(--md-sys-elevation-3);
        padding: var(--spacing-md);
        max-width: 320px;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--md-sys-color-on-surface);
    }

    .tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
        gap: var(--spacing-sm);
    }

    .tooltip-header strong {
        color: var(--md-sys-color-primary);
        font-size: 0.95rem;
    }

    .tooltip-type-badge {
        font-size: 0.7rem;
        padding: 2px 6px;
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
        border-radius: var(--md-sys-shape-corner-small);
        white-space: nowrap;
    }

    .tooltip-body {
        color: var(--md-sys-color-on-surface-variant);
        font-size: 0.85rem;
    }

    /* Accessibility */
    [data-tooltip] {
        position: relative;
    }

    .tooltip-icon {
        user-select: none;
        -webkit-user-select: none;
    }

    /* Dark theme adjustments */
    @media (prefers-color-scheme: dark) {
        .tooltip-content {
            background: var(--md-sys-color-surface-2);
        }
    }
`;
document.head.appendChild(tooltipStyles);

// Initialize tooltip system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tooltipSystem = new TooltipSystem();
    });
} else {
    window.tooltipSystem = new TooltipSystem();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipSystem;
}
