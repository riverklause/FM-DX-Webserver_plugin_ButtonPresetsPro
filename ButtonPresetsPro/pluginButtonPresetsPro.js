/*
    Preset Buttons Pro v1.0 by riverklause
    (Hide/Show in Settings + 显示全部 + SavedDefaultBank + 方案A 已补全)
*/

'use strict';

// Global variables for other plugins
const pluginButtonPresetsPro = true;

(() => {

//////////////////////////////////////////////////

const bankMenuLocation = 'top' // ims, bw, ant, eq, top, top-replace, hidden
const bankMenuPosition = 'after' // before, after
const bankMenuPaddingLeft = '15' // value in px
const bankMenuPaddingRight = '0' // value in px
const bankMenuBorderLeftRadius = true; // true, false
const bankMenuBorderRightRadius = true; // true, false
const bankMenuCustomWidth = 'default'; // default, value in px or %
const bankName = 'Bank'; // dropdown menu name
const bankQuantity = 4; // total number of banks ranging from 3-8 (for 'top' or 'top-replace' use either 4 or 8)
const presetCount = 20; // number of presets per bank (default: 20)
const optionHidePresetButtons = true; // true, false  <-- 设为 true 则向SETTINGS面板注入 HIDE PRESET BUTTONS 复选框
const optionHideDisplayAll = false; // true, false <-- 设为 true 则向SETTINGS面板注入 Show All 复选框
const optionSaveAntenna = (!!document.getElementById('data-ant')); // (!!document.getElementById('data-ant')), true, false
const optionAntennaDisplay = 'number'; // number, letter
const optionHighlightSelectedPreset = true; // true, false
const enableStationNameEdit = true; // enable double-click to edit station name
const enableBankRename = true; // enable bank renaming

// Default preset data - generated based on presetCount
const defaultPresetData = (function(count) {
  const data = {
    values: [],
    antennas: [],
    ps: [],
    tooltips: [],
    stationNames: [],
    names: []
  };
  for (let i = 0; i < count; i++) {
    data.values.push(87.5);
    data.antennas.push('');
    data.ps.push('');
    data.tooltips.push('');
    data.stationNames.push('');
    data.names.push('');
  }
  return data;
})(presetCount);

// Custom bank names
const defaultBankNames = ['', '', '', '', '', '', '', ''];

// ===== Server-side config storage =====
const serverConfigPath = '';
const autoLoadFromServer = true;

function _detectPluginPath() {
  let scriptPath = '';
  if (document.currentScript && document.currentScript.src) {
    scriptPath = document.currentScript.src;
  } else {
    const scripts = document.querySelectorAll('script[src*="pluginButtonPresetsPro"]');
    if (scripts.length > 0) {
      scriptPath = scripts[scripts.length - 1].src;
    }
  }
  if (scriptPath) {
    const url = new URL(scriptPath, window.location.origin);
    let pathParts = url.pathname.split('/');
    pathParts.pop();
    return pathParts.join('/') + '/';
  }
  return '';
}

let _resolvedConfigPath = serverConfigPath;

//////////////////////////////////////////////////

const pluginVersion = '1.0';
const pluginName = "Preset Buttons Pro";

// ===== localStorage keys =====
const DISPLAY_KEY_ButtonPresets = 'buttonPresetsHidden';
const DISPLAY_ALL_KEY = 'buttonPresetsDisplayAll';
const SAVED_BANK_KEY = 'SavedDefaultBank';

// ===== state =====
let bankDisplayAll = false;
let SavedDefaultBank = 'A';

let currentPresetIndex = 0;
let currentPresetBank = 'A';
let frequencyObserver;
let lastUsedPreset = null;
let keysPressed = new Set();
let hasUsedKeyboardNavigation = false;

// Additional styles
let stylePresetsLayout = document.createElement('style');
stylePresetsLayout.textContent = `
  #plugin-presets-container {
    width: 100%;
    margin-top: 20px;
    padding: 14px 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    clear: both;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .preset-bank-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
    text-align: center;
    padding: 0 0 10px 0;
    width: 100%;
    opacity: 0.7;
  }

  .preset-bank-title .bank-label-prefix {
    font-size: 12px;
    opacity: 0.5;
    margin-right: 6px;
    font-weight: 600;
  }

  #presets-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    width: 100%;
    margin: 0;
    min-height: 50px;
  }

  .preset-btn {
    width: 92px;
    height: 60px;
    min-width: 92px;
    background: rgba(30,30,30,0.6);
    border: 1px solid rgba(255,255,255,0.15);
    color: var(--color-text);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.2s;
    padding: 2px 6px;
    position: relative;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    flex-shrink: 0;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
  }

  .preset-btn:hover {
    border-color: var(--color-4);
    background: rgba(59, 165, 252, 0.1);
  }

  .preset-btn.preset-active {
    border: 2px solid var(--color-4) !important;
    background: rgba(59, 165, 252, 0.3) !important;
    box-shadow: 0 0 15px rgba(59, 165, 252, 0.6);
    transform: scale(1.03);
    z-index: 20;
    padding: 1px 5px;
  }

  .preset-btn .preset-freq {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.2;
  }

  .preset-btn .preset-name {
    font-size: 11px;
    opacity: 0.85;
    margin-top: 2px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    line-height: 1.1;
  }

  .preset-btn .preset-ant {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 9px;
    opacity: 0.5;
  }

  .preset-control-card {
    width: 92px;
    height: 60px;
    border: 1px solid var(--color-4);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px;
    box-sizing: border-box;
    background: rgba(59, 165, 252, 0.12);
    flex-shrink: 0;
  }

  .preset-bank-card select {
    width: 100%;
    background: rgba(0,0,0,0.6);
    color: var(--color-text);
    border: 1px solid rgba(59, 165, 252, 0.4);
    font-size: 11px;
    padding: 3px 4px;
    text-align: center;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    color-scheme: dark;
  }

  .preset-bank-card select:hover {
    border-color: var(--color-4);
  }

  .preset-bank-card .bank-card-label {
    font-size: 10px;
    opacity: 0.6;
    margin-bottom: -2px;
  }

  .preset-menu-card {
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .preset-menu-card.dropdown-open {
    z-index: 99999;
  }

  .preset-menu-card:hover {
    background: rgba(59, 165, 252, 0.25);
    border-color: var(--color-4);
  }

  .preset-menu-card .menu-icon {
    font-size: 16px;
    margin-bottom: 2px;
  }

  .preset-menu-card .menu-label {
    font-size: 12px;
    opacity: 0.8;
    font-weight: 600;
  }

  .preset-menu-dropdown {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 4px;
    background: #1c1c1c;
    border: 1px solid #444;
    border-radius: 6px;
    min-width: 170px;
    z-index: 99999;
    box-shadow: 0 8px 30px rgba(0,0,0,0.6);
    overflow: hidden;
    display: none;
  }

  .preset-menu-dropdown.show {
    display: block;
  }

  .preset-menu-dropdown button {
    display: block;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid #333;
    color: #eee;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    height: auto;
    line-height: 1.4;
    min-width: auto;
  }

  .preset-menu-dropdown button:last-child {
    border-bottom: none;
  }

  .preset-menu-dropdown button:hover {
    background: #333;
  }

  .preset-menu-dropdown button i {
    width: 18px;
    margin-right: 6px;
    opacity: 0.7;
  }

  .preset-prompt-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preset-prompt-box {
    background: #1c1c1c;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 16px;
    min-width: 260px;
    max-width: 90vw;
    color: #eee;
    box-shadow: 0 8px 30px rgba(0,0,0,0.6);
  }
  .preset-prompt-box .prompt-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .preset-prompt-box .prompt-info {
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 10px;
    white-space: pre-line;
  }
  .preset-prompt-box input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    font-size: 14px;
    background: rgba(0,0,0,0.6);
    border: 1px solid #555;
    border-radius: 4px;
    color: #eee;
    margin-bottom: 12px;
  }
  .preset-prompt-box .prompt-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .preset-prompt-box button {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 4px;
    border: 1px solid #555;
    background: #2a2a2a;
    color: #eee;
    cursor: pointer;
  }
  .preset-prompt-box button.primary {
    background: var(--color-4, #3ba5fc);
    border-color: var(--color-4, #3ba5fc);
    color: #fff;
  }

  @media (max-width: 400px) {
    .preset-btn .preset-freq { font-size: 17px; }
    .preset-btn .preset-name { font-size: 12px; }
    .preset-btn .preset-ant  { font-size: 11px; }
    .preset-bank-card select { font-size: 13px; padding: 4px 5px; }
    .preset-bank-card .bank-card-label { font-size: 12px; }
    .preset-menu-card .menu-icon { font-size: 18px; }
    .preset-menu-card .menu-label { font-size: 12px; }
  }
`;
document.head.appendChild(stylePresetsLayout);

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// ===== 自定义弹层 =====
function showPresetPrompt(title, infoText, suggestedName) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'preset-prompt-overlay';

    const box = document.createElement('div');
    box.className = 'preset-prompt-box';

    const titleEl = document.createElement('div');
    titleEl.className = 'prompt-title';
    titleEl.textContent = title;
    box.appendChild(titleEl);

    if (infoText) {
      const infoEl = document.createElement('div');
      infoEl.className = 'prompt-info';
      infoEl.textContent = infoText;
      box.appendChild(infoEl);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.value = suggestedName || '';
    box.appendChild(input);

    const buttons = document.createElement('div');
    buttons.className = 'prompt-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', function() {
      cleanup();
      resolve(null);
    });

    const okBtn = document.createElement('button');
    okBtn.className = 'primary';
    okBtn.textContent = '保存';
    okBtn.addEventListener('click', function() {
      const v = input.value;
      cleanup();
      resolve(v);
    });

    buttons.appendChild(cancelBtn);
    buttons.appendChild(okBtn);
    box.appendChild(buttons);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    setTimeout(() => input.focus({ preventScroll: true }), 50);

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = input.value;
        cleanup();
        resolve(v);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
        resolve(null);
      }
    });

    function cleanup() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  });
}

