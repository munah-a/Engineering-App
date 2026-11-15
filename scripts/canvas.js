// ==========================================
// CANVAS DRAWING FOR STRUCTURE VISUALIZATION
// ==========================================

let canvas, ctx;
let canvasScale = 1;
let canvasOffset = { x: 0, y: 0 };

function _getCanvasControl(key) {
    if (typeof document === 'undefined') return null;
    if (typeof window !== 'undefined' && typeof window.getDesignInput === 'function') {
        return window.getDesignInput(key);
    }
    return document.getElementById(`design_${key}`) || document.getElementById(key);
}

function _designVal(key, fallback) {
    if (typeof window !== 'undefined' && typeof window.getDesignValue === 'function') {
        const val = window.getDesignValue(key, fallback);
        return Number.isFinite(val) ? val : fallback;
    }
    const el = _getCanvasControl(key);
    if (!el) return fallback;
    if (el.dataset && el.dataset.siValue !== undefined) {
        const si = parseFloat(el.dataset.siValue);
        if (Number.isFinite(si)) return si;
    }
    const parsed = parseFloat(el.value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function _designInt(key, fallback) {
    const val = _designVal(key, fallback);
    return Number.isFinite(val) ? Math.round(val) : fallback;
}

function _designBool(key, fallback) {
    const el = _getCanvasControl(key);
    if (!el) return fallback;
    if (el.type === 'checkbox') return Boolean(el.checked);
    return fallback;
}

function _designStr(key, fallback) {
    const el = _getCanvasControl(key);
    return el && el.value !== undefined && el.value !== '' ? String(el.value) : fallback;
}

function _syncCanvasSize() {
    if (!canvas) return;
    const rect = typeof canvas.getBoundingClientRect === 'function'
        ? canvas.getBoundingClientRect()
        : { width: 0, height: 0 };
    if (rect.width > 0 && rect.height > 0) {
        const targetW = Math.round(rect.width);
        const targetH = Math.round(rect.height);
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
        }
    } else if (!canvas.width || !canvas.height) {
        canvas.width = 800;
        canvas.height = 400;
    }
}

function bindCanvasInteractions() {
    if (!canvas || canvas.dataset.listenersBound === 'true') return;
    canvas.dataset.listenersBound = 'true';
    canvas.style.cursor = 'grab';

    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastPos = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
    });

    if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            canvasOffset.x += e.clientX - lastPos.x;
            canvasOffset.y += e.clientY - lastPos.y;
            lastPos = { x: e.clientX, y: e.clientY };
            const tpl = (typeof AppState !== 'undefined' && AppState.selectedTemplate) || 'rubble-standard';
            drawStructureOnCanvas(tpl);
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            if (canvas) canvas.style.cursor = 'grab';
        });
    }

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        canvasZoom(factor);
    }, { passive: false });
}

