// ==========================================
// CANVAS DRAWING FOR STRUCTURE VISUALIZATION
// ==========================================

let canvas, ctx;
let canvasScale = 1;
let canvasOffset = { x: 0, y: 0 };

// Initialize canvas when available
function initCanvas() {
    canvas = document.getElementById('designCanvas');
    if (!canvas) {
        console.log('Canvas element not found');
        return;
    }

    console.log('Initializing canvas...');
    ctx = canvas.getContext('2d');

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);

    // Initial draw
    drawStructureOnCanvas(AppState.selectedTemplate);
    console.log('Canvas initialized and drawn');
}

// ==========================================
// DRAWING FUNCTIONS
// ==========================================

function drawStructureOnCanvas(templateName) {
    if (!canvas || !ctx) {
        initCanvas();
        if (!canvas || !ctx) return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw based on template
    switch (templateName) {
        case 'rubble-bullnose':
            drawRubbleMoundStandard(); // Re-use standard for now, but maybe add bullnose visual later
            break;
        case 'rubble-berm':
            drawRubbleMoundBerm();
            break;
        case 'rubble-revetment':
            drawRubbleMoundRevetment();
            break;
        case 'rubble-low':
            drawRubbleMoundLowCrested();
            break;
        case 'vertical-wall':
            drawVerticalWall();
            break;
        case 'vertical-composite':
            drawCompositeStructure();
            break;
        case 'vertical-caisson':
            drawCaisson();
            break;
        case 'vertical-perforated':
            drawPerforatedCaisson();
            break;
        default:
            drawRubbleMoundStandard();
    }

    // Draw water level (only if not handled by detailed template)
    if (templateName !== 'rubble-standard' && templateName !== 'rubble-revetment') {
        drawWaterLevel();
    }

    // Draw dimensions (only if not handled by detailed template)
    if (templateName !== 'rubble-revetment') {
        drawDimensions(templateName);
    }
}

function drawGrid() {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawWaterLevel() {
    const waterY = canvas.height * 0.6;

    // Water surface
    ctx.strokeStyle = '#0a84ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    ctx.lineTo(canvas.width, waterY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Water label
    ctx.fillStyle = '#0a84ff';
    ctx.font = '12px Inter';
    ctx.fillText('SWL', 10, waterY - 5);

    // Water body
    const gradient = ctx.createLinearGradient(0, waterY, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(10, 132, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(10, 132, 255, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);
}

// ==========================================
// RUBBLE MOUND STRUCTURES
// ==========================================

function drawRubbleMoundStandard() {
    // Helper to get values safely
    const getVal = (id, def) => {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) : def;
    };
    const getCheck = (id, def) => {
        const el = document.getElementById(id);
        return el ? el.checked : def;
    };

    const inputs = {
        crestElevation: getVal('crestHeight', 2.8),

        // Calculate crest width: Gc = multiplier × n_armour × Dn50
        crestWidthMultiplier: parseInt(document.getElementById('crestWidthMultiplier')?.value || 3),
        armourDn50: getVal('armourDn50', 1.2),

        slopeLeft: getVal('slopeLeft', getVal('slope', 1.5)),
        slopeRight: getVal('slopeRight', getVal('slope', 1.5)),

        layerCount: parseInt(document.getElementById('layerCount')?.value || 3),

        hasLeftToe: getCheck('hasLeftToe', true),
        toeSlopeLeft: getVal('toeSlopeLeft', 1.5),

        hasRightToe: getCheck('hasRightToe', true),
        toeSlopeRight: getVal('toeSlopeRight', 1.5),

        toeThickness: getVal('toeThickness', 1.5),

        waterDepth: getVal('depth', 3.5)
    };

    // Calculate crest width: Gc = multiplier × Dn50
    inputs.crestWidth = inputs.crestWidthMultiplier * inputs.armourDn50;

    // Calculate toe widths: B_toe = multiplier × Dn50_filter
    const toeWidthMultiplier = parseInt(document.getElementById('toeWidthMultiplier')?.value || 4);
    const Dn50_filter = inputs.armourDn50 / Math.pow(10, 1 / 3);
    inputs.toeLeftWidth = toeWidthMultiplier * Dn50_filter;
    inputs.toeRightWidth = toeWidthMultiplier * Dn50_filter;

    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;

    // Slopes (run/rise)
    const angleL = Math.atan(1 / inputs.slopeLeft);
    const angleR = Math.atan(1 / inputs.slopeRight);

    // Structure Total Height
    const structureHeightM = inputs.waterDepth + inputs.crestElevation; // Total H

    // Scaling Determination
    const maxSlope = Math.max(inputs.slopeLeft, inputs.slopeRight);
    // Rough width estimate
    const totalWidthM = inputs.crestWidth + 2 * (maxSlope * structureHeightM) + 20;
    const totalHeightM = structureHeightM + 8;

    const scaleX = (canvas.width * 0.9) / totalWidthM;
    const scaleY = (canvas.height * 0.8) / totalHeightM;
    const ppt = Math.min(scaleX, scaleY);

    // Pixels
    const H = structureHeightM * ppt;
    const CW = inputs.crestWidth * ppt;
    const WD = inputs.waterDepth * ppt;

    // Base Widths (Internal)
    const SW_L = (structureHeightM * inputs.slopeLeft) * ppt;
    const SW_R = (structureHeightM * inputs.slopeRight) * ppt;

    // Get layer counts from inputs
    const n_armour = parseInt(document.getElementById('armourLayers')?.value || 2);
    const n_filter = parseInt(document.getElementById('filterLayers')?.value || 2);
    const n_toe = parseInt(document.getElementById('toeLayers')?.value || 2);

    // Dn50_filter already calculated above for toe width (line 181)
    // Layer thickness coefficient
    const k_delta = 1.0;

    // Toe Px - using toe layer count
    const Dn50_toe = Dn50_filter; // Toe stones typically same size as filter
    const TH = n_toe * k_delta * Dn50_toe * ppt;

    // Save Data
    canvas.drawingData = { ppt, baseY, centerX, H, CW, SW_L, SW_R, TH, inputs, WD };

    // --- DRAWING ---
    ctx.fillStyle = '#1e1e1e'; ctx.fillRect(0, 0, canvas.width, canvas.height); // BG

    // 1. SEABED
    ctx.fillStyle = '#263238'; ctx.fillRect(0, baseY, canvas.width, canvas.height - baseY);
    ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(canvas.width, baseY);
    ctx.strokeStyle = '#546E7A'; ctx.lineWidth = 2; ctx.stroke();

    // Helper: Asymmetric Profile
    // draws a layer defined by offsets from outer boundary
    const drawAsymmetricProfile = (offY, dx_L, dx_R, color, stroke) => {
        const yTop = baseY - H + offY;
        if (yTop > baseY) return;

        // Top Width
        // L Top X = Center - CW/2 + dx_L (shift right means shrunk)
        // No, dx is horizontal shift INWARD.
        // Base Left: Center - CW/2 - SW_L + dx_L_base? No.
        // Simple geometry:
        // Top Left X = Center - CW/2.
        // Base Left = Center - CW/2 - (H * SlopeL).
        // Inner Layer (offset `t` perpendicular):
        // `dx` horizontal = t / sin(angle).
        // New Base Left = Base Left + dx.
        // New Top Left = Top Left + dx.

        const xBaseLeft = (centerX - CW / 2 - SW_L) + dx_L;
        const xBaseRight = (centerX + CW / 2 + SW_R) - dx_R;

        // At Top Y: x = Base + (Dy * Slope)
        const dy = H - offY;
        const xTopLeft = xBaseLeft + (dy * inputs.slopeLeft);
        const xTopRight = xBaseRight - (dy * inputs.slopeRight);

        if (xTopLeft >= xTopRight) return; // Inverted/Pinched out

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(xBaseLeft, baseY);
        ctx.lineTo(xTopLeft, yTop);
        ctx.lineTo(xTopRight, yTop);
        ctx.lineTo(xBaseRight, baseY);
        ctx.closePath();
        ctx.fill();
        if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    };

    // Layer Thicknesses (px)
    const t_armour = n_armour * k_delta * inputs.armourDn50 * ppt;
    const t_filter = n_filter * k_delta * Dn50_filter * ppt;

    // Horizontal Inward Shifts
    const dx_armour_L = t_armour / Math.sin(angleL);
    const dx_armour_R = t_armour / Math.sin(angleR);

    const dx_filter_L = t_filter / Math.sin(angleL);
    const dx_filter_R = t_filter / Math.sin(angleR);

    // --- DRAW LAYERS (Painter's Algo: 1. Main, 2. Middle, 3. Inner) ---

    // 1. ARMOUR (Always present, defines outer shell)
    drawAsymmetricProfile(0, 0, 0, '#455A64', null);

    // Label
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px Inter'; ctx.textAlign = 'center';
    ctx.restore();

    // 2. INNER LAYERS based on Count
    const count = inputs.layerCount;

    if (count >= 2) {
        if (count == 2) {
            // Case: Armour + Core (No Filter)
            // Core takes place of Filter offset? No, Core is inside Armour.
            // Offset = Armour Thickness.
            const offY = t_armour;
            const dL = dx_armour_L;
            const dR = dx_armour_R;
            drawAsymmetricProfile(offY, dL, dR, '#B0BEC5', '#37474F'); // Core color
        } else {
            // Case >= 3: Armour + Filter + Core

            // Draw FILTER
            const offY_F = t_armour;
            const dL_F = dx_armour_L;
            const dR_F = dx_armour_R;
            drawAsymmetricProfile(offY_F, dL_F, dR_F, '#78909C', '#263238'); // Filter color

            // Draw CORE
            const offY_C = t_armour + t_filter;
            const dL_C = dx_armour_L + dx_filter_L;
            const dR_C = dx_armour_R + dx_filter_R;
            drawAsymmetricProfile(offY_C, dL_C, dR_C, '#B0BEC5', '#37474F'); // Core color
        }
    }

    // 3. TOES (Optional per side)
    const drawToe = (side) => { // 1 = Right, -1 = Left
        const isRight = side === 1;
        const enabled = isRight ? inputs.hasRightToe : inputs.hasLeftToe;
        if (!enabled) return;

        const width = isRight ? inputs.toeRightWidth : inputs.toeLeftWidth;
        const slope = isRight ? inputs.toeSlopeRight : inputs.toeSlopeLeft;
        const mainSlope = isRight ? inputs.slopeRight : inputs.slopeLeft;

        const TW = width * ppt;
        // Inner Top Start: Base of Main Slope - (TH * MainSlope)
        // Base X (Seabed)
        const baseX = centerX + (side * CW / 2) + (side * (isRight ? SW_R : SW_L));

        const innerTopX = baseX - (side * (TH * mainSlope));
        const topY = baseY - TH;
        const outerTopX = innerTopX + (side * TW);
        const outerBaseX = outerTopX + (side * (TH * slope));

        ctx.fillStyle = '#546E7A'; ctx.strokeStyle = '#ECEFF1'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerTopX, topY);
        ctx.lineTo(outerTopX, topY);
        ctx.lineTo(outerBaseX, baseY);
        ctx.lineTo(baseX, baseY); // Close at base
        ctx.lineTo(innerTopX, topY);
        ctx.fill(); ctx.stroke();
    };

    drawToe(1); // Right
    drawToe(-1); // Left

    // 4. WATER LEVEL
    const waterLevelY = baseY - WD;
    canvas.waterLevelY = waterLevelY;
    ctx.strokeStyle = '#29B6F6'; ctx.lineWidth = 2; ctx.setLineDash([10, 5]);
    ctx.beginPath(); ctx.moveTo(0, waterLevelY); ctx.lineTo(canvas.width, waterLevelY); ctx.stroke(); ctx.setLineDash([]);
    // Symbol
    const symX = canvas.width * 0.15; ctx.fillStyle = '#29B6F6';
    ctx.beginPath(); ctx.moveTo(symX - 10, waterLevelY); ctx.lineTo(symX + 10, waterLevelY); ctx.lineTo(symX, waterLevelY + 15); ctx.fill();
    ctx.font = 'bold 12px Inter'; ctx.fillText('SWL', symX + 15, waterLevelY + 10);
    ctx.fillStyle = 'rgba(41,182,246,0.1)'; ctx.fillRect(0, waterLevelY, canvas.width, baseY - waterLevelY);
}

function drawRubbleMoundBerm() {
    const baseY = canvas.height * 0.9;
    const waterY = canvas.height * 0.6;
    const centerX = canvas.width / 2;

    // Berm breakwater with distinctive berm
    const totalHeight = (baseY - waterY) * 1.3;
    const bermHeight = totalHeight * 0.4;
    const crestWidth = 60;
    const bermWidth = 100;

    ctx.fillStyle = '#546e7a';

    // Draw stepped profile
    ctx.beginPath();
    ctx.moveTo(centerX - 200, baseY);
    ctx.lineTo(centerX - bermWidth / 2, baseY - bermHeight);
    ctx.lineTo(centerX - crestWidth / 2, baseY - totalHeight);
    ctx.lineTo(centerX + crestWidth / 2, baseY - totalHeight);
    ctx.lineTo(centerX + bermWidth / 2, baseY - bermHeight);
    ctx.lineTo(centerX + 200, baseY);
    ctx.closePath();
    ctx.fill();

    // Berm highlight
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(centerX - bermWidth / 2, baseY - bermHeight, bermWidth, 15);

    // Armour
    drawArmourStones(centerX - 200, baseY, centerX - bermWidth / 2, baseY - bermHeight, 20, '#78909c');

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 200, baseY);
    ctx.lineTo(centerX - bermWidth / 2, baseY - bermHeight);
    ctx.lineTo(centerX - crestWidth / 2, baseY - totalHeight);
    ctx.lineTo(centerX + crestWidth / 2, baseY - totalHeight);
    ctx.lineTo(centerX + bermWidth / 2, baseY - bermHeight);
    ctx.lineTo(centerX + 200, baseY);
    ctx.stroke();
}

function drawRubbleMoundReef() {
    const baseY = canvas.height * 0.9;
    const waterY = canvas.height * 0.6;
    const centerX = canvas.width / 2;

    // Low profile reef breakwater
    const height = (waterY - baseY * 0.88);
    const width = 250;

    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2, baseY);
    ctx.lineTo(centerX - width / 4, waterY);
    ctx.lineTo(centerX + width / 4, waterY);
    ctx.lineTo(centerX + width / 2, baseY);
    ctx.closePath();
    ctx.fill();

    // Coral/rock texture
    drawCoralTexture(centerX - width / 2, waterY, width, baseY - waterY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
}



function drawRubbleMoundRevetment() {
    // Helper to get values safely
    const getVal = (id, def) => {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) : def;
    };

    // Inputs
    const crestElev = getVal('crestHeight', 2.8);
    const waterDepth = getVal('depth', 3.5);
    const slope = getVal('slopeLeft', 2.5);

    // Revetment Logic:
    // It protects a reclamation (Land on Right).
    // Structure:
    // Left: Sea, Toe, Slope up to Crest.
    // Crest: Defined Width.
    // Right: Land Mass (Reclamation Fill) at Crest Level (or slightly below).

    // Crest Width Calculation
    const Dn50 = getVal('armourDn50', 1.0);
    const multiplier = parseInt(document.getElementById('crestWidthMultiplier')?.value || 3);
    const crestWidth = multiplier * Dn50;

    const canvasH = canvas.height;
    const canvasW = canvas.width;
    const baseY = canvasH * 0.85; // Seabed Level

    // Scales
    // Height = WaterDepth + CrestElev
    const totalH = waterDepth + crestElev;

    // Width Estimate: Toe + Slope*H + Crest + Some Land
    // Toe Width (approx 3m) + SlopeLen (2.5 * H) + Crest (3m) + Land (10m)
    const estimW = 5 + (slope * totalH) + crestWidth + 15;
    const scaleX = (canvasW * 0.9) / estimW;
    const scaleY = (canvasH * 0.7) / (totalH + 5);
    const ppt = Math.min(scaleX, scaleY);

    // Pixels
    const H_px = totalH * ppt;
    const W_crest_px = crestWidth * ppt;

    // Left Toe
    // Assuming standard toe dimensions if not explicit
    // Diagram shows a distinct toe mound.
    // Let's use generic toe params or defaults
    const toeWidth = 3.0; // Fixed visual default or from input if available
    const toeThick = 1.0; // Fixed visual default
    const W_toe_px = toeWidth * ppt;
    const H_toe_px = toeThick * ppt;

    // Reference Point: Crest Top Left
    // Let's place the slope toe at X ~ 1/3 of canvas
    // Or better: Let's center the "Slope" part.

    // Coordinate System:
    // Seabed Y = baseY
    // Crest Y = baseY - H_px

    // Calculate X positions
    // Reclamation Edge (Right side of crest)
    const xReclamationEdge = canvasW * 0.7;
    const xCrestLeft = xReclamationEdge - W_crest_px;

    // Slope Base X (where slope meets seabed/toe)
    // dx = slope * H
    const dx_slope = slope * H_px;
    const xSlopeBase = xCrestLeft - dx_slope;

    // Toe start X
    const xToeOuter = xSlopeBase - W_toe_px;

    // Layers
    // Armour Thickness
    const n_armour = parseInt(document.getElementById('armourLayers')?.value || 2);
    const t_armour_px = n_armour * Dn50 * ppt; // approx
    // Filter Thickness
    const t_filter_px = t_armour_px * 0.8; // approx

    // 5. DRAWING LAYERS (Back to Front)
    // Update: Reclamation Level Logic
    const rlValue = parseFloat(document.getElementById('reclamationLevel')?.value || 1.6);
    const H_rec_total = waterDepth + rlValue;
    const H_rec_px = H_rec_total * ppt;
    const yReclamation = baseY - H_rec_px;

    // --- REVISED GEOMETRY: BACK SLOPE ---
    // Outer Profile Nodes
    // 1. Front Slope: Approaches Crest from Left.
    // 2. Crest Top: Flat width = W_crest_px.
    // 3. Back Slope: Descends from Crest to Reclamation Level.

    // Outer Points (Armour Surface)
    const p1_front_bot = { x: xSlopeBase, y: baseY };       // Front Toe
    const p1_front_top = { x: xCrestLeft, y: baseY - H_px }; // Front Crest Edge

    // Back Crest Edge
    const xCrestRight = xCrestLeft + W_crest_px;
    const p1_back_top = { x: xCrestRight, y: baseY - H_px };

    // Back Toe (Intersection with Reclamation Level)
    const dy_back = H_px - H_rec_px; // Height diff
    const dx_back = dy_back * slope; // Assuming same slope for back
    const xBackToe = xCrestRight + dx_back;
    const p1_back_bot = { x: xBackToe, y: yReclamation };

    // --- INNER PROFILES (GEOMETRIC INTERSECTIONS) ---
    // Helper: Offset Intersection Logic for Constant Thickness
    // We need intersection of Shifted Slope Line and Shifted Crest Line.

    // 1. Front Slope parameters
    // Equation: x = xBot + (yBot - y) / tan(angle)
    // Shifted Right by dx = t / sin(angle)
    const angleFront = Math.atan(H_px / dx_slope);
    const getFrontInteractX = (yTarget, t_offset) => {
        const dx_shift = t_offset / Math.sin(angleFront);
        return p1_front_bot.x + dx_shift + (p1_front_bot.y - yTarget) / Math.tan(angleFront);
    };

    // 2. Back Slope parameters
    // Equation: x = xTop + (y - yTop) / tan(angle)
    // Shifted Left by dx = t / sin(angle)
    const angleBack = Math.atan(dy_back / dx_back);
    const getBackInteractX = (yTarget, t_offset) => {
        const dx_shift = t_offset / Math.sin(angleBack);
        // Note: x starts at xCrestRight (Top) for this calc relative to top
        // But let's use the known point p1_back_top
        return p1_back_top.x - dx_shift + (yTarget - p1_back_top.y) / Math.tan(angleBack);
    };

    // A. FILTER PROFILE (P2) - Interface between Armour and Filter
    // Vertical depth of interface = t_armour_px
    const y_P2_top = p1_front_top.y + t_armour_px;

    const p2_front_top = {
        x: getFrontInteractX(y_P2_top, t_armour_px),
        y: y_P2_top
    };

    const p2_back_top = {
        x: getBackInteractX(y_P2_top, t_armour_px),
        y: y_P2_top
    };

    // Bottom Points (at seabed / reclamation)
    // p2_front_bot: On Shifted Front Slope at y = yBase
    const p2_front_bot = {
        x: getFrontInteractX(baseY, t_armour_px),
        y: baseY
    };

    // p2_back_bot: On Shifted Back Slope at y = yReclamation (Base of Armour Inner)
    const p2_back_bot = {
        x: getBackInteractX(yReclamation, t_armour_px),
        y: yReclamation
    };

    // Filter Base Slab Logic
    // Filter sits flat under the Armour Toe.
    // Top of Slab = yReclamation.
    // Bottom of Slab = yReclamation + t_filter_px.
    const yFilterBot = yReclamation + t_filter_px;

    // Outer Top Point (aligns with Armour Outer Toe)
    const p_filter_toe_outer_top = {
        x: xBackToe,
        y: yReclamation
    };

    // Outer Bottom Point
    const p_filter_toe_outer_bot = {
        x: xBackToe,
        y: yFilterBot
    };


    // B. SAND PROFILE (P3) - Interface between Filter and Core
    const t_total = t_armour_px + t_filter_px;
    const y_P3_top = p1_front_top.y + t_total;

    const p3_front_top = {
        x: getFrontInteractX(y_P3_top, t_total),
        y: y_P3_top
    };

    const p3_back_top = {
        x: getBackInteractX(y_P3_top, t_total),
        y: y_P3_top
    };

    const p3_front_bot = {
        x: getFrontInteractX(baseY, t_total),
        y: baseY
    };

    // Correcting p3_back_bot based on Slab Bottom
    // Intersection of Inner Slope and Slab Bottom
    const p3_back_bot = {
        x: getBackInteractX(yFilterBot, t_total),
        y: yFilterBot
    };


    ctx.fillStyle = '#1e1e1e'; ctx.fillRect(0, 0, canvasW, canvasH); // Clear

    // 1. RECLAMATION FILL (Right of Structure)
    ctx.fillStyle = '#d7ccc8';
    ctx.beginPath();
    ctx.moveTo(xBackToe, yReclamation);
    ctx.lineTo(canvasW, yReclamation);
    ctx.lineTo(canvasW, canvasH);
    ctx.lineTo(xBackToe, canvasH);
    ctx.closePath();
    ctx.fill();

    // 2. SAND CORE (Under Structure - Foundation)
    // Fills under the Filter Slab
    ctx.fillStyle = '#d7ccc8';
    ctx.beginPath();
    ctx.moveTo(p3_front_bot.x, p3_front_bot.y);
    ctx.lineTo(p3_front_top.x, p3_front_top.y);
    ctx.lineTo(p3_back_top.x, p3_back_top.y);
    ctx.lineTo(p3_back_bot.x, p3_back_bot.y);

    // Under the Filter Slab
    ctx.lineTo(p_filter_toe_outer_bot.x, p_filter_toe_outer_bot.y);

    // Down to bottom
    ctx.lineTo(xBackToe, canvasH);
    ctx.lineTo(p3_front_bot.x, canvasH);
    ctx.closePath();
    ctx.fill();

    // Label Land
    ctx.fillStyle = '#5d4037';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('LAND / RECLAMATION', Math.max(xBackToe, xReclamationEdge) + 40, yReclamation + 30);
    ctx.fillText(`+${rlValue.toFixed(1)}m`, Math.max(xBackToe, xReclamationEdge) + 40, yReclamation - 5);

    // 3. FILTER LAYER
    ctx.fillStyle = '#90A4AE';
    ctx.beginPath();
    // Inner Loop 
    ctx.moveTo(p3_front_bot.x, p3_front_bot.y);
    ctx.lineTo(p3_front_top.x, p3_front_top.y);
    ctx.lineTo(p3_back_top.x, p3_back_top.y);

    // Transition to Slab Bottom Inner
    ctx.lineTo(p3_back_bot.x, p3_back_bot.y);
    // Slab Bottom Outer
    ctx.lineTo(p_filter_toe_outer_bot.x, p_filter_toe_outer_bot.y);
    // Slab Right Face (Up)
    ctx.lineTo(p_filter_toe_outer_top.x, p_filter_toe_outer_top.y);
    // Slab Top (Back to Slope Interface)
    ctx.lineTo(p2_back_bot.x, p2_back_bot.y);

    // Continue Outer Loop
    ctx.lineTo(p2_back_top.x, p2_back_top.y);
    ctx.lineTo(p2_front_top.x, p2_front_top.y);
    ctx.lineTo(p2_front_bot.x, p2_front_bot.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#546E7A'; ctx.stroke();

    // 4. ARMOUR LAYER
    ctx.fillStyle = '#546E7A';
    ctx.beginPath();
    // Inner Loop (Filter Interface)
    ctx.moveTo(p2_front_bot.x, p2_front_bot.y);
    ctx.lineTo(p2_front_top.x, p2_front_top.y);
    ctx.lineTo(p2_back_top.x, p2_back_top.y);
    ctx.lineTo(p2_back_bot.x, p2_back_bot.y);
    // Outer Loop (Structure Surface)
    ctx.lineTo(p1_back_bot.x, p1_back_bot.y);
    ctx.lineTo(p1_back_top.x, p1_back_top.y);
    ctx.lineTo(p1_front_top.x, p1_front_top.y);
    ctx.lineTo(p1_front_bot.x, p1_front_bot.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#37474F'; ctx.stroke();

    // Armour Rocks Texture
    ctx.fillStyle = '#455A64';
    const rockSize = Math.max(3, Dn50 * ppt * 0.8);
    // Front Slope
    for (let i = 0; i <= 15; i++) {
        const t = i / 15;
        const rx = p1_front_bot.x + (p1_front_top.x - p1_front_bot.x) * t;
        const ry = p1_front_bot.y + (p1_front_top.y - p1_front_bot.y) * t;
        ctx.beginPath(); ctx.arc(rx, ry, rockSize / 2, 0, Math.PI * 2); ctx.fill();
    }
    // Crest Top
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const rx = p1_front_top.x + (p1_back_top.x - p1_front_top.x) * t;
        const ry = p1_front_top.y + rockSize / 2;
        ctx.beginPath(); ctx.arc(rx, ry, rockSize / 2, 0, Math.PI * 2); ctx.fill();
    }
    // Back Slope
    for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const rx = p1_back_top.x + (p1_back_bot.x - p1_back_top.x) * t;
        const ry = p1_back_top.y + (p1_back_bot.y - p1_back_top.y) * t;
        ctx.beginPath(); ctx.arc(rx, ry, rockSize / 2, 0, Math.PI * 2); ctx.fill();
    }

    // 4. TOE (Specific Block)
    const toeH = 1.5 * Dn50 * ppt;
    const toeW = 3.0 * Dn50 * ppt;
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.moveTo(xSlopeBase, baseY);
    ctx.lineTo(xSlopeBase - toeH, baseY - toeH);
    ctx.lineTo(xSlopeBase - toeH - toeW, baseY - toeH);
    ctx.lineTo(xSlopeBase - toeH - toeW - toeH, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Label Toe
    ctx.fillStyle = '#FFF'; ctx.textAlign = 'center';
    ctx.font = '12px Inter';
    ctx.fillText('Toe', xSlopeBase - toeW, baseY - toeH - 5);

    // 5. SEABED Line
    ctx.strokeStyle = '#607D8B'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(canvasW, baseY); ctx.stroke();

    // Define positions for Dimensioning
    const xToeInner = xSlopeBase;
    const xToeFlatLeft = xSlopeBase - toeH - toeW;
    const xToeFlatRight = xSlopeBase - toeH;
    const xToeOuterForDim = xToeFlatLeft;
    const xToeInnerForDim = xToeFlatRight;
    const toeWidthLabel = toeW / ppt;

    // --- BULLNOSE / WAVE WALL ---
    // If enabled, draw concrete block on crest (Revetment)
    const hasBullnose = document.getElementById('hasBullnose')?.checked;
    if (hasBullnose) {
        const bnWidth = parseFloat(document.getElementById('bullnoseWidth')?.value || 1.0) * ppt;
        const bnHeight = parseFloat(document.getElementById('bullnoseHeight')?.value || 1.2) * ppt;

        // Position: At the internal edge of the crest (Reclamation/Land side)
        // Similar to standard breakwater, but usually acts as retaining wall for reclamation.
        const yBase = baseY - H_px;
        const xEdge = xReclamationEdge;
        const xLeftEdge = xEdge - bnWidth;

        ctx.fillStyle = '#90A4AE'; // Concrete color
        ctx.strokeStyle = '#546E7A';
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Draw resting on top of the armour/filter layer at crest level
        // Rect from (xLeftEdge, yBase - bnHeight) to (xEdge, yBase)
        ctx.rect(xLeftEdge, yBase - bnHeight, bnWidth, bnHeight);
        ctx.fill();
        ctx.stroke();

        // Label Bullnose
        ctx.fillStyle = '#ECEFF1';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Crown Wall', xLeftEdge + bnWidth / 2, yBase - bnHeight - 5);
    }

    // 6. WATER LEVEL
    const waterY = baseY - (waterDepth * ppt);
    ctx.strokeStyle = '#29B6F6'; ctx.lineWidth = 2; ctx.setLineDash([10, 5]);
    ctx.beginPath(); ctx.moveTo(0, waterY); ctx.lineTo(canvasW, waterY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#29B6F6'; ctx.fillText('DWL', 20, waterY - 5);

    // 7. DIMENSIONS (Overlay)
    drawDimensionsRevetment({
        ppt,
        baseY,
        xSlopeBase,
        xCrestLeft,
        xReclamationEdge,
        H: H_px,
        DW: waterDepth,
        RC: crestElev,
        Slope: slope,
        CW: crestWidth,
        WD: waterDepth,
        WD: waterDepth,
        xToeOuter: xToeOuterForDim,
        xToeInner: xToeInnerForDim,
        ToeW: toeWidthLabel
    });
}

function drawDimensionsRevetment(data) {
    const { ppt, baseY, xSlopeBase, xCrestLeft, xReclamationEdge, H, RC, Slope, CW, xToeOuter, xToeInner, ToeW } = data;
    const ctx = canvas.getContext('2d');

    // Helper arrow
    const arrow = (x1, y1, x2, y2, text, off = 0) => {
        // ... simple arrow logic implementation ...
        // Re-using context from parent scope or standard draw logic?
        // Let's just simplistic draw.
        ctx.strokeStyle = '#FFD740'; ctx.fillStyle = '#FFD740';
        ctx.beginPath(); ctx.moveTo(x1, y1 + off); ctx.lineTo(x2, y2 + off); ctx.stroke();
        ctx.fillText(text, (x1 + x2) / 2, y1 + off - 5);
    };

    // Crest Width
    arrow(xCrestLeft, baseY - H, xReclamationEdge, baseY - H, `${CW.toFixed(2)}m`, -10);

    // Slope
    ctx.fillText(`1:${Slope}`, (xSlopeBase + xCrestLeft) / 2 - 20, baseY - H / 2);

    // RC (Freeboard) 
    // From Water Level to Crest
    // Water Y is defined in parent, let's recalculate or pass it.
    // Assume WD passed is depth.
    const waterY = baseY - (data.WD * ppt);
    const crestY = baseY - H;
    arrow(xCrestLeft - 40, waterY, xCrestLeft - 40, crestY, `Rc=${RC.toFixed(2)}m`, 0);

    // Toe Width
    arrow(xToeOuter, baseY + 20, xToeInner, baseY + 20, `Bt=${ToeW.toFixed(2)}m`, 0);
}

function drawRubbleMoundLowCrested() {
    const baseY = canvas.height * 0.9;
    const waterY = canvas.height * 0.6;
    const centerX = canvas.width / 2;

    // Low-crested structure (crest below water level)
    const crestHeight = (baseY - waterY) * 0.7;
    const crestWidth = 100;
    const baseWidth = 280;

    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.moveTo(centerX - baseWidth / 2, baseY);
    ctx.lineTo(centerX - crestWidth / 2, baseY - crestHeight);
    ctx.lineTo(centerX + crestWidth / 2, baseY - crestHeight);
    ctx.lineTo(centerX + baseWidth / 2, baseY);
    ctx.closePath();
    ctx.fill();

    // Armour
    drawArmourStones(centerX - baseWidth / 2, baseY, centerX - crestWidth / 2, baseY - crestHeight, 15, '#78909c');
    drawArmourStones(centerX + crestWidth / 2, baseY - crestHeight, centerX + baseWidth / 2, baseY, 15, '#78909c');

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// ==========================================
// VERTICAL STRUCTURES
// ==========================================

function drawVerticalWall() {
    const baseY = canvas.height * 0.9;
    const waterY = canvas.height * 0.6;
    const centerX = canvas.width / 2;

    const wallHeight = (baseY - waterY) * 1.4;
    const wallThickness = 40;
    const foundationWidth = 120;
    const foundationDepth = 30;

    // Foundation
    ctx.fillStyle = '#5c6bc0';
    ctx.fillRect(centerX - foundationWidth / 2, baseY, foundationWidth, foundationDepth);

    // Wall
    const gradient = ctx.createLinearGradient(0, baseY - wallHeight, 0, baseY);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(1, '#5c6bc0');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - wallThickness / 2, baseY - wallHeight, wallThickness, wallHeight);

    // Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - wallThickness / 2, baseY - wallHeight, wallThickness, wallHeight);
    ctx.strokeRect(centerX - foundationWidth / 2, baseY, foundationWidth, foundationDepth);

    // Wall pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        const y = baseY - (wallHeight / 10) * i;
        ctx.beginPath();
        ctx.moveTo(centerX - wallThickness / 2, y);
        ctx.lineTo(centerX + wallThickness / 2, y);
        ctx.stroke();
    }
}

function drawCompositeStructure() {
    const baseY = canvas.height * 0.9;
    const waterY = canvas.height * 0.6;
    const centerX = canvas.width / 2;

    // Rubble mound base
    const baseHeight = (baseY - waterY) * 0.5;
    const baseWidth = 200;

    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.moveTo(centerX - baseWidth / 2, baseY);
    ctx.lineTo(centerX - 60, baseY - baseHeight);
    ctx.lineTo(centerX + 60, baseY - baseHeight);
    ctx.lineTo(centerX + baseWidth / 2, baseY);
    ctx.closePath();
    ctx.fill();

    // Armour on base
    drawArmourStones(centerX - baseWidth / 2, baseY, centerX - 60, baseY - baseHeight, 15, '#78909c');

    // Vertical wall on top
    const wallHeight = (baseY - waterY) * 0.9;
    const wallThickness = 35;

    const gradient = ctx.createLinearGradient(0, baseY - wallHeight, 0, baseY - baseHeight);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(1, '#5c6bc0');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - wallThickness / 2, baseY - wallHeight, wallThickness, wallHeight - baseHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - wallThickness / 2, baseY - wallHeight, wallThickness, wallHeight - baseHeight);
}