// ===== Layout structure =====
let buttonWrapper = document.createElement("div");
buttonWrapper.id = "plugin-presets-container";

let bankTitleEl = document.createElement("div");
bankTitleEl.className = "preset-bank-title";
bankTitleEl.innerHTML = '<span class="bank-label-prefix">' + bankName + ': </span><span class="bank-name-text">A</span>';

let buttonContainer = document.createElement("div");
buttonContainer.id = "presets-grid";
buttonContainer.style.display = "flex";
buttonContainer.style.flexWrap = "wrap";
buttonContainer.style.gap = "8px";
buttonContainer.style.width = "100%";
buttonContainer.style.justifyContent = "center";

buttonWrapper.appendChild(bankTitleEl);
buttonWrapper.appendChild(buttonContainer);

// ===== localStorage helpers =====
function getStoredData(bank) {
  const key = `buttonPresets${bank}`;
  let dataButtonPresets;
  const stored = JSON.parse(localStorage.getItem(key));
  if (stored) {
    const ensureLength = (arr, fallback, count) => {
      const result = [...arr];
      while (result.length < count) result.push(fallback);
      return result.slice(0, count);
    };
    dataButtonPresets = {
      values: ensureLength(stored.values || [], 87.5, presetCount),
      antennas: ensureLength(stored.antennas || [], '', presetCount),
      ps: ensureLength(stored.ps || [], '', presetCount),
      tooltips: ensureLength(stored.tooltips || [], '', presetCount),
      stationNames: ensureLength(stored.stationNames || [], '', presetCount)
    };
  } else if (bank === "A") {
    dataButtonPresets = {
      values: [...defaultPresetData.values],
      antennas: [...defaultPresetData.antennas],
      ps: [...defaultPresetData.names],
      tooltips: Array(presetCount).fill(''),
      stationNames: Array(presetCount).fill('')
    };
  } else {
    dataButtonPresets = {
      values: Array(presetCount).fill(87.5),
      antennas: Array(presetCount).fill(''),
      ps: Array(presetCount).fill(''),
      tooltips: Array(presetCount).fill(''),
      stationNames: Array(presetCount).fill('')
    };
  }
  return dataButtonPresets;
}

function saveToLocalStorage(bank, buttonValues, antennaValues, psValues, tooltipValues, stationNameValues) {
  const sanitizedButtonValues = buttonValues.map(value => value === null ? "" : value);
  const sanitizedAntennaValues = antennaValues.map(value => value === null ? "" : value);
  const sanitizedPsValues = psValues.map(value => value === null ? "" : value);
  const sanitizedTooltipValues = tooltipValues.map(value => value === null ? "" : value);
  const sanitizedStationNameValues = (stationNameValues || []).map(value => value === null ? "" : value);

  localStorage.setItem(`buttonPresets${bank}`, JSON.stringify({
    values: sanitizedButtonValues,
    antennas: sanitizedAntennaValues,
    ps: sanitizedPsValues,
    tooltips: sanitizedTooltipValues,
    stationNames: sanitizedStationNameValues
  }));
}

let currentBank = 'A';

function getBankDisplayNames() {
  const stored = localStorage.getItem('buttonPresetsBankNames');
  let customNames = [];
  if (stored) {
    try { customNames = JSON.parse(stored); } catch(e) { customNames = []; }
  }
  const letterNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, bankQuantity);
  const result = [];
  for (let i = 0; i < bankQuantity; i++) {
    result.push((customNames[i] && customNames[i].trim()) || (defaultBankNames[i] && defaultBankNames[i].trim()) || letterNames[i]);
  }
  return result;
}

let bankNames;
let bankDisplayNames;

if (bankQuantity >= 3 && bankQuantity <= 8) {
  bankNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, bankQuantity);
} else {
  bankNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, 3);
}
bankDisplayNames = getBankDisplayNames();