// Initialize canvas when available
function initCanvas() {
    if (typeof document === 'undefined') return;
    canvas = document.getElementById('designCanvas');
    if (!canvas) {
        return;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    _syncCanvasSize();
    bindCanvasInteractions();

    const tpl = (typeof AppState !== 'undefined' && AppState.selectedTemplate) || 'rubble-standard';
    drawStructureOnCanvas(tpl);
}

// ==========================================
// DRAWING FUNCTIONS
// ==========================================

function drawStructureOnCanvas(templateName) {
    if (typeof document === 'undefined') return;
    if (!canvas || !ctx) {
        initCanvas();
        if (!canvas || !ctx) return;
    }

    _syncCanvasSize();
    const activeTemplate = templateName || (typeof AppState !== 'undefined' && AppState.selectedTemplate) || 'rubble-standard';
    canvas.drawingData = null;

    // Clear canvas & draw static background + grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    // Apply zoom and pan around canvas center
    ctx.save();
    ctx.translate(canvas.width / 2 + canvasOffset.x, canvas.height / 2 + canvasOffset.y);
    ctx.scale(canvasScale, canvasScale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    try {
        switch (activeTemplate) {
            case 'rubble-standard':
            case 'rubble-bullnose':
                drawRubbleMoundStandard(activeTemplate);
                break;
            case 'rubble-berm':
                drawRubbleMoundBerm();
                break;
            case 'rubble-reef':
                drawRubbleMoundReef();
                break;
            case 'rubble-low':
                drawRubbleMoundLowCrested();
                break;
            case 'rubble-revetment':
                drawRubbleMoundRevetment();
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
            case 'custom':
                drawCustomStructure();
                break;
            default:
                drawRubbleMoundStandard(activeTemplate);
        }

        if (activeTemplate === 'rubble-standard' || activeTemplate === 'rubble-bullnose') {
            drawDimensions(activeTemplate);
        }
    } finally {
        ctx.restore();
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
// SHARED CANVAS HELPERS
// ==========================================

function _drawSeabed(baseY) {
    const xStart = -2000;
    const width = canvas.width + 4000;
    ctx.fillStyle = '#263238';
    ctx.fillRect(xStart, baseY, width, canvas.height - baseY + 2000);
    ctx.beginPath();
    ctx.moveTo(xStart, baseY);
    ctx.lineTo(xStart + width, baseY);
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function _drawSWL(waterLevelY, baseY, label = 'SWL') {
    const xStart = -2000;
    const width = canvas.width + 4000;

    if (waterLevelY < baseY) {
        ctx.fillStyle = 'rgba(41, 182, 246, 0.1)';
        ctx.fillRect(xStart, waterLevelY, width, baseY - waterLevelY);
    }

    ctx.strokeStyle = '#29B6F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(xStart, waterLevelY);
    ctx.lineTo(xStart + width, waterLevelY);
    ctx.stroke();
    ctx.setLineDash([]);

    const symX = canvas.width * 0.12;
    ctx.fillStyle = '#29B6F6';
    ctx.beginPath();
    ctx.moveTo(symX - 8, waterLevelY);
    ctx.lineTo(symX + 8, waterLevelY);
    ctx.lineTo(symX, waterLevelY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, symX + 12, waterLevelY + 6);
}

function _drawDimArrow(x1, y1, x2, y2, text, offset = 0) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.sqrt(dx * dx + dy * dy);
    if (L < 2) return;

    const nx = -dy / L;
    const ny = dx / L;
    const tx1 = x1 + nx * offset;
    const ty1 = y1 + ny * offset;
    const tx2 = x2 + nx * offset;
    const ty2 = y2 + ny * offset;

    ctx.save();
    ctx.strokeStyle = '#FFD740';
    ctx.fillStyle = '#FFD740';
    ctx.lineWidth = 1.5;
    ctx.font = '12px Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(tx1, ty1);
    ctx.lineTo(tx2, ty2);
    ctx.stroke();

    const head = 6;
    const ang = Math.atan2(ty2 - ty1, tx2 - tx1);
    ctx.beginPath();
    ctx.moveTo(tx1, ty1);
    ctx.lineTo(tx1 + head * Math.cos(ang + 0.5), ty1 + head * Math.sin(ang + 0.5));
    ctx.moveTo(tx1, ty1);
    ctx.lineTo(tx1 + head * Math.cos(ang - 0.5), ty1 + head * Math.sin(ang - 0.5));
    ctx.moveTo(tx2, ty2);
    ctx.lineTo(tx2 - head * Math.cos(ang + 0.5), ty2 - head * Math.sin(ang + 0.5));
    ctx.moveTo(tx2, ty2);
    ctx.lineTo(tx2 - head * Math.cos(ang - 0.5), ty2 - head * Math.sin(ang - 0.5));
    ctx.stroke();

    const mx = (tx1 + tx2) / 2;
    const my = (ty1 + ty2) / 2;
    const textW = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(15, 20, 25, 0.85)';
    ctx.fillRect(mx - textW / 2 - 4, my - 8, textW + 8, 16);
    ctx.fillStyle = '#FFD740';
    ctx.fillText(text, mx, my);
    ctx.restore();
}

function _fmtDim(num) {
    return parseFloat(Number(num || 0).toFixed(2)).toString();
}

// ==========================================
// RUBBLE MOUND STRUCTURES
// ==========================================

function drawRubbleMoundStandard(templateName = 'rubble-standard') {
    const armourDn50 = Math.max(0.1, _designVal('armourDn50', 1.2));
    const filterRatio = Math.max(1, _designVal('filterWeightRatio', 10));
    const toeRatio = Math.max(1, _designVal('toeWeightRatio', 10));
    const Dn50_filter = armourDn50 / Math.pow(filterRatio, 1 / 3);
    const Dn50_toe = armourDn50 / Math.pow(toeRatio, 1 / 3);
    const crestWidthMultiplier = Math.max(1, _designInt('crestWidthMultiplier', 3));
    const toeWidthMultiplier = Math.max(1, _designInt('toeWidthMultiplier', 4));

    const inputs = {
        crestElevation: _designVal('crestHeight', 2.8),
        crestWidthMultiplier,
        armourDn50,
        crestWidth: crestWidthMultiplier * armourDn50,
        slopeLeft: Math.max(0.5, _designVal('slopeLeft', _designVal('slope', 1.5))),
        slopeRight: Math.max(0.5, _designVal('slopeRight', _designVal('slope', 1.5))),
        layerCount: Math.max(1, _designInt('layerCount', 3)),
        hasLeftToe: _designBool('hasLeftToe', true),
        toeSlopeLeft: Math.max(0.5, _designVal('toeSlopeLeft', 1.5)),
        hasRightToe: _designBool('hasRightToe', true),
        toeSlopeRight: Math.max(0.5, _designVal('toeSlopeRight', 1.5)),
        waterDepth: Math.max(0.5, _designVal('depth', 3.5))
    };

    inputs.toeLeftWidth = toeWidthMultiplier * Dn50_toe;
    inputs.toeRightWidth = toeWidthMultiplier * Dn50_toe;

    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const angleL = Math.atan(1 / inputs.slopeLeft);
    const angleR = Math.atan(1 / inputs.slopeRight);
    const structureHeightM = Math.max(0.5, inputs.waterDepth + inputs.crestElevation);

    const maxSlope = Math.max(inputs.slopeLeft, inputs.slopeRight);
    const totalWidthM = inputs.crestWidth + 2 * (maxSlope * structureHeightM) + inputs.toeLeftWidth + inputs.toeRightWidth + 10;
    const totalHeightM = structureHeightM + 5;

    const scaleX = (canvas.width * 0.86) / Math.max(1, totalWidthM);
    const scaleY = (canvas.height * 0.78) / Math.max(1, totalHeightM);
    const ppt = Math.min(scaleX, scaleY);

    const H = structureHeightM * ppt;
    const CW = inputs.crestWidth * ppt;
    const WD = inputs.waterDepth * ppt;
    const SW_L = (structureHeightM * inputs.slopeLeft) * ppt;
    const SW_R = (structureHeightM * inputs.slopeRight) * ppt;

    const n_armour = Math.max(1, _designInt('armourLayers', 2));
    const n_filter = Math.max(1, _designInt('filterLayers', 2));
    const n_toe = Math.max(1, _designInt('toeLayers', 2));
    const k_delta = 1.0;

    inputs.toeThickness = n_toe * k_delta * Dn50_toe;
    const TH = inputs.toeThickness * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H, CW, SW_L, SW_R, TH, inputs, WD };

    // 1. SEABED
    _drawSeabed(baseY);

    const drawAsymmetricProfile = (offY, dx_L, dx_R, color, stroke) => {
        const yTop = baseY - H + offY;
        if (yTop > baseY) return;

        const xBaseLeft = (centerX - CW / 2 - SW_L) + dx_L;
        const xBaseRight = (centerX + CW / 2 + SW_R) - dx_R;
        const dy = H - offY;
        const xTopLeft = xBaseLeft + (dy * inputs.slopeLeft);
        const xTopRight = xBaseRight - (dy * inputs.slopeRight);

        if (xTopLeft >= xTopRight) return;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(xBaseLeft, baseY);
        ctx.lineTo(xTopLeft, yTop);
        ctx.lineTo(xTopRight, yTop);
        ctx.lineTo(xBaseRight, baseY);
        ctx.closePath();
        ctx.fill();
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    };

    const t_armour = n_armour * k_delta * inputs.armourDn50 * ppt;
    const t_filter = n_filter * k_delta * Dn50_filter * ppt;
    const dx_armour_L = t_armour / Math.sin(angleL);
    const dx_armour_R = t_armour / Math.sin(angleR);
    const dx_filter_L = t_filter / Math.sin(angleL);
    const dx_filter_R = t_filter / Math.sin(angleR);

    // 1. ARMOUR
    drawAsymmetricProfile(0, 0, 0, '#455A64', '#263238');

    // 2. INNER LAYERS
    if (inputs.layerCount >= 2) {
        if (inputs.layerCount === 2) {
            drawAsymmetricProfile(t_armour, dx_armour_L, dx_armour_R, '#B0BEC5', '#37474F');
        } else {
            drawAsymmetricProfile(t_armour, dx_armour_L, dx_armour_R, '#78909C', '#263238');
            drawAsymmetricProfile(t_armour + t_filter, dx_armour_L + dx_filter_L, dx_armour_R + dx_filter_R, '#B0BEC5', '#37474F');
        }
    }

    // 3. TOES
    const drawToe = (side) => {
        const isRight = side === 1;
        if (!(isRight ? inputs.hasRightToe : inputs.hasLeftToe)) return;

        const width = isRight ? inputs.toeRightWidth : inputs.toeLeftWidth;
        const slope = isRight ? inputs.toeSlopeRight : inputs.toeSlopeLeft;
        const mainSlope = isRight ? inputs.slopeRight : inputs.slopeLeft;
        const TW = width * ppt;
        const baseX = centerX + (side * CW / 2) + (side * (isRight ? SW_R : SW_L));
        const innerTopX = baseX - (side * (TH * mainSlope));
        const topY = baseY - TH;
        const outerTopX = innerTopX + (side * TW);
        const outerBaseX = outerTopX + (side * (TH * slope));

        ctx.fillStyle = '#546E7A';
        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerTopX, topY);
        ctx.lineTo(outerTopX, topY);
        ctx.lineTo(outerBaseX, baseY);
        ctx.lineTo(baseX, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    drawToe(1);
    drawToe(-1);

    // 4. BULLNOSE / CROWN WALL (when enabled or bullnose template)
    const hasBullnose = _designBool('hasBullnose', templateName === 'rubble-bullnose');
    if (hasBullnose) {
        const bnWidth = Math.max(0.3, _designVal('bullnoseWidth', 1.0)) * ppt;
        const bnHeight = Math.max(0.3, _designVal('bullnoseHeight', 1.2)) * ppt;
        const yBase = baseY - H;
        const xRightEdge = centerX + CW / 2;
        const xLeftEdge = xRightEdge - Math.min(bnWidth, CW);

        ctx.fillStyle = '#90A4AE';
        ctx.strokeStyle = '#CFD8DC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(xLeftEdge, yBase - bnHeight, xRightEdge - xLeftEdge, bnHeight);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ECEFF1';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Crown Wall', (xLeftEdge + xRightEdge) / 2, yBase - bnHeight - 8);
    }

    // 5. WATER LEVEL
    const waterLevelY = baseY - WD;
    canvas.waterLevelY = waterLevelY;
    _drawSWL(waterLevelY, baseY);
}

function drawRubbleMoundBerm() {
    const waterDepth = Math.max(0.5, _designVal('depth', 6.0));
    const crestElev = _designVal('crestHeight', 4.0);
    const slopeLeft = Math.max(0.5, _designVal('slopeLeft', 2.0));
    const slopeRight = Math.max(0.5, _designVal('slopeRight', 1.5));
    const bermWidth = Math.max(1.0, _designVal('bermWidth', 8.0));
    const bermElev = _designVal('bermElevation', 1.5);
    const Dn50 = Math.max(0.1, _designVal('armourDn50', 0.9));
    const crestWidth = Math.max(3 * Dn50, _designVal('crestWidth', 3 * Dn50));

    const totalH = Math.max(1.0, waterDepth + crestElev);
    const bermH = Math.max(0.4, Math.min(totalH - 0.3, waterDepth + bermElev));
    const upperH = totalH - bermH;

    const lowerRun = bermH * slopeLeft;
    const upperRun = upperH * slopeLeft;
    const rearRun = totalH * slopeRight;
    const totalW = lowerRun + bermWidth + upperRun + crestWidth + rearRun + 6;

    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.84) / totalW, (canvas.height * 0.72) / (totalH + 2));

    const xBaseLeft = centerX - (lowerRun + bermWidth + upperRun + crestWidth - rearRun) * ppt * 0.5;
    const xBermOuter = xBaseLeft + lowerRun * ppt;
    const xBermInner = xBermOuter + bermWidth * ppt;
    const xCrestLeft = xBermInner + upperRun * ppt;
    const xCrestRight = xCrestLeft + crestWidth * ppt;
    const xBaseRight = xCrestRight + rearRun * ppt;

    const yBerm = baseY - bermH * ppt;
    const yCrest = baseY - totalH * ppt;
    const waterY = baseY - waterDepth * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H: totalH * ppt, CW: crestWidth * ppt, WD: waterDepth * ppt };
    _drawSeabed(baseY);

    // Core + berm section
    ctx.fillStyle = '#546e7a';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xBaseLeft, baseY);
    ctx.lineTo(xBermOuter, yBerm);
    ctx.lineTo(xBermInner, yBerm);
    ctx.lineTo(xCrestLeft, yCrest);
    ctx.lineTo(xCrestRight, yCrest);
    ctx.lineTo(xBaseRight, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Berm armour layer highlight
    const armourThickPx = Math.max(6, 2 * Dn50 * ppt);
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(xBermOuter, yBerm, bermWidth * ppt, Math.min(armourThickPx, bermH * ppt * 0.6));

    drawArmourStones(xBaseLeft, baseY, xBermOuter, yBerm, Math.max(8, Dn50 * ppt), '#78909c');
    drawArmourStones(xBermInner, yBerm, xCrestLeft, yCrest, Math.max(8, Dn50 * ppt), '#78909c');

    _drawSWL(waterY, baseY);
    _drawDimArrow(xCrestLeft, yCrest, xCrestRight, yCrest, `Gc=${_fmtDim(crestWidth)}m`, -22);
    _drawDimArrow(xBermOuter, yBerm, xBermInner, yBerm, `Berm=${_fmtDim(bermWidth)}m`, -18);
    _drawDimArrow(xBaseLeft - 28, baseY, xBaseLeft - 28, yCrest, `H=${_fmtDim(totalH)}m`, 0);
}

function drawRubbleMoundReef() {
    const waterDepth = Math.max(0.5, _designVal('depth', 4.0));
    const crestElev = _designVal('crestHeight', -0.5); // Positive = emerged, negative = submerged
    const crestWidth = Math.max(0.5, _designVal('crestWidth', 6.0));
    const slopeLeft = Math.max(0.5, _designVal('slopeLeft', 2.0));
    const slopeRight = Math.max(0.5, _designVal('slopeRight', 2.0));
    const Dn50 = Math.max(0.1, _designVal('armourDn50', 0.6));

    const structH = Math.max(0.3, waterDepth + crestElev);
    const totalW = crestWidth + structH * (slopeLeft + slopeRight) + 6;

    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.84) / totalW, (canvas.height * 0.72) / (Math.max(waterDepth, structH) + 2));

    const CW = crestWidth * ppt;
    const H = structH * ppt;
    const SW_L = structH * slopeLeft * ppt;
    const SW_R = structH * slopeRight * ppt;
    const yCrest = baseY - H;
    const waterY = baseY - waterDepth * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H, CW, SW_L, SW_R, WD: waterDepth * ppt };
    _drawSeabed(baseY);

    ctx.fillStyle = '#8b7355';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - CW / 2 - SW_L, baseY);
    ctx.lineTo(centerX - CW / 2, yCrest);
    ctx.lineTo(centerX + CW / 2, yCrest);
    ctx.lineTo(centerX + CW / 2 + SW_R, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawCoralTexture(centerX - CW / 2 - SW_L * 0.7, yCrest + 4, CW + (SW_L + SW_R) * 0.7, Math.max(10, H - 6));
    drawArmourStones(centerX - CW / 2 - SW_L, baseY, centerX - CW / 2, yCrest, Math.max(7, Dn50 * ppt), '#a1887f');
    drawArmourStones(centerX + CW / 2, yCrest, centerX + CW / 2 + SW_R, baseY, Math.max(7, Dn50 * ppt), '#a1887f');

    _drawSWL(waterY, baseY);
    _drawDimArrow(centerX - CW / 2, yCrest, centerX + CW / 2, yCrest, `Bc=${_fmtDim(crestWidth)}m`, -20);
    _drawDimArrow(centerX - CW / 2 - SW_L - 30, baseY, centerX - CW / 2 - SW_L - 30, yCrest, `hc=${_fmtDim(structH)}m`, 0);
    _drawDimArrow(centerX + CW / 2 + SW_R + 30, baseY, centerX + CW / 2 + SW_R + 30, waterY, `d=${_fmtDim(waterDepth)}m`, 0);
    const rcLabel = crestElev >= 0 ? `Rc=+${_fmtDim(crestElev)}m` : `Subm=${_fmtDim(Math.abs(crestElev))}m`;
    ctx.fillStyle = '#FFD740';
    ctx.font = '12px Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(rcLabel, centerX, Math.min(yCrest, waterY) - 28);
}



