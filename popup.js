import { removeMetadata } from './src/handlers/index.js';

let files = [];
let processedBlob = null;

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const processBtn = document.getElementById('process-btn');
const statusEl = document.getElementById('status');
const output = document.getElementById('output');
const outputName = document.getElementById('output-name');
const outputSize = document.getElementById('output-size');
const clipboardBtn = document.getElementById('clipboard-btn');
const downloadBtn = document.getElementById('download-btn');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer?.files) {
    handleFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files) {
    handleFiles(fileInput.files);
  }
});

function handleFiles(fileList2) {
  for (const file of Array.from(fileList2)) {
    files.push({ file, processedBlob: null });
  }
  renderFileList();
  resetOutput();
}

function renderFileList() {
  fileList.innerHTML = '';
  
  files.forEach((fileData, index) => {
    const file = fileData.file;
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <div class="file-info">
        <span class="file-icon">${getFileIcon(file.type)}</span>
        <div>
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
      </div>
      <button class="remove-btn" data-index="${index}">×</button>
    `;
    fileList.appendChild(item);
  });

  fileList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      files.splice(index, 1);
      renderFileList();
    });
  });

  processBtn.disabled = files.length === 0;
}

function getFileIcon(mimeType) {
  if (!mimeType) return '📁';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  return '📁';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function resetOutput() {
  output.classList.remove('show');
  statusEl.classList.remove('show');
  processedBlob = null;
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
}

processBtn.addEventListener('click', async () => {
  if (files.length === 0) return;

  processBtn.disabled = true;
  showStatus('Processing...', 'processing');

  try {
    const fileData = files[0];
    const processed = await removeMetadata(fileData.file);
    processedBlob = processed;
    fileData.processedBlob = processed;

    outputName.textContent = fileData.file.name;
    outputSize.textContent = formatFileSize(processed.size);
    output.classList.add('show');
    statusEl.classList.remove('show');
  } catch (error) {
    showStatus(`Error: ${error.message || 'Unknown error'}`, 'error');
  }

  processBtn.disabled = false;
});

clipboardBtn.addEventListener('click', async () => {
  if (!processedBlob) return;

  try {
    const item = new ClipboardItem({ [processedBlob.type]: processedBlob });
    await navigator.clipboard.write([item]);
    showStatus('Copied to clipboard!', 'success');
  } catch (error) {
    showStatus('Clipboard failed - try download instead', 'error');
  }
});

downloadBtn.addEventListener('click', () => {
  if (!processedBlob) return;

  const originalName = files[0].file.name;
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const ext = dotIndex > 0 ? originalName.slice(dotIndex) : '';
  
  const url = URL.createObjectURL(processedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_clean${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  
  showStatus('Download started!', 'success');
});

const settingsLink = document.getElementById('settings-link');
settingsLink.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});