// ===== 完整性检查（无版本号）=====
function isLocalStorageComplete() {
  try {
    // 1. UI 状态必须存在
    if (localStorage.getItem(DISPLAY_ALL_KEY) === null) return false;
    if (localStorage.getItem(DISPLAY_KEY_ButtonPresets) === null) return false;
    if (localStorage.getItem(SAVED_BANK_KEY) === null) return false;

    // 2. SavedDefaultBank 必须是合法 bank
    const savedBank = localStorage.getItem(SAVED_BANK_KEY);
    if (!bankNames.includes(savedBank)) return false;

    // 3. 每个 bank 的数据必须存在且能被 JSON.parse，长度正确
    for (const bank of bankNames) {
      const raw = localStorage.getItem(`buttonPresets${bank}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.values)) return false;
      if (parsed.values.length !== presetCount) return false;
    }

    // 4. bank 名可选，如果存在必须是合法 JSON 数组
    const bankNamesRaw = localStorage.getItem('buttonPresetsBankNames');
    if (bankNamesRaw !== null) {
      const parsedNames = JSON.parse(bankNamesRaw);
      if (!Array.isArray(parsedNames)) return false;
    }

    return true;
  } catch (e) {
    console.warn(`[${pluginName}] localStorage integrity check failed:`, e);
    return false;
  }
}

function getTooltipValue() {
  const dataStationNameElement = document.getElementById('data-station-name');
  const dataPsElement = document.getElementById('data-ps');
  if (dataStationNameElement && dataStationNameElement.offsetParent !== null) {
    return dataStationNameElement.textContent.trim();
  }
  return dataPsElement ? dataPsElement.textContent.trim() : '';
}

function getCurrentAntennaValue() {
  const dataAntInput = document.querySelector('.data-ant input');
  if (dataAntInput) {
    const currentAntennaText = dataAntInput.value || dataAntInput.placeholder;
    const options = document.querySelectorAll('.data-ant li.option');
    for (let option of options) {
      if (option.textContent.trim() === currentAntennaText.trim()) {
        return !optionSaveAntenna ? '0' : (option.getAttribute('data-value') || '0');
      }
    }
  }
  return '0';
}

// ===== Update buttons =====
function updateButtons() {
  buttonContainer.innerHTML = '';
  buttonContainer.classList.toggle('show-all-presets', bankDisplayAll);
  let buttonRows = 1;

  if (bankDisplayAll) {
    buttonRows = bankQuantity || 3;
  } else {
    buttonRows = 1;
  }

  for (let iAll = 0; iAll < buttonRows; iAll++) {
    // 局部变量保存本行 bank，避免污染 currentBank
    let bankForThisRow = bankDisplayAll ? bankNames[iAll] : currentBank;

    let storedData = getStoredData(bankForThisRow);
    let buttonValues = storedData.values;
    let antennaValues = storedData.antennas || [];
    let psValues = storedData.ps;
    let tooltipValues = storedData.tooltips || [];
    let stationNameValues = storedData.stationNames || [];

    for (let i = 0; i < presetCount; i++) {
      (function(index, buttonBank) {
        let button = document.createElement("button");
        const buttonId = bankDisplayAll ? `setFrequencyButton${buttonBank}${index}` : `setFrequencyButton${index}`;
        button.id = buttonId;
        button.classList.add('preset-btn', 'tooltip-presets');
        button.setAttribute('data-tooltip', tooltipValues[index] || psValues[index]);

        updateButton(button, buttonValues[index], index);

        async function promptSavePreset() {
          const dataFrequencyElement = document.getElementById('data-frequency');
          const dataPsElement = document.getElementById('data-ps');
          const dataStationNameElement = document.getElementById('data-station-name');
          const dataFrequency = dataFrequencyElement ? dataFrequencyElement.textContent : '87.5';
          const dataPs = dataPsElement ? dataPsElement.textContent : '';
          const tooltipValue = (dataStationNameElement && dataStationNameElement.offsetParent !== null)
            ? dataStationNameElement.textContent
            : dataPs;

          const newFrequency = parseFloat(dataFrequency) || 87.5;
          const newAntenna = getCurrentAntennaValue();
          const newPs = dataPs;
          const newTooltip = tooltipValue;

          const autoStationName = (dataStationNameElement && dataStationNameElement.offsetParent !== null)
            ? dataStationNameElement.textContent.trim()
            : dataPs.trim();
          const suggestedName = stationNameValues[index] || autoStationName;

          const bankLabel = bankDisplayNames[bankNames.indexOf(buttonBank)] || buttonBank;

          const userInput = await showPresetPrompt(
            `保存预设 #${index + 1} 到 ${bankLabel}`,
            `频率: ${newFrequency} MHz`,
            suggestedName
          );

          if (userInput === null) {
            return;
          }

          buttonValues[index] = newFrequency;
          antennaValues[index] = newAntenna;
          psValues[index] = newPs;
          tooltipValues[index] = newTooltip;
          stationNameValues[index] = userInput.trim() || autoStationName;

          updateButton(button, buttonValues[index], index);

          if (typeof sendToast === 'function') {
            let antennaToast = optionSaveAntenna
              ? ` (Ant ${optionAntennaDisplay === 'letter'
                  ? String.fromCharCode(65 + Number(getCurrentAntennaValue()))
                  : Number(getCurrentAntennaValue()) + 1})`
              : '';
            const nameText = stationNameValues[index] ? ` <i>(${stationNameValues[index]})</i>` : '';
            sendToast('info', 'Preset Buttons',
              `预设 <strong>#${index + 1}</strong>${nameText} 已保存到 <b>${bankLabel}</b>${antennaToast}`,
              false, false);
          }
          console.log(`[${pluginName}] Preset saved:`,
            buttonValues[index] + ` (${getCurrentAntennaValue()})`,
            buttonBank, (index + 1), stationNameValues[index]);
        }

        if (!isIOS) {
          button.addEventListener('click', function() {
            const presetInput = buttonValues[index];
            const antennaInput = antennaValues[index];

            if (socket.readyState === WebSocket.OPEN) {
              socket.send("T" + (Math.round((presetInput).toFixed(3) * 1000)));
              if (optionSaveAntenna && antennaInput && antennaInput !== getCurrentAntennaValue()) socket.send("Z" + antennaInput);
            }

            currentPresetIndex = index;
            currentPresetBank = buttonBank;
            lastUsedPreset = {bank: buttonBank, index: index};

            setTimeout(highlightActivePreset, 200);
          });

          button.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            promptSavePreset();
          });
        } else {
          let longPressTimer = null;
          let touchStartX = 0;
          let touchStartY = 0;
          let touchMoved = false;
          let touchLongPressFired = false;

          let mouseLongPressTimer = null;
          let mouseLongPressFired = false;

          const LONG_PRESS_THRESHOLD = 500;
          const MOVE_CANCEL_THRESHOLD = 10;

          button.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchMoved = false;
            touchLongPressFired = false;

            longPressTimer = setTimeout(() => {
              if (!touchMoved) {
                touchLongPressFired = true;
                promptSavePreset();
              }
            }, LONG_PRESS_THRESHOLD);
          }, { passive: true });

          button.addEventListener('touchmove', function(e) {
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            if (Math.sqrt(dx * dx + dy * dy) > MOVE_CANCEL_THRESHOLD) {
              touchMoved = true;
              clearTimeout(longPressTimer);
            }
          }, { passive: true });

          button.addEventListener('touchend', function(e) {
            clearTimeout(longPressTimer);
            if (!touchMoved && !touchLongPressFired) {
              recallPreset();
            }
          });

          button.addEventListener('touchcancel', function() {
            clearTimeout(longPressTimer);
            touchMoved = true;
          });

          button.addEventListener('mousedown', function(e) {
            e.preventDefault();
            mouseLongPressFired = false;

            mouseLongPressTimer = setTimeout(() => {
              mouseLongPressFired = true;
              promptSavePreset();
            }, LONG_PRESS_THRESHOLD);
          });

          button.addEventListener('mouseup', function(e) {
            clearTimeout(mouseLongPressTimer);
            if (!mouseLongPressFired) {
              recallPreset();
            }
          });

          function recallPreset() {
            const presetInput = buttonValues[index];
            const antennaInput = antennaValues[index];

            if (socket.readyState === WebSocket.OPEN) {
              socket.send("T" + (Math.round((presetInput).toFixed(3) * 1000)));
              if (optionSaveAntenna && antennaInput && antennaInput !== getCurrentAntennaValue()) {
                socket.send("Z" + antennaInput);
              }
            }

            currentPresetIndex = index;
            currentPresetBank = buttonBank;
            lastUsedPreset = { bank: buttonBank, index: index };

            setTimeout(highlightActivePreset, 10);
          }
        }

        button.addEventListener('keydown', function(e) {
          if (e.shiftKey && e.key === 'S') {
            let dataFrequencyElement = document.getElementById('data-frequency');
            let dataPsElement = document.getElementById('data-ps');
            let dataStationNameElement = document.getElementById('data-station-name');
            let dataFrequency = dataFrequencyElement ? dataFrequencyElement.textContent : '87.5';
            let dataPs = dataPsElement ? dataPsElement.textContent : '';

            buttonValues[index] = parseFloat(dataFrequency) || 87.5;
            antennaValues[index] = getCurrentAntennaValue();
            psValues[index] = dataPs;
            tooltipValues[index] = getTooltipValue() || '';
            if (!stationNameValues[index]) {
              stationNameValues[index] = (dataStationNameElement && dataStationNameElement.offsetParent !== null)
                ? dataStationNameElement.textContent.trim()
                : dataPs.trim();
            }
            updateButton(button, buttonValues[index], index);
          } else if (e.shiftKey && e.key === 'R') {
            buttonValues[index] = 87.5;
            antennaValues[index] = '';
            psValues[index] = '';
            tooltipValues[index] = '';
            stationNameValues[index] = '';
            updateButton(button, buttonValues[index], index);
          }
        });

        button.addEventListener('mousedown', function(e) {
          if (e.button === 1 || e.ctrlKey || (e.shiftKey && e.button === 0)) {
            if (e.button === 1 || (e.shiftKey && e.button === 0)) {
              buttonValues[index] = 87.5;
              antennaValues[index] = '';
              psValues[index] = '';
              tooltipValues[index] = '';
              stationNameValues[index] = '';
            } else if (e.ctrlKey) {
              let dataFrequencyElement = document.getElementById('data-frequency');
              let dataPsElement = document.getElementById('data-ps');
              let dataStationNameElement = document.getElementById('data-station-name');
              let dataFrequency = dataFrequencyElement ? dataFrequencyElement.textContent : '87.5';
              let dataPs = dataPsElement ? dataPsElement.textContent : '';

              buttonValues[index] = parseFloat(dataFrequency) || 87.5;
              antennaValues[index] = getCurrentAntennaValue();
              psValues[index] = dataPs;
              tooltipValues[index] = getTooltipValue() || '';
              if (!stationNameValues[index]) {
                stationNameValues[index] = (dataStationNameElement && dataStationNameElement.offsetParent !== null)
                  ? dataStationNameElement.textContent.trim()
                  : dataPs.trim();
              }
            }
            updateButton(button, buttonValues[index], index);
          }
        });

        function updateButton(button, value, index) {
          const antennaInput = antennaValues[index];
          const psValue = psValues[index] || '';
          const stationName = stationNameValues[index] || '';
          const displayName = stationName.trim() || psValue.trim();
          const tooltipValue = tooltipValues[index] || stationName || psValue;

          button.innerHTML = '';
          button.style.position = "relative";
          button.style.padding = '';
          button.style.backgroundColor = '';

          if (antennaInput && optionSaveAntenna) {
            const antSpan = document.createElement('span');
            antSpan.className = 'preset-ant';
            antSpan.textContent = optionAntennaDisplay === 'letter'
              ? String.fromCharCode(65 + Number(antennaInput))
              : Number(antennaInput) + 1;
            button.appendChild(antSpan);
          }

          const freqSpan = document.createElement('span');
          freqSpan.className = 'preset-freq';
          freqSpan.textContent = formatValue(value).trim();
          button.appendChild(freqSpan);

          if (displayName) {
            const nameSpan = document.createElement('span');
            nameSpan.className = 'preset-name';
            nameSpan.textContent = displayName;
            button.appendChild(nameSpan);
          }

          button.setAttribute('data-tooltip', tooltipValue.trim());

          saveToLocalStorage(buttonBank, buttonValues, antennaValues, psValues, tooltipValues, stationNameValues);
        }

        function formatValue(value) {
          if (value === undefined) {
            value = 87.5;
          }

          let fixedValue;

          switch (true) {
            case (value <= 27):
              fixedValue = value.toFixed(4);
              break;
            case (value > 27 && value < 76):
              fixedValue = value.toFixed(3);
              break;
            case (value >= 76 && value <= 108):
              fixedValue = value.toFixed(2);
              break;
            default:
              fixedValue = value.toFixed(3);
          }

          return fixedValue.endsWith('0') ? fixedValue.slice(0, -1) : fixedValue;
        }

        if (enableStationNameEdit && !isIOS) {
          button.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const currentName = stationNameValues[index] || psValues[index] || '';
            const newName = prompt('Edit station name for preset #' + (index + 1) + ':', currentName);
            if (newName !== null) {
              stationNameValues[index] = newName.trim();
              updateButton(button, buttonValues[index], index);
              saveToLocalStorage(buttonBank, buttonValues, antennaValues, psValues, tooltipValues, stationNameValues);
              if (typeof sendToast === 'function') {
                sendToast('info', 'Preset Buttons', `Station name updated to <strong>${newName.trim() || '(empty)'}</strong> for preset #${index + 1}.`, false, false);
              }
            }
          });
        }

        buttonContainer.appendChild(button);
      })(i, bankForThisRow);
    }
  }
  createBankSelectCard();
  createMenuCard();

  if (!lastUsedPreset || (lastUsedPreset && lastUsedPreset.bank === currentBank)) {
    setTimeout(highlightActivePreset, 200);
  }
}

