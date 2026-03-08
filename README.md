<img src="images/banner.svg" width="1900" height="200" alt="Description">

# Meta Scrambler

Meta Scrambler is a Chrome extension that removes metadata from files before sharing. When you take a photo or create a document, hidden information is embedded in the file that can reveal sensitive details about you, your location, and your devices.

## Why Remove Metadata?

Every file you create contains metadata - hidden information that describes the file itself. This can include:

- **GPS Location** - Photos from smartphones often contain exact coordinates where they were taken, potentially revealing your home address, workplace, or daily routines
- **Device Information** - Camera make, model, and serial numbers that can identify your specific device
- **Timestamps** - Date and time when the file was created, modified, or accessed
- **Author Information** - Names, usernames, and software details from documents
- **Software Details** - Which applications and versions were used to create or edit the file

This metadata is automatically added by cameras, phones, and software without your knowledge. When you share files online - whether on social media, email, or file sharing platforms - this hidden information travels with your file and can be extracted by anyone who downloads it.

Meta Scrambler protects your privacy by stripping all metadata from your files directly in your browser, before you share them. Nothing is uploaded to any server - all processing happens locally on your device.

## Features

- Remove metadata from images without uploading to any server
- All processing happens locally in your browser
- Simple drag-and-drop interface
- Settings page to customize behavior
- Choose between clipboard or download for output

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the project folder
5. The extension icon will appear in your toolbar

## Usage

1. Click the Meta Scrambler icon in your Chrome toolbar
2. Drag and drop a file or click to select
3. Click "Remove Metadata"
4. Choose to copy to clipboard or download the cleaned file

## Supported File Types

| File Type | Extension   | Status          |
| --------- | ----------- | --------------- |
| JPEG      | .jpg, .jpeg | Working         |
| PNG       | .png        | Working         |
| WebP      | .webp       | Working         |
| GIF       | .gif        | Working         |
| TIFF      | .tiff, .tif | Limited         |
| PDF       | .pdf        | Not Implemented |
| DOCX      | .docx       | Not Implemented |
| XLSX      | .xlsx       | Not Implemented |
| PPTX      | .pptx       | Not Implemented |
| DOC       | .doc        | Not Implemented |

## Settings

Access settings by clicking the gear icon in the popup or through `chrome://extensions`.

Available settings:

- Toggle which file types are enabled
- Default output method (Clipboard or Download)
- Custom file suffix for downloaded files

## Dependencies

- exifr (v8.x) - JavaScript library for reading image metadata

## Project Structure

```
meta-scrambler/
├── index.html          # Main popup UI
├── popup.js            # Popup logic
├── options.html        # Settings page UI
├── options.js          # Settings logic
├── manifest.json       # Extension manifest
├── lib/
│   └── exifr.js       # EXIF reading library
└── src/
    └── handlers/
        ├── index.js           # Handler router
        ├── imageHandlers.js   # Image metadata removal
        └── documentHandlers.js # Document handlers (placeholder)
```

## Version History

### v0.10 (Current)

- Initial release
- JPEG, PNG, WebP, GIF metadata removal working
- Basic settings page with file type toggles
- Clipboard and download output options

### v0.20 (Planned)

- Add PDF metadata removal support
- Add DOCX metadata removal support

### v0.30 (Planned)

- Add XLSX metadata removal support
- Add PPTX metadata removal support

### v1.0 (Planned)

- All supported file types fully implemented
- Settings sync across devices
- Additional features based on user feedback