function drawCaisson() {
    const baseY = canvas.height * 0.9;
    const waterY = canvas.height * 0.6;
    const centerX = canvas.width / 2;

    const caissonWidth = 100;
    const caissonHeight = (baseY - waterY) * 1.3;
    const foundationWidth = 140;
    const foundationHeight = 40;

    // Rubble foundation
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.moveTo(centerX - foundationWidth / 2, baseY);
    ctx.lineTo(centerX - caissonWidth / 2, baseY - foundationHeight);
    ctx.lineTo(centerX + caissonWidth / 2, baseY - foundationHeight);
    ctx.lineTo(centerX + foundationWidth / 2, baseY);
    ctx.closePath();
    ctx.fill();

    // Caisson body
    const gradient = ctx.createLinearGradient(0, baseY - caissonHeight - foundationHeight, 0, baseY - foundationHeight);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(0.5, '#5c6bc0');
    gradient.addColorStop(1, '#546e7a');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - caissonWidth / 2, baseY - caissonHeight - foundationHeight, caissonWidth, caissonHeight);

    // Caisson chambers
    const chamberWidth = 30;
    const chamberHeight = 40;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let i = 0; i < 2; i++) {
        const x = centerX - caissonWidth / 2 + 15 + i * 45;
        for (let j = 0; j < 4; j++) {
            const y = baseY - foundationHeight - 50 - j * 50;
            ctx.fillRect(x, y, chamberWidth, chamberHeight);
        }
    }

    // Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - caissonWidth / 2, baseY - caissonHeight - foundationHeight, caissonWidth, caissonHeight);
}