// ===== Bank Selector Card =====
function createBankSelectCard() {
  const existing = document.getElementById('preset-bank-select-card');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'preset-bank-select-card';
  card.className = 'preset-control-card preset-bank-card';
  if (bankDisplayAll) card.style.display = 'none';

  const label = document.createElement('div');
  label.className = 'bank-card-label';
  label.textContent = bankName;
  card.appendChild(label);

  const select = document.createElement('select');
  bankDisplayNames.forEach((displayName, i) => {
    const opt = document.createElement('option');
    opt.value = bankNames[i];
    opt.textContent = displayName;
    if (bankNames[i] === currentBank) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', function(e) {
    currentBank = e.target.value;
    SavedDefaultBank = currentBank;
    localStorage.setItem(SAVED_BANK_KEY, SavedDefaultBank);
    updateBankTitle();
    updateButtons();
    setTimeout(highlightActivePreset, 100);
  });

  card.appendChild(select);
  const menuEl = document.getElementById('preset-menu-card');
  if (menuEl) {
    buttonContainer.insertBefore(card, menuEl);
  } else {
    buttonContainer.appendChild(card);
  }
}

// ===== Menu Card =====
function createMenuCard() {
  const existing = document.getElementById('preset-menu-card');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'preset-menu-card';
  card.className = 'preset-control-card preset-menu-card';
  card.style.position = 'relative';

  const icon = document.createElement('div');
  icon.className = 'menu-icon';
  icon.innerHTML = '<i class="fa-solid fa-bars"></i>';
  card.appendChild(icon);

  const label = document.createElement('div');
  label.className = 'menu-label';
  label.textContent = '菜单';
  card.appendChild(label);

  const dropdown = document.createElement('div');
  dropdown.className = 'preset-menu-dropdown';
  dropdown.innerHTML = `
    <button id="menu-toggle-display-all"><i class="fa-solid fa-table-cells"></i>显示全部预设</button>
    <button id="menu-import"><i class="fa-solid fa-file-import"></i>导入本地配置</button>
    <button id="menu-export"><i class="fa-solid fa-file-export"></i>导出配置文件</button>
    <button id="menu-cloud-load"><i class="fa-solid fa-cloud-arrow-down"></i>从服务器加载</button>
  `;
  card.appendChild(dropdown);

  card.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('show');
    card.classList.toggle('dropdown-open', isOpen);
  });

  document.addEventListener('click', function() {
    dropdown.classList.remove('show');
    card.classList.remove('dropdown-open');
  });

  dropdown.querySelector('#menu-toggle-display-all').addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.classList.remove('show');
    card.classList.remove('dropdown-open');
    setDisplayAll(!bankDisplayAll);
  });
  dropdown.querySelector('#menu-import').addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.classList.remove('show');
    card.classList.remove('dropdown-open');
    createFileInputAndImport();
  });
  dropdown.querySelector('#menu-export').addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.classList.remove('show');
    card.classList.remove('dropdown-open');
    exportLocalStorageToFile();
  });
  dropdown.querySelector('#menu-cloud-load').addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.classList.remove('show');
    card.classList.remove('dropdown-open');
    manualLoadFromServer();
  });

  buttonContainer.appendChild(card);
}

