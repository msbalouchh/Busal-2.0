import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.join(root, "public", "branding", "favicon.png");
const publicDir = path.join(root, "public");

const icoSizes = [16, 32, 48];
const appleTouchSize = 180;

function encodeIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];

  for (const [index, buffer] of pngBuffers.entries()) {
    entries.push({ index, buffer, offset });
    offset += buffer.length;
  }

  const totalSize = offset;
  const output = Buffer.alloc(totalSize);

  output.writeUInt16LE(0, 0);
  output.writeUInt16LE(1, 2);
  output.writeUInt16LE(count, 4);

  entries.forEach(({ index, buffer, offset: imageOffset }, entryIndex) => {
    const size = icoSizes[index];
    const entryOffset = 6 + entryIndex * 16;

    output.writeUInt8(size === 256 ? 0 : size, entryOffset);
    output.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    output.writeUInt8(0, entryOffset + 2);
    output.writeUInt8(0, entryOffset + 3);
    output.writeUInt16LE(1, entryOffset + 4);
    output.writeUInt16LE(32, entryOffset + 6);
    output.writeUInt32LE(buffer.length, entryOffset + 8);
    output.writeUInt32LE(imageOffset, entryOffset + 12);
  });

  entries.forEach(({ buffer, offset: imageOffset }) => {
    buffer.copy(output, imageOffset);
  });

  return output;
}

async function main() {
  const sourceBuffer = await readFile(source);

  const icoPngBuffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(sourceBuffer).resize(size, size, { fit: "cover" }).png().toBuffer(),
    ),
  );

  await writeFile(path.join(publicDir, "favicon.ico"), encodeIco(icoPngBuffers));

  // Next.js file-based metadata in src/app/favicon.ico conflicts with public/favicon.ico.
  // Keep the canonical ICO in public/ only.

  await sharp(sourceBuffer)
    .resize(appleTouchSize, appleTouchSize, { fit: "cover" })
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1254 1254" role="img" aria-label="Busal">
  <image width="1254" height="1254" xlink:href="/branding/favicon.png"/>
</svg>
`;

  await writeFile(path.join(publicDir, "favicon.svg"), faviconSvg, "utf8");

  console.log("Generated public/favicon.ico, public/apple-touch-icon.png, public/favicon.svg");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