function drawPerforatedCaisson() {
    drawCaisson(); // Start with regular caisson

    const baseY = canvas.height * 0.9;
    const waterY = canvas.height * 0.6;
    const centerX = canvas.width / 2;
    const caissonWidth = 100;
    const foundationHeight = 40;

    // Draw perforations on front face
    ctx.fillStyle = 'rgba(10, 132, 255, 0.4)';
    const perfSize = 8;
    const spacing = 15;

    for (let y = baseY - foundationHeight - 30; y > waterY - 50; y -= spacing) {
        for (let x = centerX - caissonWidth / 2 + 10; x < centerX + caissonWidth / 2 - 10; x += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, perfSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function drawArmourStones(x1, y1, x2, y2, stoneSize, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const numStones = Math.floor(length / stoneSize);

    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i < numStones; i++) {
        const t = i / numStones;
        const x = x1 + dx * t + (Math.random() - 0.5) * stoneSize * 0.3;
        const y = y1 + dy * t + (Math.random() - 0.5) * stoneSize * 0.3;
        const size = stoneSize * (0.8 + Math.random() * 0.4);

        // Irregular polygon for stone
        ctx.beginPath();
        const sides = 5 + Math.floor(Math.random() * 3);
        for (let j = 0; j < sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const r = size * (0.7 + Math.random() * 0.3);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawCoralTexture(x, y, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 30; i++) {
        const cx = x + Math.random() * width;
        const cy = y + Math.random() * height;
        const radius = 3 + Math.random() * 5;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawDimensions(templateName) {
    if (!canvas.drawingData) return;

    // Destructure new properties (SW_L, SW_R)
    const { ppt, baseY, centerX, H, CW, SW_L, SW_R, TH, inputs } = canvas.drawingData;

    // Helper function to format numbers: max 3 decimals, no trailing zeros
    const fmt = (num) => {
        return parseFloat(num.toFixed(3)).toString();
    };

    ctx.strokeStyle = '#FFD740';
    ctx.fillStyle = '#FFD740';
    ctx.lineWidth = 1.5;
    ctx.font = '12px Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.setLineDash([]);

    // Helper arrow
    const arrow = (x1, y1, x2, y2, text, offset = 0) => {
        const dx = x2 - x1; const dy = y2 - y1;
        const L = Math.sqrt(dx * dx + dy * dy);
        if (L < 1) return;
        const nx = -dy / L; const ny = dx / L;
        const tx1 = x1 + nx * offset; const ty1 = y1 + ny * offset;
        const tx2 = x2 + nx * offset; const ty2 = y2 + ny * offset;

        ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke();
        const head = 6; const ang = Math.atan2(ty2 - ty1, tx2 - tx1);
        ctx.beginPath();
        ctx.moveTo(tx1, ty1); ctx.lineTo(tx1 + head * Math.cos(ang + 0.5), ty1 + head * Math.sin(ang + 0.5));
        ctx.moveTo(tx1, ty1); ctx.lineTo(tx1 + head * Math.cos(ang - 0.5), ty1 + head * Math.sin(ang - 0.5));
        ctx.moveTo(tx2, ty2); ctx.lineTo(tx2 - head * Math.cos(ang + 0.5), ty2 - head * Math.sin(ang + 0.5));
        ctx.moveTo(tx2, ty2); ctx.lineTo(tx2 - head * Math.cos(ang - 0.5), ty2 - head * Math.sin(ang - 0.5));
        ctx.stroke();

        const mx = (tx1 + tx2) / 2; const my = (ty1 + ty2) / 2;
        const textW = ctx.measureText(text).width;
        ctx.save();
        ctx.fillStyle = 'rgba(30,30,30,0.8)';
        ctx.fillRect(mx - textW / 2 - 4, my - 8, textW + 8, 16);
        ctx.restore();
        ctx.fillText(text, mx, my);
    };

    // 1. Crest Width (Top)
    arrow(centerX - CW / 2, baseY - H, centerX + CW / 2, baseY - H, `${fmt(inputs.crestWidth)}m`, -30);

    // 2. Structure Height (Vertical Left)
    // Place it to the left of the entire structure (including left toe if any)
    let leftEdgeX = centerX - CW / 2 - (SW_L || 0);
    if (inputs.hasLeftToe) {
        leftEdgeX -= (inputs.toeLeftWidth * ppt);
    }
    const hX = leftEdgeX - 40;

    const totalH = (inputs.crestElevation || 0) + (inputs.waterDepth || 0);
    // --- BULLNOSE / WAVE WALL ---
    // If enabled, draw concrete block on crest
    const hasBullnose = document.getElementById('hasBullnose')?.checked;
    if (hasBullnose) {
        const bnWidth = parseFloat(document.getElementById('bullnoseWidth')?.value || 1.0) * ppt;
        const bnHeight = parseFloat(document.getElementById('bullnoseHeight')?.value || 1.2) * ppt;

        // Position: Usually at the REAR of the crest (Right side of crest top)
        // Top calculation reused from drawAsymmetricProfile logic (yTop = baseY - H)
        const yBase = baseY - H;
        const xRightEdge = centerX + CW / 2;
        const xLeftEdge = xRightEdge - bnWidth;

        ctx.fillStyle = '#90A4AE'; // Concrete color
        ctx.strokeStyle = '#546E7A';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.rect(xLeftEdge, yBase - bnHeight, bnWidth, bnHeight);
        ctx.fill();
        ctx.stroke();

        // Label Bullnose
        ctx.fillStyle = '#ECEFF1';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Crown Wall', xLeftEdge + bnWidth / 2, yBase - bnHeight - 5);
    }
    arrow(hX, baseY, hX, baseY - H, `H=${fmt(totalH)}m`, 0);

    // 3. Slopes (Angle indicator)
    // Left
    if (inputs.slopeLeft) {
        const slX = centerX - CW / 2 - SW_L * 0.6;
        const slY = baseY - H * 0.4;
        ctx.fillText(`1:${fmt(inputs.slopeLeft)}`, slX, slY);
    }
    // Right
    if (inputs.slopeRight) {
        const srX = centerX + CW / 2 + SW_R * 0.6;
        const srY = baseY - H * 0.4;
        ctx.fillText(`1:${fmt(inputs.slopeRight)}`, srX, srY);
    }

    // 4. Toes
    // Right Toe
    if (inputs.hasRightToe) {
        const rtBaseX = centerX + CW / 2 + SW_R;
        const TW = inputs.toeRightWidth * ppt;
        const innerX = rtBaseX - (TH * inputs.slopeRight);
        const outerX = innerX + TW;

        arrow(innerX, baseY - TH - 15, outerX, baseY - TH - 15, `B=${fmt(inputs.toeRightWidth)}m`, 0);
        arrow(outerX + 20, baseY, outerX + 20, baseY - TH, `t=${fmt(inputs.toeThickness)}m`, 0);
    }

    // Left Toe
    if (inputs.hasLeftToe) {
        const ltBaseX = centerX - CW / 2 - SW_L;
        const TW = inputs.toeLeftWidth * ppt;
        // Project INWARD (Rightward) from base for top inner
        // Left Side: BaseX is outer-most of main slope.
        // Inner Top X = BaseX + (TH * Slope).
        const innerX = ltBaseX + (TH * inputs.slopeLeft);
        const outerX = innerX - TW;

        arrow(innerX, baseY - TH - 15, outerX, baseY - TH - 15, `B=${fmt(inputs.toeLeftWidth)}m`, 0);
    }
}



// ==========================================
// CANVAS CONTROLS
// ==========================================

function canvasZoom(factor) {
    canvasScale *= factor;
    drawStructureOnCanvas(AppState.selectedTemplate);
}

function resetCanvasView() {
    canvasScale = 1;
    canvasOffset = { x: 0, y: 0 };
    drawStructureOnCanvas(AppState.selectedTemplate);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvas);
} else {
    initCanvas();
}

// Export functions to window for access from other scripts
window.initCanvas = initCanvas;
window.drawStructureOnCanvas = drawStructureOnCanvas;
window.canvasZoom = canvasZoom;
window.resetCanvasView = resetCanvasView;