// ===== 显示全部 切换 =====
function setDisplayAll(enabled) {
  if (enabled) {
    SavedDefaultBank = currentBank;
    localStorage.setItem(SAVED_BANK_KEY, SavedDefaultBank);
    bankDisplayAll = true;
  } else {
    bankDisplayAll = false;
    currentBank = SavedDefaultBank || 'A';
  }

  localStorage.setItem(DISPLAY_ALL_KEY, bankDisplayAll);

  const bankCard = document.getElementById('preset-bank-select-card');
  if (bankCard) bankCard.style.display = bankDisplayAll ? 'none' : '';

  updateButtons();
  updateBankTitle();
  setTimeout(highlightActivePreset, 200);
}

// ===== Init =====
// 从 localStorage 恢复状态
bankDisplayAll = localStorage.getItem(DISPLAY_ALL_KEY) === 'true';
SavedDefaultBank = localStorage.getItem(SAVED_BANK_KEY) || 'A';

if (!bankNames.includes(SavedDefaultBank)) {
  SavedDefaultBank = 'A';
  localStorage.setItem(SAVED_BANK_KEY, 'A');
}

currentBank = SavedDefaultBank;

updateButtons();
updateBankTitle();

startFrequencyMonitoring();

function initialiseKeyboardNavigation() {
  const container = document.getElementById('presets-grid');
  if (!container) {
    setTimeout(initialiseKeyboardNavigation, 100);
    return;
  }

  const initializeFromHighlighted = () => {
    const highlightedButtons = container.querySelectorAll('button.preset-active');

    if (highlightedButtons.length > 0) {
      const firstHighlighted = highlightedButtons[0];
      const buttonId = firstHighlighted.id;

      if (bankDisplayAll) {
        const match = buttonId.match(/setFrequencyButton([A-Z])(\d+)/);
        if (match) {
          currentPresetBank = match[1];
          currentPresetIndex = parseInt(match[2]);
          console.log(`[${pluginName}] Keyboard navigation initialised from highlighted preset: ${currentPresetBank}${currentPresetIndex + 1}`);
        }
      } else {
        const match = buttonId.match(/setFrequencyButton(\d+)/);
        if (match) {
          currentPresetIndex = parseInt(match[1]);
          currentPresetBank = currentBank;
          console.log(`[${pluginName}] Keyboard navigation initialised from highlighted preset: ${currentPresetBank}${currentPresetIndex + 1}`);
        }
      }
      return true;
    }
    return false;
  };

  const waitForButtons = () => {
    const allButtons = container.querySelectorAll('button');
    if (allButtons.length === 0) {
      setTimeout(waitForButtons, 50);
      return;
    }

    if (initializeFromHighlighted()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (initializeFromHighlighted()) {
        observer.disconnect();
      }
    });

    observer.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
    }, 2000);
  };

  waitForButtons();
}

initialiseKeyboardNavigation();

function getAllVisiblePresets() {
  const presets = [];

  if (bankDisplayAll) {
    for (let bankIndex = 0; bankIndex < bankQuantity; bankIndex++) {
      const bank = bankNames[bankIndex];
      const storedData = getStoredData(bank);
      const buttonValues = storedData.values || [];

      for (let presetIndex = 0; presetIndex < presetCount; presetIndex++) {
        presets.push({
          bank: bank,
          index: presetIndex,
          frequency: buttonValues[presetIndex] || 87.5,
          buttonId: `setFrequencyButton${bank}${presetIndex}`
        });
      }
    }
  } else {
    const storedData = getStoredData(currentBank);
    const buttonValues = storedData.values || [];

    for (let presetIndex = 0; presetIndex < presetCount; presetIndex++) {
      presets.push({
        bank: currentBank,
        index: presetIndex,
        frequency: buttonValues[presetIndex] || 87.5,
        buttonId: `setFrequencyButton${presetIndex}`
      });
    }
  }

  return presets;
}

function getCurrentPresetPosition() {
  const allPresets = getAllVisiblePresets();

  for (let i = 0; i < allPresets.length; i++) {
    if (allPresets[i].bank === currentPresetBank && allPresets[i].index === currentPresetIndex) {
      return i;
    }
  }

  return 0;
}

function getNextPreset() {
  const allPresets = getAllVisiblePresets();
  const currentPosition = getCurrentPresetPosition();
  const nextPosition = (currentPosition + 1) % allPresets.length;
  return allPresets[nextPosition];
}

function getPreviousPreset() {
  const allPresets = getAllVisiblePresets();
  const currentPosition = getCurrentPresetPosition();
  const prevPosition = (currentPosition - 1 + allPresets.length) % allPresets.length;
  return allPresets[prevPosition];
}

function navigateToNextPreset() {
  if (!hasUsedKeyboardNavigation) {
    const highlightedPresets = document.querySelectorAll('#presets-grid button.preset-active');

    if (highlightedPresets.length === 0) {
      hasUsedKeyboardNavigation = true;
      const currentPreset = {
        bank: currentPresetBank,
        index: currentPresetIndex,
        buttonId: bankDisplayAll ? `setFrequencyButton${currentPresetBank}${currentPresetIndex}` : `setFrequencyButton${currentPresetIndex}`
      };
      recallPreset(currentPreset);
      return;
    } else {
      hasUsedKeyboardNavigation = true;
    }
  }

  const nextPreset = getNextPreset();
  recallPreset(nextPreset);
}

