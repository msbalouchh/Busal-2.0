import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.join(root, "public", "branding", "favicon.png");
const publicDir = path.join(root, "public");
const appDir = path.join(root, "src", "app");
const brandingDir = path.join(publicDir, "branding");

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

async function writeResizedPng(sourceBuffer, targetPath, size) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await sharp(sourceBuffer)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(targetPath);
}

async function main() {
  const sourceBuffer = await readFile(source);

  const icoPngBuffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(sourceBuffer).resize(size, size, { fit: "cover" }).png().toBuffer(),
    ),
  );

  const ico = encodeIco(icoPngBuffers);

  await writeFile(path.join(publicDir, "favicon.ico"), ico);
  await writeFile(path.join(appDir, "favicon.ico"), ico);

  await writeResizedPng(sourceBuffer, path.join(publicDir, "apple-touch-icon.png"), appleTouchSize);
  await writeResizedPng(sourceBuffer, path.join(appDir, "apple-icon.png"), appleTouchSize);
  await writeResizedPng(sourceBuffer, path.join(appDir, "icon.png"), 512);

  for (const [size, name] of [
    [32, "favicon-32.png"],
    [48, "favicon-48.png"],
    [192, "favicon-192.png"],
    [512, "favicon-512.png"],
  ]) {
    await writeResizedPng(sourceBuffer, path.join(brandingDir, name), size);
  }

  console.log(
    "Generated Busal favicons: public/favicon.ico, src/app/{favicon.ico,icon.png,apple-icon.png}, branding/favicon-{32,48,192,512}.png",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
