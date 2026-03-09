/**
 * PNG Icon Generator for PWA
 *
 * Generates placeholder bear face icons as minimal valid PNGs.
 * Run: node scripts/generate-icons.mjs
 *
 * For better quality icons, open scripts/generate-icons.html in a browser
 * and save the canvas images.
 */
import { writeFileSync, mkdirSync } from 'fs';

// Minimal 1x1 brown pixel PNG as a tiny placeholder
// For proper icons, use the generate-icons.html canvas approach
function createMinimalPNG(size) {
  // PNG file structure
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBytes = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeBytes, data]);
    const crc = Buffer.alloc(4);
    const crcVal = crc32(combined);
    new DataView(crc.buffer).setUint32(0, crcVal, false);
    return Buffer.concat([length, combined, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type (RGB)
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // IDAT - simple brown circle on cream background
  const rawData = [];
  const cx = size / 2;
  const cy = size / 2;
  const faceR = size * 0.38;
  const earR = faceR * 0.35;
  const earOffset = faceR * 0.7;
  const muzzleRx = faceR * 0.45;
  const muzzleRy = faceR * 0.35;
  const muzzleCy = cy + faceR * 0.25;

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check ears
      const earDist1 = Math.sqrt((x - (cx - earOffset)) ** 2 + (y - (cy - earOffset)) ** 2);
      const earDist2 = Math.sqrt((x - (cx + earOffset)) ** 2 + (y - (cy - earOffset)) ** 2);
      const innerEarDist1 = earDist1;
      const innerEarDist2 = earDist2;

      // Check muzzle
      const muzzleDist = ((x - cx) / muzzleRx) ** 2 + ((y - muzzleCy) / muzzleRy) ** 2;

      // Check eyes
      const eyeY = cy - faceR * 0.15;
      const eyeXOff = faceR * 0.3;
      const eyeDist1 = Math.sqrt((x - (cx - eyeXOff)) ** 2 + (y - eyeY) ** 2);
      const eyeDist2 = Math.sqrt((x - (cx + eyeXOff)) ** 2 + (y - eyeY) ** 2);
      const eyeR = faceR * 0.08;

      // Check nose
      const noseY = cy + faceR * 0.1;
      const noseDist = ((x - cx) / (faceR * 0.1)) ** 2 + ((y - noseY) / (faceR * 0.07)) ** 2;

      let r, g, b;

      if (eyeDist1 < eyeR || eyeDist2 < eyeR || noseDist < 1) {
        // Eyes and nose: dark brown
        r = 42; g = 26; b = 14;
      } else if (muzzleDist < 1 && dist < faceR) {
        // Muzzle: light tan
        r = 212; g = 165; b = 116;
      } else if (dist < faceR) {
        // Face: brown
        r = 160; g = 114; b = 42;
      } else if (innerEarDist1 < earR * 0.6 || innerEarDist2 < earR * 0.6) {
        // Inner ear: light tan
        r = 212; g = 165; b = 116;
      } else if (earDist1 < earR || earDist2 < earR) {
        // Outer ear: dark brown
        r = 139; g = 105; b = 20;
      } else if (dist < size / 2) {
        // Background circle: cream
        r = 255; g = 248; b = 231;
      } else {
        // Outside: transparent (use cream for RGB)
        r = 255; g = 248; b = 231;
      }

      rawData.push(r, g, b);
    }
  }

  // Compress with deflate (use zlib-like raw deflate)
  // Simple store blocks (no compression, but valid deflate)
  const raw = Buffer.from(rawData);
  const blocks = [];
  const BLOCK_SIZE = 65535;

  // zlib header
  blocks.push(Buffer.from([0x78, 0x01]));

  for (let i = 0; i < raw.length; i += BLOCK_SIZE) {
    const end = Math.min(i + BLOCK_SIZE, raw.length);
    const block = raw.subarray(i, end);
    const isLast = end >= raw.length;
    const header = Buffer.alloc(5);
    header[0] = isLast ? 1 : 0;
    header.writeUInt16LE(block.length, 1);
    header.writeUInt16LE(block.length ^ 0xFFFF, 3);
    blocks.push(header, block);
  }

  // Adler32 checksum
  let a = 1, bv = 0;
  for (let i = 0; i < raw.length; i++) {
    a = (a + raw[i]) % 65521;
    bv = (bv + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  new DataView(adler.buffer).setUint32(0, ((bv << 16) | a) >>> 0, false);
  blocks.push(adler);

  const compressed = Buffer.concat(blocks);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', createMinimalPNG(192));
writeFileSync('public/icons/icon-512.png', createMinimalPNG(512));
console.log('Icons generated: public/icons/icon-192.png, public/icons/icon-512.png');