function navigateToPreviousPreset() {
  if (!hasUsedKeyboardNavigation) {
    const highlightedPresets = document.querySelectorAll('#presets-grid button.preset-active');

    if (highlightedPresets.length === 0) {
      hasUsedKeyboardNavigation = true;
      const currentPreset = {
        bank: currentPresetBank,
        index: currentPresetIndex,
        buttonId: bankDisplayAll ? `setFrequencyButton${currentPresetBank}${currentPresetIndex}` : `setFrequencyButton${currentPresetIndex}`
      };
      recallPreset(currentPreset);
      return;
    } else {
      hasUsedKeyboardNavigation = true;
    }
  }

  const prevPreset = getPreviousPreset();
  recallPreset(prevPreset);
}

function recallPreset(preset) {
  const storedData = getStoredData(preset.bank);
  const buttonValues = storedData.values;
  const antennaValues = storedData.antennas || [];

  if (buttonValues && buttonValues[preset.index] !== undefined) {
    const presetInput = buttonValues[preset.index];
    const antennaInput = antennaValues[preset.index];

    if (socket.readyState === WebSocket.OPEN) {
      socket.send("T" + (Math.round((presetInput).toFixed(3) * 1000)));
      if (optionSaveAntenna && antennaInput && antennaInput !== getCurrentAntennaValue()) socket.send("Z" + antennaInput);
    }

    currentPresetIndex = preset.index;
    currentPresetBank = preset.bank;
    lastUsedPreset = {bank: preset.bank, index: preset.index};

    const dataFrequencyElement = document.getElementById('data-frequency');
    if (!dataFrequencyElement) return;
    const currentFrequency = parseFloat(dataFrequencyElement.textContent) || 0;

    if (currentFrequency === presetInput) setTimeout(highlightActivePreset, 10);

    console.log(`[${pluginName}] Keyboard shortcut:`, presetInput, preset.bank, (preset.index + 1));
  }
}

function highlightActivePreset() {
  const dataFrequencyElement = document.getElementById('data-frequency');
  if (!optionHighlightSelectedPreset || !dataFrequencyElement) return;

  const currentFrequency = parseFloat(dataFrequencyElement.textContent) || 0;

  const allButtons = document.querySelectorAll('#presets-grid .preset-btn');
  allButtons.forEach(btn => btn.classList.remove('preset-active'));

  if (lastUsedPreset) {
    const lastPresetData = getStoredData(lastUsedPreset.bank);
    if (lastPresetData.values && lastPresetData.values[lastUsedPreset.index] !== undefined) {
      const lastPresetFreq = parseFloat(lastPresetData.values[lastUsedPreset.index]) || 0;

      if (Math.abs(currentFrequency - lastPresetFreq) < 0.001) {
        const buttonId = bankDisplayAll ?
          `setFrequencyButton${lastUsedPreset.bank}${lastUsedPreset.index}` :
          `setFrequencyButton${lastUsedPreset.index}`;
        const button = document.getElementById(buttonId);
        if (button) {
          button.classList.add('preset-active');
        }
        return;
      }
    }
  }

  if (bankDisplayAll) {
    for (let bankIndex = 0; bankIndex < bankQuantity; bankIndex++) {
      const bank = bankNames[bankIndex];
      const storedData = getStoredData(bank);
      const buttonValues = storedData.values || [];

      for (let i = 0; i < buttonValues.length && i < presetCount; i++) {
        const presetFreq = parseFloat(buttonValues[i]) || 0;

        if (Math.abs(currentFrequency - presetFreq) < 0.001) {
          const button = document.getElementById(`setFrequencyButton${bank}${i}`);
          if (button) {
            button.classList.add('preset-active');
          }
        }
      }
    }
  } else {
    const storedData = getStoredData(currentBank);
    const buttonValues = storedData.values || [];

    for (let i = 0; i < buttonValues.length && i < presetCount; i++) {
      const presetFreq = parseFloat(buttonValues[i]) || 0;

      if (Math.abs(currentFrequency - presetFreq) < 0.001) {
        const button = document.getElementById(`setFrequencyButton${i}`);
        if (button) {
          button.classList.add('preset-active');
        }
      }
    }
  }
}

function startFrequencyMonitoring() {
  const monitorEveryFrequencyChange = true;
  if (frequencyObserver) {
    frequencyObserver.disconnect();
  }

  const dataFrequencyElement = document.getElementById('data-frequency');
  if (!dataFrequencyElement) {
    setTimeout(startFrequencyMonitoring, 1000);
    return;
  }

  frequencyObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        setTimeout(() => {
          highlightActivePreset();
          if (monitorEveryFrequencyChange) updateKeyboardNavigationPosition();
        }, 0);
      }
    });
  });

  frequencyObserver.observe(dataFrequencyElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  highlightActivePreset();
}

function updateKeyboardNavigationPosition() {
  const highlightedButtons = document.querySelectorAll('#presets-grid button.preset-active');

  if (highlightedButtons.length > 0) {
    const firstHighlighted = highlightedButtons[0];
    const buttonId = firstHighlighted.id;

    if (bankDisplayAll) {
      const match = buttonId.match(/setFrequencyButton([A-Z])(\d+)/);
      if (match) {
        currentPresetBank = match[1];
        currentPresetIndex = parseInt(match[2]);
      }
    } else {
      const match = buttonId.match(/setFrequencyButton(\d+)/);
      if (match) {
        currentPresetIndex = parseInt(match[1]);
        currentPresetBank = currentBank;
      }
    }
  }
}

document.addEventListener('keydown', function(e) {
  const activeElement = document.activeElement;
  const isInputFocused = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  );

  if (!isInputFocused) {
    if (e.key === ']') {
      if (!keysPressed.has(']')) {
        keysPressed.add(']');
        e.preventDefault();
        navigateToNextPreset();
      }
    }
    else if (e.key === '[') {
      if (!keysPressed.has('[')) {
        keysPressed.add('[');
        e.preventDefault();
        navigateToPreviousPreset();
      }
    }
  }
});

document.addEventListener('keyup', function(e) {
  if (e.key === ']' || e.key === '[') {
    keysPressed.delete(e.key);
  }
});

const container = document.querySelector('.wrapper-outer #wrapper .flex-container') || document.querySelector('#wrapper-outer #wrapper .flex-container');

if (document.getElementById('rt-container')) {
  container.parentNode.insertBefore(buttonWrapper, container.nextSibling);
}

// ============================================================
// 显示/隐藏 核心逻辑
// ============================================================
function toggleButtonContainer(statusToast) {
  const isHidden = JSON.parse(localStorage.getItem(DISPLAY_KEY_ButtonPresets)) == true;
  if (isHidden) {
    if (typeof sendToast === 'function' && statusToast) {
      sendToast('info', 'Preset Buttons', 'Preset Buttons hidden.', false, false);
      console.log(`[${pluginName}] Button Preset plugin hidden`);
    }
    let wrapper = document.getElementById('plugin-presets-container');
    if (wrapper) {
      wrapper.style.setProperty('display', 'none');
      wrapper.style.setProperty('margin', '0');
      wrapper.style.setProperty('padding', '0');
      wrapper.style.setProperty('border', 'none');
    }
  } else {
    if (typeof sendToast === 'function' && statusToast) {
      sendToast('info', 'Preset Buttons', 'Preset Buttons restored.', false, false);
      console.log(`[${pluginName}] Button Preset plugin restored`);
    }
    let wrapper = document.getElementById('plugin-presets-container');
    if (wrapper && window.location.pathname !== '/setup') {
      wrapper.style.setProperty('display', 'flex');
      wrapper.style.setProperty('margin-top', '20px');
      wrapper.style.setProperty('padding', '14px 10px');
      wrapper.style.setProperty('border-top', '1px solid rgba(255,255,255,0.08)');
    }
  }
}