function drawRubbleMoundRevetment() {
    const crestElev = _designVal('crestHeight', 2.8);
    const waterDepth = Math.max(0.5, _designVal('depth', 3.5));
    const slope = Math.max(0.5, _designVal('slopeLeft', 2.5));
    const Dn50 = Math.max(0.1, _designVal('armourDn50', 1.0));
    const multiplier = Math.max(1, _designInt('crestWidthMultiplier', 3));
    const crestWidth = multiplier * Dn50;
    const rlValue = _designVal('reclamationLevel', 1.6);

    const canvasH = canvas.height;
    const canvasW = canvas.width;
    const baseY = canvasH * 0.85;
    const totalH = Math.max(0.8, waterDepth + crestElev);
    const estimW = 5 + (slope * totalH) + crestWidth + 15;
    const scaleX = (canvasW * 0.9) / Math.max(1, estimW);
    const scaleY = (canvasH * 0.7) / Math.max(1, totalH + 5);
    const ppt = Math.min(scaleX, scaleY);

    const H_px = totalH * ppt;
    const W_crest_px = crestWidth * ppt;

    const toeRatio = Math.max(1, _designVal('toeWeightRatio', 10));
    const Dn50_toe = Dn50 / Math.pow(toeRatio, 1 / 3);
    const n_toe = Math.max(1, _designInt('toeLayers', 2));
    const toeMult = Math.max(1, _designInt('toeWidthMultiplier', 3));
    const toeH = n_toe * Dn50_toe * ppt;
    const toeW = toeMult * Dn50_toe * ppt;

    const xReclamationEdge = canvasW * 0.7;
    const xCrestLeft = xReclamationEdge - W_crest_px;
    const dx_slope = slope * H_px;
    const xSlopeBase = xCrestLeft - dx_slope;

    const n_armour = Math.max(1, _designInt('armourLayers', 2));
    const filterRatio = Math.max(1, _designVal('filterWeightRatio', 10));
    const Dn50_filter = Dn50 / Math.pow(filterRatio, 1 / 3);
    const n_filter = Math.max(1, _designInt('filterLayers', 2));
    const t_armour_px = n_armour * Dn50 * ppt;
    const t_filter_px = Math.max(t_armour_px * 0.5, n_filter * Dn50_filter * ppt);

    const H_rec_total = Math.max(0.2, waterDepth + rlValue);
    const H_rec_px = H_rec_total * ppt;
    const yReclamation = baseY - H_rec_px;

    const p1_front_bot = { x: xSlopeBase, y: baseY };
    const p1_front_top = { x: xCrestLeft, y: baseY - H_px };
    const xCrestRight = xCrestLeft + W_crest_px;
    const p1_back_top = { x: xCrestRight, y: baseY - H_px };

    const dy_back = Math.max(0.01, H_px - H_rec_px);
    const dx_back = dy_back * slope;
    const xBackToe = xCrestRight + dx_back;
    const p1_back_bot = { x: xBackToe, y: yReclamation };

    const angleFront = Math.atan2(H_px, dx_slope);
    const getFrontInteractX = (yTarget, t_offset) => {
        const dx_shift = t_offset / Math.max(0.05, Math.sin(angleFront));
        return p1_front_bot.x + dx_shift + (p1_front_bot.y - yTarget) / Math.max(0.05, Math.tan(angleFront));
    };

    const angleBack = Math.atan2(dy_back, dx_back);
    const getBackInteractX = (yTarget, t_offset) => {
        const dx_shift = t_offset / Math.max(0.05, Math.sin(angleBack));
        return p1_back_top.x - dx_shift + (yTarget - p1_back_top.y) / Math.max(0.05, Math.tan(angleBack));
    };

    const y_P2_top = p1_front_top.y + t_armour_px;
    const p2_front_top = { x: getFrontInteractX(y_P2_top, t_armour_px), y: y_P2_top };
    const p2_back_top = { x: getBackInteractX(y_P2_top, t_armour_px), y: y_P2_top };
    const p2_front_bot = { x: getFrontInteractX(baseY, t_armour_px), y: baseY };
    const p2_back_bot = { x: getBackInteractX(yReclamation, t_armour_px), y: yReclamation };

    const yFilterBot = yReclamation + t_filter_px;
    const p_filter_toe_outer_top = { x: xBackToe, y: yReclamation };
    const p_filter_toe_outer_bot = { x: xBackToe, y: yFilterBot };

    const t_total = t_armour_px + t_filter_px;
    const y_P3_top = p1_front_top.y + t_total;
    const p3_front_top = { x: getFrontInteractX(y_P3_top, t_total), y: y_P3_top };
    const p3_back_top = { x: getBackInteractX(y_P3_top, t_total), y: y_P3_top };
    const p3_front_bot = { x: getFrontInteractX(baseY, t_total), y: baseY };
    const p3_back_bot = { x: getBackInteractX(yFilterBot, t_total), y: yFilterBot };

    // 1. RECLAMATION FILL (Right of Structure)
    ctx.fillStyle = '#d7ccc8';
    ctx.beginPath();
    ctx.moveTo(xBackToe, yReclamation);
    ctx.lineTo(canvasW + 2000, yReclamation);
    ctx.lineTo(canvasW + 2000, canvasH + 2000);
    ctx.lineTo(xBackToe, canvasH + 2000);
    ctx.closePath();
    ctx.fill();

    // 2. SAND CORE (Under Structure)
    ctx.beginPath();
    ctx.moveTo(p3_front_bot.x, p3_front_bot.y);
    ctx.lineTo(p3_front_top.x, p3_front_top.y);
    ctx.lineTo(p3_back_top.x, p3_back_top.y);
    ctx.lineTo(p3_back_bot.x, p3_back_bot.y);
    ctx.lineTo(p_filter_toe_outer_bot.x, p_filter_toe_outer_bot.y);
    ctx.lineTo(xBackToe, canvasH + 2000);
    ctx.lineTo(p3_front_bot.x, canvasH + 2000);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5d4037';
    ctx.font = 'bold 15px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('LAND / RECLAMATION', Math.max(xBackToe, xReclamationEdge) + 30, yReclamation + 28);
    ctx.fillText(`${rlValue >= 0 ? '+' : ''}${rlValue.toFixed(1)}m`, Math.max(xBackToe, xReclamationEdge) + 30, yReclamation - 6);

    // 3. FILTER LAYER
    ctx.fillStyle = '#90A4AE';
    ctx.beginPath();
    ctx.moveTo(p3_front_bot.x, p3_front_bot.y);
    ctx.lineTo(p3_front_top.x, p3_front_top.y);
    ctx.lineTo(p3_back_top.x, p3_back_top.y);
    ctx.lineTo(p3_back_bot.x, p3_back_bot.y);
    ctx.lineTo(p_filter_toe_outer_bot.x, p_filter_toe_outer_bot.y);
    ctx.lineTo(p_filter_toe_outer_top.x, p_filter_toe_outer_top.y);
    ctx.lineTo(p2_back_bot.x, p2_back_bot.y);
    ctx.lineTo(p2_back_top.x, p2_back_top.y);
    ctx.lineTo(p2_front_top.x, p2_front_top.y);
    ctx.lineTo(p2_front_bot.x, p2_front_bot.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#546E7A';
    ctx.stroke();

    // 4. ARMOUR LAYER
    ctx.fillStyle = '#546E7A';
    ctx.beginPath();
    ctx.moveTo(p2_front_bot.x, p2_front_bot.y);
    ctx.lineTo(p2_front_top.x, p2_front_top.y);
    ctx.lineTo(p2_back_top.x, p2_back_top.y);
    ctx.lineTo(p2_back_bot.x, p2_back_bot.y);
    ctx.lineTo(p1_back_bot.x, p1_back_bot.y);
    ctx.lineTo(p1_back_top.x, p1_back_top.y);
    ctx.lineTo(p1_front_top.x, p1_front_top.y);
    ctx.lineTo(p1_front_bot.x, p1_front_bot.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#37474F';
    ctx.stroke();

    const rockSize = Math.max(3, Dn50 * ppt * 0.8);
    ctx.fillStyle = '#455A64';
    for (let i = 0; i <= 15; i++) {
        const t = i / 15;
        const rx = p1_front_bot.x + (p1_front_top.x - p1_front_bot.x) * t;
        const ry = p1_front_bot.y + (p1_front_top.y - p1_front_bot.y) * t;
        ctx.beginPath(); ctx.arc(rx, ry, rockSize / 2, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const rx = p1_front_top.x + (p1_back_top.x - p1_front_top.x) * t;
        const ry = p1_front_top.y + rockSize / 2;
        ctx.beginPath(); ctx.arc(rx, ry, rockSize / 2, 0, Math.PI * 2); ctx.fill();
    }

    // 5. TOE
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.moveTo(xSlopeBase, baseY);
    ctx.lineTo(xSlopeBase - toeH, baseY - toeH);
    ctx.lineTo(xSlopeBase - toeH - toeW, baseY - toeH);
    ctx.lineTo(xSlopeBase - toeH - toeW - toeH, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.font = '12px Inter';
    ctx.fillText('Toe', xSlopeBase - toeH - toeW / 2, baseY - toeH - 6);

    // 6. SEABED Line
    ctx.strokeStyle = '#607D8B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2000, baseY);
    ctx.lineTo(canvasW + 2000, baseY);
    ctx.stroke();

    const xToeFlatLeft = xSlopeBase - toeH - toeW;
    const xToeFlatRight = xSlopeBase - toeH;
    const toeWidthLabel = toeW / ppt;

    // 7. CROWN WALL / BULLNOSE
    if (_designBool('hasBullnose', false)) {
        const bnWidth = Math.max(0.3, _designVal('bullnoseWidth', 1.0)) * ppt;
        const bnHeight = Math.max(0.3, _designVal('bullnoseHeight', 1.2)) * ppt;
        const yBase = baseY - H_px;
        const xEdge = xReclamationEdge;
        const xLeftEdge = xEdge - Math.min(bnWidth, W_crest_px);

        ctx.fillStyle = '#90A4AE';
        ctx.strokeStyle = '#CFD8DC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(xLeftEdge, yBase - bnHeight, xEdge - xLeftEdge, bnHeight);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ECEFF1';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Crown Wall', (xLeftEdge + xEdge) / 2, yBase - bnHeight - 6);
    }

    // 8. WATER LEVEL (seaward up to slope)
    const waterY = baseY - (waterDepth * ppt);
    ctx.strokeStyle = '#29B6F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(-2000, waterY);
    ctx.lineTo(xBackToe, waterY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#29B6F6';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('DWL', 20, waterY - 8);

    // 9. DIMENSIONS
    drawDimensionsRevetment({
        ppt,
        baseY,
        xSlopeBase,
        xCrestLeft,
        xReclamationEdge,
        H: H_px,
        RC: crestElev,
        Slope: slope,
        CW: crestWidth,
        WD: waterDepth,
        xToeOuter: xToeFlatLeft,
        xToeInner: xToeFlatRight,
        ToeW: toeWidthLabel
    });
}

function drawDimensionsRevetment(data) {
    const { ppt, baseY, xSlopeBase, xCrestLeft, xReclamationEdge, H, RC, Slope, CW, xToeOuter, xToeInner, ToeW, WD } = data;
    _drawDimArrow(xCrestLeft, baseY - H, xReclamationEdge, baseY - H, `${_fmtDim(CW)}m`, -18);

    ctx.save();
    ctx.fillStyle = '#FFD740';
    ctx.font = '12px Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`1:${_fmtDim(Slope)}`, (xSlopeBase + xCrestLeft) / 2 - 20, baseY - H / 2);
    ctx.restore();

    const waterY = baseY - (WD * ppt);
    const crestY = baseY - H;
    _drawDimArrow(xCrestLeft - 40, waterY, xCrestLeft - 40, crestY, `Rc=${_fmtDim(RC)}m`, 0);
    _drawDimArrow(xToeOuter, baseY + 20, xToeInner, baseY + 20, `Bt=${_fmtDim(ToeW)}m`, 0);
}

function drawRubbleMoundLowCrested() {
    const waterDepth = Math.max(0.5, _designVal('depth', 5.0));
    const crestElev = _designVal('crestHeight', 0.5);
    const crestWidth = Math.max(0.5, _designVal('crestWidth', 4.0));
    const slopeLeft = Math.max(0.5, _designVal('slopeLeft', 2.0));
    const slopeRight = Math.max(0.5, _designVal('slopeRight', 1.5));
    const Dn50 = Math.max(0.1, _designVal('armourDn50', 0.8));
    const hasBullnose = _designBool('hasBullnose', false);

    const structH = Math.max(0.4, waterDepth + crestElev);
    const totalW = crestWidth + structH * (slopeLeft + slopeRight) + 6;
    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.84) / totalW, (canvas.height * 0.72) / (Math.max(waterDepth, structH) + 2));

    const CW = crestWidth * ppt;
    const H = structH * ppt;
    const SW_L = structH * slopeLeft * ppt;
    const SW_R = structH * slopeRight * ppt;
    const yCrest = baseY - H;
    const waterY = baseY - waterDepth * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H, CW, SW_L, SW_R, WD: waterDepth * ppt };
    _drawSeabed(baseY);

    ctx.fillStyle = '#546e7a';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - CW / 2 - SW_L, baseY);
    ctx.lineTo(centerX - CW / 2, yCrest);
    ctx.lineTo(centerX + CW / 2, yCrest);
    ctx.lineTo(centerX + CW / 2 + SW_R, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawArmourStones(centerX - CW / 2 - SW_L, baseY, centerX - CW / 2, yCrest, Math.max(7, Dn50 * ppt), '#78909c');
    drawArmourStones(centerX + CW / 2, yCrest, centerX + CW / 2 + SW_R, baseY, Math.max(7, Dn50 * ppt), '#78909c');

    if (hasBullnose) {
        const capW = Math.min(CW, 1.0 * ppt);
        const capH = 0.8 * ppt;
        ctx.fillStyle = '#90A4AE';
        ctx.strokeStyle = '#CFD8DC';
        ctx.fillRect(centerX + CW / 2 - capW, yCrest - capH, capW, capH);
        ctx.strokeRect(centerX + CW / 2 - capW, yCrest - capH, capW, capH);
    }

    _drawSWL(waterY, baseY);
    _drawDimArrow(centerX - CW / 2, yCrest, centerX + CW / 2, yCrest, `Bc=${_fmtDim(crestWidth)}m`, -22);
    _drawDimArrow(centerX - CW / 2 - SW_L - 28, baseY, centerX - CW / 2 - SW_L - 28, yCrest, `H=${_fmtDim(structH)}m`, 0);
    _drawDimArrow(centerX + CW / 2 + SW_R + 28, baseY, centerX + CW / 2 + SW_R + 28, waterY, `d=${_fmtDim(waterDepth)}m`, 0);
}

// ==========================================
// VERTICAL STRUCTURES
// ==========================================

function drawVerticalWall() {
    const wallHeightM = Math.max(1.0, _designVal('wallHeight', 8.0));
    const wallThicknessM = Math.max(0.4, _designVal('wallThickness', 3.0));
    const foundationWidthM = Math.max(wallThicknessM, _designVal('foundationWidth', 6.0));
    const foundationDepthM = Math.max(0.3, _designVal('foundationDepth', 1.5));
    const waterDepthM = Math.max(0.5, _designVal('depth', 6.0));

    const totalH = wallHeightM + foundationDepthM;
    const totalW = Math.max(foundationWidthM, wallThicknessM) + 8;
    const baseY = canvas.height * 0.82;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.8) / totalW, (canvas.height * 0.72) / (Math.max(totalH, waterDepthM) + 2));

    const W_wall = wallThicknessM * ppt;
    const H_wall = wallHeightM * ppt;
    const W_fdn = foundationWidthM * ppt;
    const D_fdn = foundationDepthM * ppt;
    const waterY = baseY - waterDepthM * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H: H_wall, CW: W_wall, WD: waterDepthM * ppt };
    _drawSeabed(baseY);

    // Foundation slab
    ctx.fillStyle = '#5c6bc0';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.fillRect(centerX - W_fdn / 2, baseY, W_fdn, D_fdn);
    ctx.strokeRect(centerX - W_fdn / 2, baseY, W_fdn, D_fdn);

    // Wall body
    const gradient = ctx.createLinearGradient(0, baseY - H_wall, 0, baseY);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(1, '#5c6bc0');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - W_wall / 2, baseY - H_wall, W_wall, H_wall);
    ctx.strokeRect(centerX - W_wall / 2, baseY - H_wall, W_wall, H_wall);

    // Lift lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
        const y = baseY - (H_wall / 8) * i;
        ctx.beginPath();
        ctx.moveTo(centerX - W_wall / 2, y);
        ctx.lineTo(centerX + W_wall / 2, y);
        ctx.stroke();
    }

    _drawSWL(waterY, baseY);
    _drawDimArrow(centerX - W_wall / 2, baseY - H_wall, centerX + W_wall / 2, baseY - H_wall, `B=${_fmtDim(wallThicknessM)}m`, -22);
    _drawDimArrow(centerX - W_fdn / 2 - 28, baseY - H_wall, centerX - W_fdn / 2 - 28, baseY, `Hw=${_fmtDim(wallHeightM)}m`, 0);
    _drawDimArrow(centerX - W_fdn / 2, baseY + D_fdn, centerX + W_fdn / 2, baseY + D_fdn, `Bf=${_fmtDim(foundationWidthM)}m`, 22);
    _drawDimArrow(centerX + W_fdn / 2 + 28, baseY, centerX + W_fdn / 2 + 28, waterY, `d=${_fmtDim(waterDepthM)}m`, 0);
}

