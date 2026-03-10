import exifr from "../../lib/exifr.js";

const EXIF_MARKERS = {
  JPEG: {
    APP0: [0xff, 0xe0],
    APP1: [0xff, 0xe1],
    APP2: [0xff, 0xe2],
    APP3: [0xff, 0xe3],
    APP4: [0xff, 0xe4],
    APP5: [0xff, 0xe5],
    APP6: [0xff, 0xe6],
    APP7: [0xff, 0xe7],
    APP8: [0xff, 0xe8],
    APP9: [0xff, 0xe9],
    APP10: [0xff, 0xea],
    APP11: [0xff, 0xeb],
    APP12: [0xff, 0xec],
    APP13: [0xff, 0xed],
    APP14: [0xff, 0xee],
    APP15: [0xff, 0xef],
    COM: [0xff, 0xfe],
  },
};

function generateRandomDate(minYear, maxYear) {
  const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  const seconds = Math.floor(Math.random() * 60);

  return new Date(year, month, day, hours, minutes, seconds);
}

function formatExifDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function injectJpegDate(buffer, exifDate) {
  const arr = new Uint8Array(buffer);
  const result = [];

  const exifTemplate = createMinimalExif(exifDate);

  let i = 0;
  while (i < arr.length) {
    if (arr[i] === 0xff && arr[i + 1] === 0xd8) {
      result.push(arr[i], arr[i + 1]);
      i += 2;

      const inserted = insertExifSegment(result, exifTemplate);
      if (!inserted) {
        result.push(0xff, 0xe1);
        const length = exifTemplate.length + 2;
        result.push((length >> 8) & 0xff, length & 0xff);
        result.push(...exifTemplate);
      }
      break;
    } else {
      result.push(arr[i]);
      i++;
    }
  }

  while (i < arr.length) {
    result.push(arr[i]);
    i++;
  }

  return new Blob([new Uint8Array(result)], { type: "image/jpeg" });
}

function createMinimalExif(dateStr) {
  const ascii = (str) => str.split("").map((c) => c.charCodeAt(0));

  const tiff = [
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00,
    0x97, 0x01, 0x02, 0x00, 0x14, 0x00, 0x00, 0x00, 0x96, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00,
  ];

  const dateBytes = ascii(dateStr.padEnd(20, "\0"));
  const dateTag = [0x90, 0x00, 0x00, 0x00];
  const dateType = [0x02, 0x00, 0x00, 0x00];
  const dateCount = [0x14, 0x00, 0x00, 0x00];

  const ifd = [...dateTag, ...dateType, ...dateCount, ...dateBytes];

  const exifHeader = [
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00,
    0x00, 0x08,
  ];

  return [...exifHeader, 0x01, 0x00, ...ifd];
}

function insertExifSegment(result, exifData) {
  return false;
}

async function removeJpegMetadata(buffer) {
  const arr = new Uint8Array(buffer);
  const result = new Uint8Array(arr.length);
  let outIdx = 0;
  let i = 0;

  /*
  If it currently seeing a marker
  arr[i] is going to be `0xFF` in Hexadecimal,
  arr[i+1]
  */

  // Loop through image
  while (i < arr.length) {
    // Checks if the byte has a metadata marker
    if (arr[i] !== 0xff) {
      result[outIdx++] = arr[i++];
      continue;
    }

    // Checks if marker index **i** is at the last byte
    if (i + 1 >= arr.length) {
      result[outIdx++] = arr[i++];
      continue;
    }

    // Goes to the next marker
    const marker = arr[i + 1];

    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      marker === 0xd0 ||
      marker === 0xd1 ||
      marker === 0xd2 ||
      marker === 0xd3 ||
      marker === 0xd4 ||
      marker === 0xd5 ||
      marker === 0xd6 ||
      marker === 0xd7 ||
      marker === 0xd9
    ) {
      result[outIdx++] = arr[i++];
      result[outIdx++] = arr[i++];
      continue;
    }

    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      if (i + 3 >= arr.length) {
        result[outIdx++] = arr[i++];
        continue;
      }
      const length = (arr[i + 2] << 8) | arr[i + 3];
      i += 2 + length;
      continue;
    }

    result[outIdx++] = arr[i++];
  }

  return new Blob([result.slice(0, outIdx)], { type: "image/jpeg" });
}