toggleButtonContainer();

// ============================================================
// Settings 界面注入：Hide Preset Buttons 复选框
// ============================================================
function AdditionalCheckboxesButtonPresets() {
  function insertHtmlAfterLastCheckbox() {
    const checkboxes = document.querySelectorAll('.modal-panel-content .form-group');
    if (checkboxes.length === 0) {
      return false;
    }

    if (document.getElementById('hide-preset-buttons')) {
      return true;
    }

    const newDiv = document.createElement('div');
    newDiv.className = 'form-group';
    newDiv.innerHTML = `
      <div class="switch flex-container flex-phone flex-phone-column flex-phone-center">
        <input type="checkbox" tabindex="0" id="hide-preset-buttons"
               aria-label="Hide preset buttons">
        <label for="hide-preset-buttons" class="tooltip"
               data-tooltip="Enable if you do not want to use the preset buttons."></label>
        <span class="text-smaller text-uppercase text-bold color-4 p-10">Hide Preset Buttons</span>
      </div>
    `;

    const lastCheckbox = checkboxes[checkboxes.length - 1];
    lastCheckbox.insertAdjacentElement('afterend', newDiv);
    return true;
  }

  function tryInject() {
    if (!insertHtmlAfterLastCheckbox()) return false;

    const cb = document.getElementById('hide-preset-buttons');
    if (!cb) return false;

    const isHidden = localStorage.getItem(DISPLAY_KEY_ButtonPresets) === 'true';
    cb.checked = isHidden;

    if (!cb.dataset.bound) {
      cb.dataset.bound = '1';
      cb.addEventListener('change', function () {
        localStorage.setItem(DISPLAY_KEY_ButtonPresets, this.checked);
        toggleButtonContainer(true);
      });
    }
    return true;
  }

  if (tryInject()) return;

  const observer = new MutationObserver(() => {
    if (tryInject()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => observer.disconnect(), 10000);
}

if (optionHidePresetButtons) {
  AdditionalCheckboxesButtonPresets();
}

// ============================================================
// Settings 界面注入：Show All Presets 复选框（可选）
// ============================================================
function AdditionalCheckboxesDisplayAll() {
  function insertHtml() {
    const checkboxes = document.querySelectorAll('.modal-panel-content .form-group');
    if (checkboxes.length === 0) return false;
    if (document.getElementById('show-all-preset-buttons')) return true;

    const newDiv = document.createElement('div');
    newDiv.className = 'form-group';
    newDiv.innerHTML = `
      <div class="switch flex-container flex-phone flex-phone-column flex-phone-center">
        <input type="checkbox" tabindex="0" id="show-all-preset-buttons"
               aria-label="Show all preset buttons">
        <label for="show-all-preset-buttons" class="tooltip"
               data-tooltip="Enable to display all preset banks on screen."></label>
        <span class="text-smaller text-uppercase text-bold color-4 p-10">Show All Presets</span>
      </div>
    `;

    const lastCheckbox = checkboxes[checkboxes.length - 1];
    lastCheckbox.insertAdjacentElement('afterend', newDiv);
    return true;
  }

  function tryInject() {
    if (!insertHtml()) return false;
    const cb = document.getElementById('show-all-preset-buttons');
    if (!cb) return false;

    cb.checked = localStorage.getItem(DISPLAY_ALL_KEY) === 'true';

    if (!cb.dataset.bound) {
      cb.dataset.bound = '1';
      cb.addEventListener('change', function () {
        setDisplayAll(this.checked);
      });
    }
    return true;
  }

  if (tryInject()) return;

  const observer = new MutationObserver(() => {
    if (tryInject()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
}

// 暂时不向settings面板注入"SHOW ALL PRESETS"
if (optionHideDisplayAll) {
  AdditionalCheckboxesDisplayAll();
}


// ============================================================
// 导出/导入/服务器配置
// ============================================================
function exportLocalStorageToFile() {
  const config = {
    version: pluginVersion + '-mod',
    exportDate: new Date().toISOString(),
    presetCount: presetCount,
    bankQuantity: bankQuantity,
    bankNames: bankDisplayNames,
    bankNameKeys: bankNames,
    settings: {
      displayAll: localStorage.getItem(DISPLAY_ALL_KEY) === 'true',
      hidden: localStorage.getItem(DISPLAY_KEY_ButtonPresets) === 'true',
      savedDefaultBank: localStorage.getItem(SAVED_BANK_KEY) || 'A'
    },
    banks: {}
  };

  bankNames.forEach(bank => {
    const storedData = getStoredData(bank);
    config.banks[bank] = {
      values: storedData.values,
      antennas: storedData.antennas,
      ps: storedData.ps,
      tooltips: storedData.tooltips,
      stationNames: storedData.stationNames
    };
  });

  const jsonData = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const tunerNameEl = document.querySelector(
    ".wrapper-outer.dashboard-panel .panel-100-real #tuner-name.text-left"
  );

  let tunerName = Date.now();

  if (tunerNameEl) {
    tunerName = tunerNameEl.textContent.trim();
    tunerName = tunerName.replace(/\s+/g, "_");
    tunerName = tunerName.replace(/[^a-zA-Z0-9]/g, "_");
    tunerName = tunerName.replace(/_+/g, "_");
    tunerName = tunerName.replace(/^_+|_+$/g, "");
    tunerName = tunerName.slice(0, 32);
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = 'Presets_Config_' + tunerName + '.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  if (typeof sendToast === 'function') {
    sendToast('success', 'Preset Buttons Export', `All ${bankQuantity} banks (${presetCount} presets each) exported successfully.`, false, false);
  }
}

function createFileInputAndImport() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';

  document.body.appendChild(fileInput);

  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      importLocalStorageFromFile(file);
    }
  });

  fileInput.click();
  fileInput.remove();
}

function importLocalStorageFromFile(file) {
  const reader = new FileReader();

  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      let importedCount = 0;
      let isNewFormat = false;

      if (data.banks && typeof data.banks === 'object') {
        isNewFormat = true;

        if (data.bankNames && Array.isArray(data.bankNames)) {
          const customNames = [];
          for (let i = 0; i < bankQuantity; i++) {
            customNames.push(data.bankNames[i] || '');
          }
          localStorage.setItem('buttonPresetsBankNames', JSON.stringify(customNames));
          bankDisplayNames = getBankDisplayNames();
        }

        if (data.settings) {
          if (data.settings.displayAll !== undefined) {
            localStorage.setItem(DISPLAY_ALL_KEY, data.settings.displayAll);
            bankDisplayAll = data.settings.displayAll;
          }
          if (data.settings.hidden !== undefined) {
            localStorage.setItem(DISPLAY_KEY_ButtonPresets, data.settings.hidden);
          }
          if (data.settings.savedDefaultBank !== undefined) {
            localStorage.setItem(SAVED_BANK_KEY, data.settings.savedDefaultBank);
            SavedDefaultBank = data.settings.savedDefaultBank;
          }
        }

        bankNames.forEach(bank => {
          if (data.banks[bank]) {
            const bankData = data.banks[bank];
            const saveData = {
              values: bankData.values || [],
              antennas: bankData.antennas || [],
              ps: bankData.ps || [],
              tooltips: bankData.tooltips || [],
              stationNames: bankData.stationNames || []
            };
            localStorage.setItem(`buttonPresets${bank}`, JSON.stringify(saveData));
            importedCount++;
          }
        });
      } else {
        bankNames.forEach(bank => {
          const key = `buttonPresets${bank}`;
          if (data[key]) {
            localStorage.setItem(key, data[key]);
            importedCount++;
          }
        });
      }

      if (!bankDisplayAll) {
        currentBank = SavedDefaultBank || 'A';
      }

      updateButtons();
      updateBankTitle();
      toggleButtonContainer();

      if (typeof sendToast === 'function') {
        const formatText = isNewFormat ? ' (config format)' : ' (legacy format)';
        sendToast('success', 'Preset Buttons Import', `Successfully imported <strong>${importedCount}</strong> bank(s)${formatText}.`, false, false);
      }
      console.log(`[${pluginName}] Button Preset config imported successfully (${importedCount} banks)`);
    } catch (e) {
      if (typeof sendToast === 'function') {
        sendToast('error', 'Preset Buttons Import', 'Error importing preset data: ' + e.message, false, false);
      }
      console.error('Unable to import preset config', e);
    }
  };

  reader.onerror = function(event) {
    console.error('Error reading file:', event);
  };

  reader.readAsText(file);
}

