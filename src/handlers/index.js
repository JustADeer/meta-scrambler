import imageHandlers from './imageHandlers.js';
import documentHandlers from './documentHandlers.js';

const allHandlers = {
  ...imageHandlers,
  ...documentHandlers,
};

const handlerCategories = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'],
  document: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
  ],
};

const DEFAULT_SETTINGS = {
  enabledTypes: [],
  outputMethod: 'download',
  fileSuffix: '_clean',
  dateRandomizer: false,
  dateMinYear: 2020,
  dateMaxYear: 2025,
};

function getMimeCategory(mimeType) {
  for (const [category, types] of Object.entries(handlerCategories)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'unknown';
}

function isSupported(mimeType) {
  return mimeType in allHandlers;
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || DEFAULT_SETTINGS);
    });
  });
}

async function removeMetadata(file) {
  const settings = await getSettings();
  const buffer = await file.arrayBuffer();
  const mimeType = file.type || getMimeTypeFromName(file.name);
  
  if (isSupported(mimeType)) {
    return await allHandlers[mimeType](buffer, settings);
  }

  console.warn(`No handler for ${mimeType}, returning original file`);
  return new Blob([buffer], { type: mimeType || 'application/octet-stream' });
}

function getMimeTypeFromName(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

export { removeMetadata, isSupported, getMimeCategory, handlerCategories };
