document.addEventListener('DOMContentLoaded', () => {
    // Navigation Tab Controller
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    window.switchTab = function(tabId) {
        navLinks.forEach(link => {
            if (link.dataset.tab === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.dataset.tab;
            switchTab(tabId);
        });
    });

    // Configuration Inputs
    const cacheSizeInput = document.getElementById('cache-size');
    const cacheUnitInput = document.getElementById('cache-unit');
    const blockSizeInput = document.getElementById('block-size');
    const mappingTechInput = document.getElementById('mapping-tech');
    const replacePolicyInput = document.getElementById('replace-policy');
    const policyGroup = document.getElementById('policy-group');
    const addressBitsInput = document.getElementById('address-bits');
    const addressesInput = document.getElementById('addresses');

    // Spec Display Badges
    const specTotalLines = document.getElementById('spec-total-lines');
    const specTotalSets = document.getElementById('spec-total-sets');
    const specOffsetBits = document.getElementById('spec-offset-bits');
    const specIndexBits = document.getElementById('spec-index-bits');
    const specTagBits = document.getElementById('spec-tag-bits');

    // UI Action Buttons
    const runBtn = document.getElementById('run-btn');
    const stepBtn = document.getElementById('step-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Display Sections
    const emptyState = document.getElementById('empty-state');
    const resultsWrapper = document.getElementById('results-wrapper');
    const animationCard = document.getElementById('animation-card');

    // Step Animation Elements
    const animCurrentStep = document.getElementById('anim-current-step');
    const animTotalSteps = document.getElementById('anim-total-steps');
    const animPrevBtn = document.getElementById('anim-prev');
    const animPlayBtn = document.getElementById('anim-play');
    const animNextBtn = document.getElementById('anim-next');
    const animSpeedSelect = document.getElementById('anim-speed');

    const liveAddrDec = document.getElementById('live-addr-dec');
    const liveAddrBin = document.getElementById('live-addr-bin');
    const liveTagVal = document.getElementById('live-tag-val');
    const liveTagBits = document.getElementById('live-tag-bits');
    const liveSetVal = document.getElementById('live-set-val');
    const liveSetBits = document.getElementById('live-set-bits');
    const liveOffsetVal = document.getElementById('live-offset-val');
    const liveOffsetBits = document.getElementById('live-offset-bits');
    const liveStatusBadge = document.getElementById('live-status-badge');
    const liveStatusExp = document.getElementById('live-status-exp');

    // Output Tables
    const cacheTableBody = document.getElementById('cache-table-body');
    const resultsTableBody = document.getElementById('results-table-body');
    const traceCountBadge = document.getElementById('trace-count-badge');

    // Stats Metrics
    const statTotal = document.getElementById('stat-total');
    const statHits = document.getElementById('stat-hits');
    const statMisses = document.getElementById('stat-misses');
    const statHitRatio = document.getElementById('stat-hit-ratio');
    const statMissRatio = document.getElementById('stat-miss-ratio');

    // Charts
    const barHit = document.getElementById('bar-hit');
    const barMiss = document.getElementById('bar-miss');
    const barHitVal = document.getElementById('bar-hit-val');
    const barMissVal = document.getElementById('bar-miss-val');

    const donutHitSegment = document.getElementById('donut-hit-segment');
    const donutMissSegment = document.getElementById('donut-miss-segment');
    const donutCenterText = document.getElementById('donut-center-text');
    const pieHitLabel = document.getElementById('pie-hit-label');
    const pieMissLabel = document.getElementById('pie-miss-label');

    // Step Animation State
    let simulationSteps = [];
    let currentAnimIndex = -1;
    let animTimer = null;

    // Helper: Convert number to padded binary string
    function toBinary(num, bits) {
        if (bits <= 0) return '';
        let bin = (num >>> 0).toString(2);
        if (bin.length < bits) {
            bin = '0'.repeat(bits - bin.length) + bin;
        } else if (bin.length > bits) {
            bin = bin.substring(bin.length - bits);
        }
        return bin;
    }

    // Dynamic Architecture Spec Calculator
    function calculateArchitectureSpecs() {
        const rawCacheSize = parseInt(cacheSizeInput.value) || 16;
        const cacheUnit = cacheUnitInput.value;
        const cacheSizeBytes = cacheUnit === 'kb' ? rawCacheSize * 1024 : rawCacheSize;
        const blockSizeBytes = parseInt(blockSizeInput.value) || 4;
        const mappingTech = mappingTechInput.value;
        const addressBits = parseInt(addressBitsInput.value) || 16;

        let totalLines = Math.floor(cacheSizeBytes / blockSizeBytes);
        if (totalLines < 1) totalLines = 1;

        let numSets = totalLines;
        let linesPerSet = 1;

        if (mappingTech === 'fully') {
            numSets = 1;
            linesPerSet = totalLines;
            policyGroup.style.display = 'block';
        } else if (mappingTech === 'set2') {
            linesPerSet = 2;
            numSets = Math.max(1, Math.floor(totalLines / 2));
            policyGroup.style.display = 'block';
        } else if (mappingTech === 'set4') {
            linesPerSet = 4;
            numSets = Math.max(1, Math.floor(totalLines / 4));
            policyGroup.style.display = 'block';
        } else {
            policyGroup.style.display = 'none';
        }

        const offsetBits = Math.max(1, Math.round(Math.log2(blockSizeBytes)));
        const indexBits = mappingTech === 'fully' ? 0 : Math.max(0, Math.round(Math.log2(numSets)));
        const tagBits = Math.max(0, addressBits - indexBits - offsetBits);

        specTotalLines.textContent = totalLines;
        specTotalSets.textContent = numSets;
        specOffsetBits.textContent = `${offsetBits} bit${offsetBits > 1 ? 's' : ''}`;
        specIndexBits.textContent = `${indexBits} bit${indexBits > 1 ? 's' : ''}`;
        specTagBits.textContent = `${tagBits} bit${tagBits > 1 ? 's' : ''}`;

        return {
            cacheSizeBytes,
            blockSizeBytes,
            totalLines,
            numSets,
            linesPerSet,
            offsetBits,
            indexBits,
            tagBits,
            addressBits,
            mappingTech,
            policy: replacePolicyInput.value
        };
    }

    // Attach Input Event Listeners for Specs Calculator
    [cacheSizeInput, cacheUnitInput, blockSizeInput, mappingTechInput, replacePolicyInput, addressBitsInput].forEach(elem => {
        elem.addEventListener('change', calculateArchitectureSpecs);
        elem.addEventListener('input', calculateArchitectureSpecs);
    });

    // Preset Buttons Handler
    window.loadPreset = function(presetType) {
        if (presetType === 'sample') {
            addressesInput.value = '10, 20, 30, 10, 40, 20, 50, 10';
        } else if (presetType === 'temporal') {
            addressesInput.value = '4, 8, 12, 4, 8, 4, 12, 8';
        } else if (presetType === 'spatial') {
            addressesInput.value = '0, 1, 2, 3, 4, 5, 6, 7';
        } else if (presetType === 'conflict') {
            addressesInput.value = '0, 16, 32, 0, 16, 32, 48';
        }
    };

    // Core Cache Simulation Algorithm
    function runSimulationCore() {
        const specs = calculateArchitectureSpecs();
        const addressStr = addressesInput.value.trim();

        if (!addressStr) {
            alert('Please enter memory addresses.');
            return null;
        }

        const rawAddrs = addressStr.split(/[\s,]+/).map(a => parseInt(a.trim())).filter(a => !isNaN(a) && a >= 0);

        if (rawAddrs.length === 0) {
            alert('Please enter valid non-negative numeric memory addresses.');
            return null;
        }

        // Initialize Cache Data Structure
        // cacheSets = array of Sets, each Set is array of lines
        let cacheSets = [];
        for (let s = 0; s < specs.numSets; s++) {
            let setLines = [];
            for (let l = 0; l < specs.linesPerSet; l++) {
                setLines.push({
                    globalLineIdx: s * specs.linesPerSet + l,
                    setIdx: s,
                    lineInSetIdx: l,
                    valid: 0,
                    tag: '-',
                    data: '-',
                    lastAccessTime: 0,
                    insertionTime: 0
                });
            }
            cacheSets.push(setLines);
        }

        let hits = 0;
        let misses = 0;
        let steps = [];

        rawAddrs.forEach((addr, stepIdx) => {
            const timeStep = stepIdx + 1;
            const blockAddress = Math.floor(addr / specs.blockSizeBytes);
            const offset = addr % specs.blockSizeBytes;

            let setIndex = 0;
            let tag = blockAddress;

            if (specs.mappingTech !== 'fully') {
                setIndex = blockAddress % specs.numSets;
                tag = Math.floor(blockAddress / specs.numSets);
            }

            const binAddr = toBinary(addr, specs.addressBits);
            const binTag = toBinary(tag, specs.tagBits);
            const binSet = toBinary(setIndex, specs.indexBits);
            const binOffset = toBinary(offset, specs.offsetBits);

            const targetSet = cacheSets[setIndex];
            let hitLine = targetSet.find(line => line.valid === 1 && line.tag === tag);
            let isHit = false;
            let actionNote = '';
            let affectedGlobalLineIdx = -1;

            if (hitLine) {
                // CACHE HIT
                isHit = true;
                hits++;
                hitLine.lastAccessTime = timeStep;
                affectedGlobalLineIdx = hitLine.globalLineIdx;
                actionNote = `Hit in Set ${setIndex}, Line ${hitLine.lineInSetIdx}`;
            } else {
                // CACHE MISS
                misses++;

                // Search for empty line in target set
                let emptyLine = targetSet.find(line => line.valid === 0);
                let lineToReplace = null;

                if (emptyLine) {
                    lineToReplace = emptyLine;
                    actionNote = `Miss! Loaded into Set ${setIndex}, Line ${lineToReplace.lineInSetIdx}`;
                } else {
                    // Eviction required
                    if (specs.policy === 'fifo') {
                        // Oldest insertion time
                        lineToReplace = targetSet.reduce((oldest, current) => 
                            current.insertionTime < oldest.insertionTime ? current : oldest, targetSet[0]);
                        actionNote = `Miss! Evicted Line ${lineToReplace.lineInSetIdx} (FIFO)`;
                    } else {
                        // LRU (Oldest last access time)
                        lineToReplace = targetSet.reduce((lru, current) => 
                            current.lastAccessTime < lru.lastAccessTime ? current : lru, targetSet[0]);
                        actionNote = `Miss! Evicted Line ${lineToReplace.lineInSetIdx} (LRU)`;
                    }
                }

                const startAddr = blockAddress * specs.blockSizeBytes;
                const endAddr = startAddr + specs.blockSizeBytes - 1;

                lineToReplace.valid = 1;
                lineToReplace.tag = tag;
                lineToReplace.data = `Blk ${blockAddress} [${startAddr}-${endAddr}]`;
                lineToReplace.lastAccessTime = timeStep;
                lineToReplace.insertionTime = timeStep;
                affectedGlobalLineIdx = lineToReplace.globalLineIdx;
            }

            // Snapshot cache state for visual replay
            const cacheSnapshot = JSON.parse(JSON.stringify(cacheSets));

            steps.push({
                step: timeStep,
                address: addr,
                binAddr,
                tag,
                binTag,
                setIndex,
                binSet,
                offset,
                binOffset,
                result: isHit ? 'Hit' : 'Miss',
                actionNote,
                affectedGlobalLineIdx,
                cacheState: cacheSnapshot,
                runningHits: hits,
                runningMisses: misses
            });
        });

        return {
            specs,
            steps,
            totalHits: hits,
            totalMisses: misses,
            totalAccesses: rawAddrs.length
        };
    }

    // Render Full UI Simulation Results
    function renderSimulationResults(data, activeStepIdx = -1) {
        if (!data) return;

        emptyState.classList.add('hidden');
        resultsWrapper.classList.remove('hidden');

        // Determine step data to display
        const displayStep = activeStepIdx >= 0 ? data.steps[activeStepIdx] : data.steps[data.steps.length - 1];
        const cacheToDisplay = displayStep ? displayStep.cacheState : data.steps[data.steps.length - 1].cacheState;

        // Render Cache Table
        cacheTableBody.innerHTML = '';
        cacheToDisplay.forEach(setLines => {
            setLines.forEach(line => {
                const tr = document.createElement('tr');
                const isAffected = displayStep && line.globalLineIdx === displayStep.affectedGlobalLineIdx;
                if (isAffected) {
                    tr.classList.add('active-cache-line');
                }

                const validBadge = line.valid === 1 
                    ? `<span class="valid-dot"></span> 1` 
                    : `<span style="color: var(--text-muted)">0</span>`;

                tr.innerHTML = `
                    <td>Set ${line.setIdx}</td>
                    <td>Line ${line.lineInSetIdx}</td>
                    <td>${validBadge}</td>
                    <td><code style="color: var(--accent); font-weight: 600">${line.tag}</code></td>
                    <td><code>${line.data}</code></td>
                    <td><span style="color: var(--text-secondary); font-size: 0.8rem">Time: ${line.lastAccessTime || '-'}</span></td>
                `;
                cacheTableBody.appendChild(tr);
            });
        });

        // Render Trace Log Table
        resultsTableBody.innerHTML = '';
        data.steps.forEach((step, idx) => {
            const tr = document.createElement('tr');
            const resClass = step.result === 'Hit' ? 'badge-hit' : 'badge-miss';
            const isStepActive = idx === activeStepIdx;
            
            if (isStepActive) {
                tr.style.background = 'rgba(6, 182, 212, 0.2)';
            }

            tr.innerHTML = `
                <td>${step.step}</td>
                <td><strong>${step.address}</strong></td>
                <td><code>${step.binAddr}</code></td>
                <td><code>${step.tag} (${step.binTag})</code></td>
                <td><code>Set ${step.setIndex} (${step.binSet})</code></td>
                <td><code>${step.offset}</code></td>
                <td><span class="${resClass}">${step.result}</span></td>
                <td style="font-size: 0.82rem; color: var(--text-secondary)">${step.actionNote}</td>
            `;
            resultsTableBody.appendChild(tr);
        });

        traceCountBadge.textContent = `${data.totalAccesses} Accesses`;

        // Calculate and Render Stats
        const hits = activeStepIdx >= 0 ? displayStep.runningHits : data.totalHits;
        const misses = activeStepIdx >= 0 ? displayStep.runningMisses : data.totalMisses;
        const total = activeStepIdx >= 0 ? (activeStepIdx + 1) : data.totalAccesses;

        statTotal.textContent = total;
        statHits.textContent = hits;
        statMisses.textContent = misses;

        const hitRatioPct = total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
        const missRatioPct = total > 0 ? ((misses / total) * 100).toFixed(1) : '0.0';

        statHitRatio.textContent = `${hitRatioPct}%`;
        statMissRatio.textContent = `${missRatioPct}%`;

        // Update Bar Chart
        barHit.style.height = `${Math.max(4, parseFloat(hitRatioPct))}%`;
        barMiss.style.height = `${Math.max(4, parseFloat(missRatioPct))}%`;
        barHitVal.textContent = hits;
        barMissVal.textContent = misses;

        // Update Donut SVG Chart
        const hitPercentNum = parseFloat(hitRatioPct);
        const missPercentNum = parseFloat(missRatioPct);

        donutHitSegment.setAttribute('stroke-dasharray', `${hitPercentNum}, 100`);
        donutMissSegment.setAttribute('stroke-dasharray', `${missPercentNum}, 100`);
        donutMissSegment.setAttribute('stroke-dashoffset', `-${hitPercentNum}`);

        donutCenterText.textContent = `${hitRatioPct}%`;
        pieHitLabel.textContent = `${hitRatioPct}%`;
        pieMissLabel.textContent = `${missRatioPct}%`;

        // Update Step Animation Visualizer (if active step)
        if (displayStep) {
            animCurrentStep.textContent = displayStep.step;
            animTotalSteps.textContent = data.steps.length;

            liveAddrDec.textContent = displayStep.address;
            liveAddrBin.textContent = displayStep.binAddr;

            liveTagVal.textContent = displayStep.tag;
            liveTagBits.textContent = displayStep.binTag || '0';

            liveSetVal.textContent = displayStep.setIndex;
            liveSetBits.textContent = displayStep.binSet || '0';

            liveOffsetVal.textContent = displayStep.offset;
            liveOffsetBits.textContent = displayStep.binOffset || '0';

            if (displayStep.result === 'Hit') {
                liveStatusBadge.textContent = 'CACHE HIT';
                liveStatusBadge.className = 'status-indicator status-hit';
                liveStatusExp.textContent = `Address ${displayStep.address} found in Cache Set ${displayStep.setIndex}! CPU reads data directly.`;
            } else {
                liveStatusBadge.textContent = 'CACHE MISS';
                liveStatusBadge.className = 'status-indicator status-miss';
                liveStatusExp.textContent = `Address ${displayStep.address} not in Cache. ${displayStep.actionNote}.`;
            }
        }
    }

    // Step Animation Playback Controls
    function stopAutoPlay() {
        if (animTimer) {
            clearInterval(animTimer);
            animTimer = null;
        }
        animPlayBtn.textContent = '▶ Auto Play';
        animPlayBtn.classList.remove('btn-secondary');
        animPlayBtn.classList.add('btn-primary');
    }

    function startAutoPlay(data) {
        if (animTimer) {
            stopAutoPlay();
            return;
        }

        animPlayBtn.textContent = '⏸ Pause';
        animPlayBtn.classList.remove('btn-primary');
        animPlayBtn.classList.add('btn-secondary');

        const speedMs = parseInt(animSpeedSelect.value) || 900;
        animTimer = setInterval(() => {
            currentAnimIndex++;
            if (currentAnimIndex >= data.steps.length) {
                currentAnimIndex = data.steps.length - 1;
                stopAutoPlay();
            }
            renderSimulationResults(data, currentAnimIndex);
        }, speedMs);
    }

    // Event Handlers for Run & Step Buttons
    runBtn.addEventListener('click', () => {
        stopAutoPlay();
        const data = runSimulationCore();
        if (data) {
            animationCard.classList.add('hidden');
            renderSimulationResults(data, -1);
            resultsWrapper.scrollIntoView({ behavior: 'smooth' });
        }
    });

    stepBtn.addEventListener('click', () => {
        stopAutoPlay();
        const data = runSimulationCore();
        if (data) {
            simulationSteps = data.steps;
            currentAnimIndex = 0;
            animationCard.classList.remove('hidden');
            renderSimulationResults(data, currentAnimIndex);
            animationCard.scrollIntoView({ behavior: 'smooth' });
        }
    });

    animPrevBtn.addEventListener('click', () => {
        stopAutoPlay();
        if (currentAnimIndex > 0) {
            currentAnimIndex--;
            const data = runSimulationCore();
            renderSimulationResults(data, currentAnimIndex);
        }
    });

    animNextBtn.addEventListener('click', () => {
        stopAutoPlay();
        const data = runSimulationCore();
        if (data && currentAnimIndex < data.steps.length - 1) {
            currentAnimIndex++;
            renderSimulationResults(data, currentAnimIndex);
        }
    });

    animPlayBtn.addEventListener('click', () => {
        const data = runSimulationCore();
        if (data) {
            startAutoPlay(data);
        }
    });

    resetBtn.addEventListener('click', () => {
        stopAutoPlay();
        addressesInput.value = '';
        resultsWrapper.classList.add('hidden');
        animationCard.classList.add('hidden');
        emptyState.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Interactive Guide Bit Calculator logic
    const guideAddrInput = document.getElementById('guide-addr');
    const guideCacheSizeInput = document.getElementById('guide-cache-size');
    const guideBlockSizeInput = document.getElementById('guide-block-size');
    const guideMappingInput = document.getElementById('guide-mapping');
    const guideCalcResult = document.getElementById('guide-calc-result');

    function updateGuideCalculator() {
        if (!guideCalcResult) return;

        const addr = parseInt(guideAddrInput.value) || 0;
        const cacheSize = parseInt(guideCacheSizeInput.value) || 16;
        const blockSize = parseInt(guideBlockSizeInput.value) || 4;
        const mapping = guideMappingInput.value;

        const totalLines = Math.max(1, Math.floor(cacheSize / blockSize));
        let numSets = totalLines;
        if (mapping === 'set2') numSets = Math.max(1, Math.floor(totalLines / 2));
        if (mapping === 'fully') numSets = 1;

        const offsetBits = Math.max(1, Math.round(Math.log2(blockSize)));
        const indexBits = mapping === 'fully' ? 0 : Math.max(0, Math.round(Math.log2(numSets)));
        const tagBits = 16 - indexBits - offsetBits;

        const blockAddr = Math.floor(addr / blockSize);
        const offset = addr % blockSize;
        const setIndex = mapping === 'fully' ? 0 : blockAddr % numSets;
        const tag = mapping === 'fully' ? blockAddr : Math.floor(blockAddr / numSets);

        const binAddr = toBinary(addr, 16);
        const binTag = toBinary(tag, tagBits);
        const binSet = toBinary(setIndex, indexBits);
        const binOffset = toBinary(offset, offsetBits);

        guideCalcResult.innerHTML = `
            <div style="margin-bottom: 12px">
                <strong>Address <code>${addr}</code> Breakdown (16-bit binary: <code>${binAddr}</code>):</strong>
            </div>
            <div class="bit-breakdown-display">
                <div class="bit-chunk tag-chunk">
                    <span class="chunk-label">TAG (${tagBits} bits)</span>
                    <span class="chunk-val">${tag}</span>
                    <span class="chunk-bits">${binTag}</span>
                </div>
                <div class="bit-chunk set-chunk">
                    <span class="chunk-label">SET INDEX (${indexBits} bits)</span>
                    <span class="chunk-val">${mapping === 'fully' ? 'N/A' : setIndex}</span>
                    <span class="chunk-bits">${binSet}</span>
                </div>
                <div class="bit-chunk offset-chunk">
                    <span class="chunk-label">OFFSET (${offsetBits} bits)</span>
                    <span class="chunk-val">${offset}</span>
                    <span class="chunk-bits">${binOffset}</span>
                </div>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary)">
                Block Address: <code>${blockAddr}</code> | Mapping to Set: <code>${setIndex}</code> | Offset in Block: <code>${offset}</code>
            </div>
        `;
    }

    if (guideAddrInput) {
        [guideAddrInput, guideCacheSizeInput, guideBlockSizeInput, guideMappingInput].forEach(elem => {
            elem.addEventListener('input', updateGuideCalculator);
            elem.addEventListener('change', updateGuideCalculator);
        });
    }

    // Initial Specs & Guide Calculations
    calculateArchitectureSpecs();
    updateGuideCalculator();
});