function updateBankTitle() {
  if (!bankTitleEl) return;
  const nameEl = bankTitleEl.querySelector('.bank-name-text');
  if (!nameEl) return;

  if (bankDisplayAll) {
    nameEl.textContent = '全部';
  } else {
    const idx = bankNames.indexOf(currentBank);
    const displayName = idx >= 0 ? (bankDisplayNames[idx] || currentBank) : currentBank;
    nameEl.textContent = displayName;
  }
}

// ============================================================
// Server-side presets_config.json storage
// ============================================================
(function initConfigPath() {
  if (_resolvedConfigPath) return;
  const pluginDir = _detectPluginPath();
  if (pluginDir) {
    _resolvedConfigPath = pluginDir + 'presets_config.json';
  } else {
    _resolvedConfigPath = 'presets_config.json';
  }
  console.log(`[${pluginName}] Config path:`, _resolvedConfigPath);
})();

function buildConfigObject() {
  const config = {
    version: pluginVersion + '-mod',
    lastModified: new Date().toISOString(),
    presetCount: presetCount,
    bankQuantity: bankQuantity,
    bankNames: bankDisplayNames,
    bankNameKeys: bankNames,
    settings: {
      displayAll: localStorage.getItem(DISPLAY_ALL_KEY) === 'true',
      hidden: localStorage.getItem(DISPLAY_KEY_ButtonPresets) === 'true',
      savedDefaultBank: localStorage.getItem(SAVED_BANK_KEY) || 'A'
    },
    banks: {}
  };

  bankNames.forEach(bank => {
    const storedData = getStoredData(bank);
    config.banks[bank] = {
      values: storedData.values,
      antennas: storedData.antennas,
      ps: storedData.ps,
      tooltips: storedData.tooltips,
      stationNames: storedData.stationNames
    };
  });

  return config;
}

function applyConfigData(data) {
  if (!data || !data.banks) {
    throw new Error('Invalid config format');
  }

  if (data.bankNames && Array.isArray(data.bankNames)) {
    const customNames = [];
    for (let i = 0; i < bankQuantity; i++) {
      customNames.push(data.bankNames[i] || '');
    }
    localStorage.setItem('buttonPresetsBankNames', JSON.stringify(customNames));
    bankDisplayNames = getBankDisplayNames();
  }

  if (data.settings) {
    if (data.settings.displayAll !== undefined) {
      localStorage.setItem(DISPLAY_ALL_KEY, data.settings.displayAll);
      bankDisplayAll = data.settings.displayAll;
    }
    if (data.settings.hidden !== undefined) {
      localStorage.setItem(DISPLAY_KEY_ButtonPresets, data.settings.hidden);
    }
    if (data.settings.savedDefaultBank !== undefined) {
      localStorage.setItem(SAVED_BANK_KEY, data.settings.savedDefaultBank);
      SavedDefaultBank = data.settings.savedDefaultBank;
    }
  }

  let importedBanks = 0;
  bankNames.forEach(bank => {
    if (data.banks[bank]) {
      const bankData = data.banks[bank];
      const ensureLength = (arr, fallback, count) => {
        const result = [...(arr || [])];
        while (result.length < count) result.push(fallback);
        return result.slice(0, count);
      };
      const saveData = {
        values: ensureLength(bankData.values, 87.5, presetCount),
        antennas: ensureLength(bankData.antennas, '', presetCount),
        ps: ensureLength(bankData.ps, '', presetCount),
        tooltips: ensureLength(bankData.tooltips, '', presetCount),
        stationNames: ensureLength(bankData.stationNames, '', presetCount)
      };
      localStorage.setItem(`buttonPresets${bank}`, JSON.stringify(saveData));
      importedBanks++;
    }
  });

  if (!bankDisplayAll) {
    currentBank = SavedDefaultBank || 'A';
  }

  updateButtons();
  updateBankTitle();
  toggleButtonContainer();

  return importedBanks;
}

function loadConfigFromServer(showToast) {
  showToast = !!showToast;
  return new Promise((resolve, reject) => {
    const path = _resolvedConfigPath || 'presets_config.json';

    fetch(path + '?t=' + Date.now(), { cache: 'no-store' })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP ${response.status} at ${path}`));
          return;
        }
        return response.json();
      })
      .then(data => {
        if (!data) {
          reject(new Error('Empty response'));
          return;
        }
        try {
          const count = applyConfigData(data);
          console.log(`[${pluginName}] Config loaded from ${path} (${count} banks)`);
          if (showToast && typeof sendToast === 'function') {
            sendToast('success', 'Preset Buttons',
              `已从服务端加载配置 (${count} 个 bank)<br><small>${path}</small>`, false, false);
          }
          resolve(count);
        } catch (e) {
          reject(e);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function manualLoadFromServer() {
  if (typeof sendToast === 'function') {
    sendToast('info', 'Preset Buttons', '正在从服务端加载配置...', false, false);
  }

  loadConfigFromServer(true)
    .catch(() => {
      if (typeof sendToast === 'function') {
        sendToast('error', 'Preset Buttons',
          `<strong>未找到配置文件</strong><br>` +
          `路径：<code>${_resolvedConfigPath}</code><br><br>` +
          `请将 <code>presets_config.json</code> 放到插件目录：<br>` +
          `<code>/js/plugins/ButtonPresets/</code><br>` +
          `<strong>如果以上无误，那么注意是否脚本出错了！</strong>`
          ,
          false, true);
      }
    });
}

function initServerConfig() {
  if (!autoLoadFromServer) return;

  // 本地有完整设置 → 不加载服务器配置
  if (isLocalStorageComplete()) {
    console.log(`[${pluginName}] localStorage complete, skip server config`);
    return;
  }

  // 本地不完整 → 从服务器加载作为初始默认值
  setTimeout(() => {
    loadConfigFromServer()
      .then((count) => {
        console.log(`[${pluginName}] Auto-loaded ${count} banks from server`);
      })
      .catch((err) => {
        console.log(`[${pluginName}] Server config not found:`, err.message);
      });
  }, 800);
}

// 初始化：先渲染 localStorage，再决定是否加载服务器配置
initServerConfig();

})();