function drawCompositeStructure() {
    const waterDepthM = Math.max(0.5, _designVal('depth', 10.0));
    const moundHeightM = Math.max(0.5, _designVal('moundHeight', 4.0));
    const moundWidthM = Math.max(2.0, _designVal('moundWidth', 16.0));
    const moundSlope = Math.max(0.5, _designVal('moundSlope', 2.0));
    const wallHeightM = Math.max(1.0, _designVal('wallHeight', 8.5));
    const wallThicknessM = Math.max(0.5, _designVal('wallThickness', 6.0));
    const Dn50 = Math.max(0.1, _designVal('armourDn50', 0.8));

    const totalH = moundHeightM + wallHeightM;
    const moundBaseW = moundWidthM + 2 * moundHeightM * moundSlope;
    const totalW = moundBaseW + 8;

    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.84) / totalW, (canvas.height * 0.72) / (Math.max(totalH, waterDepthM) + 2));

    const MH = moundHeightM * ppt;
    const MW = moundWidthM * ppt;
    const MBW = moundBaseW * ppt;
    const WH = wallHeightM * ppt;
    const WT = Math.min(MW, wallThicknessM * ppt);
    const waterY = baseY - waterDepthM * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H: MH + WH, CW: WT, WD: waterDepthM * ppt };
    _drawSeabed(baseY);

    // Rubble mound base
    ctx.fillStyle = '#546e7a';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - MBW / 2, baseY);
    ctx.lineTo(centerX - MW / 2, baseY - MH);
    ctx.lineTo(centerX + MW / 2, baseY - MH);
    ctx.lineTo(centerX + MBW / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawArmourStones(centerX - MBW / 2, baseY, centerX - MW / 2, baseY - MH, Math.max(7, Dn50 * ppt), '#78909c');
    drawArmourStones(centerX + MW / 2, baseY - MH, centerX + MBW / 2, baseY, Math.max(7, Dn50 * ppt), '#78909c');

    // Superstructure wall
    const yWallTop = baseY - MH - WH;
    const gradient = ctx.createLinearGradient(0, yWallTop, 0, baseY - MH);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(1, '#5c6bc0');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - WT / 2, yWallTop, WT, WH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeRect(centerX - WT / 2, yWallTop, WT, WH);

    _drawSWL(waterY, baseY);
    _drawDimArrow(centerX - WT / 2, yWallTop, centerX + WT / 2, yWallTop, `Bw=${_fmtDim(wallThicknessM)}m`, -22);
    _drawDimArrow(centerX - MW / 2, baseY - MH, centerX + MW / 2, baseY - MH, `Bm=${_fmtDim(moundWidthM)}m`, 16);
    _drawDimArrow(centerX - MBW / 2 - 28, baseY, centerX - MBW / 2 - 28, yWallTop, `Ht=${_fmtDim(totalH)}m`, 0);
    _drawDimArrow(centerX + MBW / 2 + 28, baseY, centerX + MBW / 2 + 28, waterY, `d=${_fmtDim(waterDepthM)}m`, 0);
}