async function removePngMetadata(buffer) {
  const arr = new Uint8Array(buffer);
  const chunks = [];
  let i = 8;

  chunks.push(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7]);

  while (i < arr.length - 4) {
    const length =
      (arr[i] << 24) | (arr[i + 1] << 16) | (arr[i + 2] << 8) | arr[i + 3];
    const type = String.fromCharCode(
      arr[i + 4],
      arr[i + 5],
      arr[i + 6],
      arr[i + 7],
    );

    const skipChunks = [
      "tEXt",
      "iTXt",
      "zTXt",
      "eXIf",
      "pHYs",
      "sBIT",
      "gAMA",
      "cHRM",
      "sRGB",
      "bKGD",
      "hIST",
      "tIME",
    ];

    if (skipChunks.includes(type)) {
      i += 12 + length;
      continue;
    }

    for (let j = 0; j < 12 + length && i + j < arr.length; j++) {
      chunks.push(arr[i + j]);
    }
    i += 12 + length;
  }

  return new Blob([new Uint8Array(chunks)], { type: "image/png" });
}

async function removeWebpMetadata(buffer) {
  return new Blob([buffer], { type: "image/webp" });
}

async function removeGifMetadata(buffer) {
  return new Blob([buffer], { type: "image/gif" });
}

async function removeTiffMetadata(buffer) {
  return new Blob([buffer], { type: "image/tiff" });
}

const imageHandlers = {
  "image/jpeg": async (buffer, settings = null) => {
    try {
      const metadata = await exifr.parse(buffer);
      console.log("JPEG metadata found:", metadata);
      console.log("Settings received:", settings);

      const cleanedBlob = await removeJpegMetadata(buffer);

      if (
        settings &&
        settings.dateRandomizer &&
        settings.dateMinYear &&
        settings.dateMaxYear
      ) {
        const randomDate = generateRandomDate(
          settings.dateMinYear,
          settings.dateMaxYear,
        );
        const exifDate = formatExifDate(randomDate);
        console.log("Random date generated:", exifDate);
        console.log(
          "Date range:",
          settings.dateMinYear,
          "-",
          settings.dateMaxYear,
        );
      }

      return cleanedBlob;
    } catch (e) {
      console.warn("Error processing JPEG:", e);
      return new Blob([buffer], { type: "image/jpeg" });
    }
  },

  "image/png": async (buffer) => {
    try {
      const metadata = await exifr.parse(buffer);
      console.log("PNG metadata found:", metadata);
      return await removePngMetadata(buffer);
    } catch (e) {
      console.warn("Error processing PNG:", e);
      return new Blob([buffer], { type: "image/png" });
    }
  },

  "image/webp": async (buffer) => {
    try {
      const metadata = await exifr.parse(buffer);
      console.log("WebP metadata found:", metadata);
      return await removeWebpMetadata(buffer);
    } catch (e) {
      console.warn("Error processing WebP:", e);
      return new Blob([buffer], { type: "image/webp" });
    }
  },

  "image/gif": async (buffer) => {
    try {
      const metadata = await exifr.parse(buffer);
      console.log("GIF metadata found:", metadata);
      return await removeGifMetadata(buffer);
    } catch (e) {
      console.warn("Error processing GIF:", e);
      return new Blob([buffer], { type: "image/gif" });
    }
  },

  "image/tiff": async (buffer) => {
    try {
      const metadata = await exifr.parse(buffer);
      console.log("TIFF metadata found:", metadata);
      return await removeTiffMetadata(buffer);
    } catch (e) {
      console.warn("Error processing TIFF:", e);
      return new Blob([buffer], { type: "image/tiff" });
    }
  },
};

export default imageHandlers;
