const DEFAULT_SETTINGS = {
  enabledTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
  ],
  outputMethod: 'download',
  fileSuffix: '_clean',
  dateRandomizer: false,
  dateMinYear: 2020,
  dateMaxYear: 2025,
};

const statusEl = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const outputMethodSelect = document.getElementById('outputMethod');
const fileSuffixInput = document.getElementById('fileSuffix');
const fileTypeCheckboxes = document.querySelectorAll('input[name="fileType"]');
const dateRandomizerToggle = document.getElementById('dateRandomizer');
const dateSliderContainer = document.getElementById('dateSliderContainer');
const thumbMin = document.getElementById('thumbMin');
const thumbMax = document.getElementById('thumbMax');
const dateSliderRange = document.getElementById('dateSliderRange');
const dateMinValue = document.getElementById('dateMinValue');
const dateMaxValue = document.getElementById('dateMaxValue');

const MIN_YEAR = 2000;
const MAX_YEAR = 2030;

let minYear = 2020;
let maxYear = 2025;

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

function updateSliderUI() {
  const totalRange = MAX_YEAR - MIN_YEAR;
  const minPercent = ((minYear - MIN_YEAR) / totalRange) * 100;
  const maxPercent = ((maxYear - MIN_YEAR) / totalRange) * 100;
  
  thumbMin.style.left = `${minPercent}%`;
  thumbMax.style.left = `${maxPercent}%`;
  dateSliderRange.style.left = `${minPercent}%`;
  dateSliderRange.style.width = `${maxPercent - minPercent}%`;
  
  dateMinValue.textContent = minYear.toString();
  dateMaxValue.textContent = maxYear.toString();
}

function initSlider() {
  let isDragging = null;
  
  thumbMin.addEventListener('mousedown', () => { isDragging = 'min'; });
  thumbMax.addEventListener('mousedown', () => { isDragging = 'max'; });
  document.addEventListener('mouseup', () => { isDragging = null; });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const track = document.getElementById('dateSliderTrack');
    const rect = track.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    
    const year = Math.round(MIN_YEAR + percent * (MAX_YEAR - MIN_YEAR));
    
    if (isDragging === 'min' && year < maxYear - 1) {
      minYear = year;
    } else if (isDragging === 'max' && year > minYear + 1) {
      maxYear = year;
    }
    
    updateSliderUI();
  });
  
  updateSliderUI();
}

dateRandomizerToggle.addEventListener('change', () => {
  if (dateRandomizerToggle.checked) {
    dateSliderContainer.classList.add('active');
  } else {
    dateSliderContainer.classList.remove('active');
  }
});

function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || DEFAULT_SETTINGS;
    
    fileTypeCheckboxes.forEach(checkbox => {
      checkbox.checked = settings.enabledTypes.includes(checkbox.value);
    });
    
    outputMethodSelect.value = settings.outputMethod;
    fileSuffixInput.value = settings.fileSuffix;
    dateRandomizerToggle.checked = settings.dateRandomizer;
    
    minYear = settings.dateMinYear || 2020;
    maxYear = settings.dateMaxYear || 2025;
    
    if (settings.dateRandomizer) {
      dateSliderContainer.classList.add('active');
    }
    
    updateSliderUI();
  });
}

function saveSettings() {
  const enabledTypes = Array.from(fileTypeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  if (enabledTypes.length === 0) {
    showStatus('Please enable at least one file type', 'error');
    return;
  }
  
  const settings = {
    enabledTypes,
    outputMethod: outputMethodSelect.value,
    fileSuffix: fileSuffixInput.value.trim() || '_clean',
    dateRandomizer: dateRandomizerToggle.checked,
    dateMinYear: minYear,
    dateMaxYear: maxYear,
  };
  
  chrome.storage.local.set({ settings }, () => {
    showStatus('Settings saved!', 'success');
  });
}

saveBtn.addEventListener('click', saveSettings);

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initSlider();
});