function drawCaisson() {
    const waterDepthM = Math.max(0.5, _designVal('depth', 12.0));
    const caissonWidthM = Math.max(2.0, _designVal('caissonWidth', 10.0));
    const caissonHeightM = Math.max(2.0, _designVal('caissonHeight', 14.0));
    const wallThicknessM = Math.max(0.2, _designVal('wallThickness', 0.5));
    const cellCount = Math.max(1, Math.min(12, _designInt('cellCount', 4)));
    const foundationHeightM = Math.max(0.3, _designVal('foundationHeight', 2.0));

    const totalH = foundationHeightM + caissonHeightM;
    const fdnShoulder = Math.max(2.0, foundationHeightM * 1.5);
    const fdnBaseW = caissonWidthM + 2 * (fdnShoulder + foundationHeightM * 1.5);
    const totalW = fdnBaseW + 8;

    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.84) / totalW, (canvas.height * 0.72) / (Math.max(totalH, waterDepthM) + 2));

    const CW = caissonWidthM * ppt;
    const CH = caissonHeightM * ppt;
    const FH = foundationHeightM * ppt;
    const FTopW = (caissonWidthM + 2 * fdnShoulder) * ppt;
    const FBW = fdnBaseW * ppt;
    const waterY = baseY - waterDepthM * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H: CH + FH, CW, WD: waterDepthM * ppt };
    _drawSeabed(baseY);

    // Rubble foundation
    ctx.fillStyle = '#546e7a';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - FBW / 2, baseY);
    ctx.lineTo(centerX - FTopW / 2, baseY - FH);
    ctx.lineTo(centerX + FTopW / 2, baseY - FH);
    ctx.lineTo(centerX + FBW / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Caisson outer shell
    const yBodyTop = baseY - FH - CH;
    const xBodyLeft = centerX - CW / 2;
    const gradient = ctx.createLinearGradient(0, yBodyTop, 0, baseY - FH);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(0.5, '#5c6bc0');
    gradient.addColorStop(1, '#546e7a');
    ctx.fillStyle = gradient;
    ctx.fillRect(xBodyLeft, yBodyTop, CW, CH);

    // Internal concrete cells based on actual cellCount
    const wallPx = Math.max(3, Math.min(CW * 0.12, wallThicknessM * ppt));
    const slabPx = Math.max(5, wallPx * 1.4);
    const innerW = Math.max(8, CW - (cellCount + 1) * wallPx);
    const cellW = innerW / cellCount;
    const cellH = Math.max(12, CH - 2 * slabPx);

    ctx.fillStyle = 'rgba(20, 26, 36, 0.45)';
    for (let i = 0; i < cellCount; i++) {
        const cx = xBodyLeft + wallPx + i * (cellW + wallPx);
        ctx.fillRect(cx, yBodyTop + slabPx, cellW, cellH);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(xBodyLeft, yBodyTop, CW, CH);

    _drawSWL(waterY, baseY);
    _drawDimArrow(xBodyLeft, yBodyTop, xBodyLeft + CW, yBodyTop, `Bc=${_fmtDim(caissonWidthM)}m (${cellCount} cells)`, -22);
    _drawDimArrow(centerX - FBW / 2 - 28, baseY - FH, centerX - FBW / 2 - 28, yBodyTop, `Hc=${_fmtDim(caissonHeightM)}m`, 0);
    _drawDimArrow(centerX + FBW / 2 + 28, baseY, centerX + FBW / 2 + 28, waterY, `d=${_fmtDim(waterDepthM)}m`, 0);
}

function drawPerforatedCaisson() {
    const waterDepthM = Math.max(0.5, _designVal('depth', 8.0));
    const wallHeightM = Math.max(2.0, _designVal('wallHeight', 10.5));
    const chamberWidthM = Math.max(0.5, _designVal('chamberWidth', 3.5));
    const wallThicknessM = Math.max(0.2, _designVal('wallThickness', 0.6));
    const perfRatioPct = Math.max(5, Math.min(60, _designVal('perforationRatio', 25)));
    const perfDiamM = Math.max(0.1, _designVal('perforationDiameter', 0.4));
    const foundationWidthM = Math.max(chamberWidthM + 3 * wallThicknessM, _designVal('foundationWidth', 12.0));
    const foundationDepthM = Math.max(0.3, _designVal('foundationDepth', 1.5));

    const caissonWidthM = chamberWidthM + 3 * wallThicknessM + 2.0;
    const totalW = Math.max(foundationWidthM, caissonWidthM) + 8;
    const totalH = wallHeightM + foundationDepthM;

    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.82) / totalW, (canvas.height * 0.72) / (Math.max(totalH, waterDepthM) + 2));

    const CW = caissonWidthM * ppt;
    const WH = wallHeightM * ppt;
    const W_ch = chamberWidthM * ppt;
    const T_w = Math.max(4, wallThicknessM * ppt);
    const W_fdn = foundationWidthM * ppt;
    const D_fdn = foundationDepthM * ppt;
    const waterY = baseY - waterDepthM * ppt;
    const xLeft = centerX - CW / 2;
    const yTop = baseY - WH;

    canvas.drawingData = { ppt, baseY, centerX, H: WH, CW, WD: waterDepthM * ppt };
    _drawSeabed(baseY);

    // Foundation slab
    ctx.fillStyle = '#546e7a';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.fillRect(centerX - W_fdn / 2, baseY, W_fdn, D_fdn);
    ctx.strokeRect(centerX - W_fdn / 2, baseY, W_fdn, D_fdn);

    // Solid caisson rear ballast + frame
    const gradient = ctx.createLinearGradient(0, yTop, 0, baseY);
    gradient.addColorStop(0, '#7e57c2');
    gradient.addColorStop(1, '#5c6bc0');
    ctx.fillStyle = gradient;
    ctx.fillRect(xLeft, yTop, CW, WH);

    // Wave dissipation chamber behind front perforated wall
    const chX = xLeft + T_w;
    const chTopY = yTop + Math.max(6, T_w);
    const chH = Math.max(16, WH - Math.max(12, 2 * T_w));
    ctx.fillStyle = 'rgba(10, 132, 255, 0.16)';
    ctx.fillRect(chX, chTopY, W_ch, chH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.strokeRect(chX, chTopY, W_ch, chH);

    // Front wall perforations scaled to perforationDiameter & perforationRatio
    const holeR = Math.max(2.5, Math.min(T_w * 0.45, perfDiamM * ppt * 0.5));
    const spacingY = Math.max(holeR * 2.8, holeR * (100 / perfRatioPct));
    ctx.fillStyle = 'rgba(41, 182, 246, 0.8)';
    for (let y = chTopY + spacingY * 0.6; y < baseY - T_w - holeR; y += spacingY) {
        ctx.beginPath();
        ctx.arc(xLeft + T_w / 2, y, holeR, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(xLeft, yTop, CW, WH);

    _drawSWL(waterY, baseY);
    _drawDimArrow(chX, chTopY, chX + W_ch, chTopY, `Bch=${_fmtDim(chamberWidthM)}m (p=${_fmtDim(perfRatioPct)}%)`, -18);
    _drawDimArrow(xLeft - 28, baseY, xLeft - 28, yTop, `Hw=${_fmtDim(wallHeightM)}m`, 0);
    _drawDimArrow(centerX + W_fdn / 2 + 28, baseY, centerX + W_fdn / 2 + 28, waterY, `d=${_fmtDim(waterDepthM)}m`, 0);
}

function drawCustomStructure() {
    const family = _designStr('structureFamily', 'rubble');
    if (family === 'vertical') {
        drawVerticalWall();
        return;
    }

    // Custom rubble section reading custom control set directly
    const waterDepth = Math.max(0.5, _designVal('depth', 5.0));
    const crestElev = _designVal('crestHeight', 2.5);
    const crestWidth = Math.max(0.5, _designVal('crestWidth', 3.6));
    const slopeLeft = Math.max(0.5, _designVal('slopeLeft', 1.5));
    const slopeRight = Math.max(0.5, _designVal('slopeRight', 1.5));
    const Dn50 = Math.max(0.1, _designVal('armourDn50', 1.0));

    const structH = Math.max(0.5, waterDepth + crestElev);
    const totalW = crestWidth + structH * (slopeLeft + slopeRight) + 6;
    const baseY = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    const ppt = Math.min((canvas.width * 0.84) / totalW, (canvas.height * 0.72) / (Math.max(structH, waterDepth) + 2));

    const CW = crestWidth * ppt;
    const H = structH * ppt;
    const SW_L = structH * slopeLeft * ppt;
    const SW_R = structH * slopeRight * ppt;
    const yCrest = baseY - H;
    const waterY = baseY - waterDepth * ppt;

    canvas.drawingData = { ppt, baseY, centerX, H, CW, SW_L, SW_R, WD: waterDepth * ppt };
    _drawSeabed(baseY);

    ctx.fillStyle = '#455A64';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - CW / 2 - SW_L, baseY);
    ctx.lineTo(centerX - CW / 2, yCrest);
    ctx.lineTo(centerX + CW / 2, yCrest);
    ctx.lineTo(centerX + CW / 2 + SW_R, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawArmourStones(centerX - CW / 2 - SW_L, baseY, centerX - CW / 2, yCrest, Math.max(7, Dn50 * ppt), '#78909c');
    drawArmourStones(centerX + CW / 2, yCrest, centerX + CW / 2 + SW_R, baseY, Math.max(7, Dn50 * ppt), '#78909c');

    _drawSWL(waterY, baseY);
    _drawDimArrow(centerX - CW / 2, yCrest, centerX + CW / 2, yCrest, `Gc=${_fmtDim(crestWidth)}m`, -22);
    _drawDimArrow(centerX - CW / 2 - SW_L - 28, baseY, centerX - CW / 2 - SW_L - 28, yCrest, `H=${_fmtDim(structH)}m`, 0);
    _drawDimArrow(centerX + CW / 2 + SW_R + 28, baseY, centerX + CW / 2 + SW_R + 28, waterY, `d=${_fmtDim(waterDepth)}m`, 0);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function _deterministicNoise(seed) {
    const val = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return val - Math.floor(val);
}

function drawArmourStones(x1, y1, x2, y2, stoneSize, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const numStones = Math.max(1, Math.floor(length / Math.max(4, stoneSize)));

    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i < numStones; i++) {
        const t = (i + 0.5) / numStones;
        const n1 = _deterministicNoise(i * 3 + 1) - 0.5;
        const n2 = _deterministicNoise(i * 3 + 2) - 0.5;
        const n3 = _deterministicNoise(i * 3 + 3);
        const x = x1 + dx * t + n1 * stoneSize * 0.25;
        const y = y1 + dy * t + n2 * stoneSize * 0.25;
        const size = Math.max(3, stoneSize * (0.75 + n3 * 0.35));

        ctx.beginPath();
        const sides = 5 + (i % 3);
        for (let j = 0; j < sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const r = size * (0.7 + _deterministicNoise(i * 11 + j) * 0.25);
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 24; i++) {
        const cx = x + _deterministicNoise(i * 5 + 1) * width;
        const cy = y + _deterministicNoise(i * 5 + 2) * height;
        const radius = 3 + _deterministicNoise(i * 5 + 3) * 4;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawDimensions(templateName) {
    if (!canvas.drawingData || !canvas.drawingData.inputs) return;

    const { ppt, baseY, centerX, H, CW, SW_L, SW_R, TH, inputs } = canvas.drawingData;

    const fmt = (num) => parseFloat(Number(num).toFixed(3)).toString();

    ctx.save();
    ctx.strokeStyle = '#FFD740';
    ctx.fillStyle = '#FFD740';
    ctx.lineWidth = 1.5;
    ctx.font = '12px Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.setLineDash([]);

    const arrow = (x1, y1, x2, y2, text, offset = 0) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const L = Math.sqrt(dx * dx + dy * dy);
        if (L < 1) return;
        const nx = -dy / L;
        const ny = dx / L;
        const tx1 = x1 + nx * offset;
        const ty1 = y1 + ny * offset;
        const tx2 = x2 + nx * offset;
        const ty2 = y2 + ny * offset;

        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();
        const head = 6;
        const ang = Math.atan2(ty2 - ty1, tx2 - tx1);
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx1 + head * Math.cos(ang + 0.5), ty1 + head * Math.sin(ang + 0.5));
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx1 + head * Math.cos(ang - 0.5), ty1 + head * Math.sin(ang - 0.5));
        ctx.moveTo(tx2, ty2);
        ctx.lineTo(tx2 - head * Math.cos(ang + 0.5), ty2 - head * Math.sin(ang + 0.5));
        ctx.moveTo(tx2, ty2);
        ctx.lineTo(tx2 - head * Math.cos(ang - 0.5), ty2 - head * Math.sin(ang - 0.5));
        ctx.stroke();

        const mx = (tx1 + tx2) / 2;
        const my = (ty1 + ty2) / 2;
        const textW = ctx.measureText(text).width;
        ctx.save();
        ctx.fillStyle = 'rgba(30,30,30,0.85)';
        ctx.fillRect(mx - textW / 2 - 4, my - 8, textW + 8, 16);
        ctx.restore();
        ctx.fillText(text, mx, my);
    };

    // 1. Crest Width
    arrow(centerX - CW / 2, baseY - H, centerX + CW / 2, baseY - H, `${fmt(inputs.crestWidth)}m`, -30);

    // 2. Structure Height & Water Depth
    let leftEdgeX = centerX - CW / 2 - (SW_L || 0);
    if (inputs.hasLeftToe) {
        leftEdgeX -= (inputs.toeLeftWidth * ppt);
    }
    const hX = leftEdgeX - 40;
    const totalH = (inputs.crestElevation || 0) + (inputs.waterDepth || 0);
    arrow(hX, baseY, hX, baseY - H, `H=${fmt(totalH)}m`, 0);

    // 3. Slopes
    if (inputs.slopeLeft) {
        const slX = centerX - CW / 2 - SW_L * 0.6;
        const slY = baseY - H * 0.4;
        ctx.fillText(`1:${fmt(inputs.slopeLeft)}`, slX, slY);
    }
    if (inputs.slopeRight) {
        const srX = centerX + CW / 2 + SW_R * 0.6;
        const srY = baseY - H * 0.4;
        ctx.fillText(`1:${fmt(inputs.slopeRight)}`, srX, srY);
    }

    // 4. Toes
    if (inputs.hasRightToe) {
        const rtBaseX = centerX + CW / 2 + SW_R;
        const TW = inputs.toeRightWidth * ppt;
        const innerX = rtBaseX - (TH * inputs.slopeRight);
        const outerX = innerX + TW;
        arrow(innerX, baseY - TH - 15, outerX, baseY - TH - 15, `B=${fmt(inputs.toeRightWidth)}m`, 0);
        arrow(outerX + 20, baseY, outerX + 20, baseY - TH, `t=${fmt(inputs.toeThickness)}m`, 0);
    }

    if (inputs.hasLeftToe) {
        const ltBaseX = centerX - CW / 2 - SW_L;
        const TW = inputs.toeLeftWidth * ppt;
        const innerX = ltBaseX + (TH * inputs.slopeLeft);
        const outerX = innerX - TW;
        arrow(innerX, baseY - TH - 15, outerX, baseY - TH - 15, `B=${fmt(inputs.toeLeftWidth)}m`, 0);
    }

    ctx.restore();
}

// ==========================================
// CANVAS CONTROLS
// ==========================================

function canvasZoom(factor) {
    const next = canvasScale * factor;
    canvasScale = Math.min(3.0, Math.max(0.4, next));
    const tpl = (typeof AppState !== 'undefined' && AppState.selectedTemplate) || 'rubble-standard';
    drawStructureOnCanvas(tpl);
}

function resetCanvasView() {
    canvasScale = 1;
    canvasOffset = { x: 0, y: 0 };
    const tpl = (typeof AppState !== 'undefined' && AppState.selectedTemplate) || 'rubble-standard';
    drawStructureOnCanvas(tpl);
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCanvas);
    } else {
        initCanvas();
    }
}

if (typeof window !== 'undefined') {
    window.initCanvas = initCanvas;
    window.drawStructureOnCanvas = drawStructureOnCanvas;
    window.canvasZoom = canvasZoom;
    window.resetCanvasView = resetCanvasView;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCanvas,
        drawStructureOnCanvas,
        canvasZoom,
        resetCanvasView
    };
}

