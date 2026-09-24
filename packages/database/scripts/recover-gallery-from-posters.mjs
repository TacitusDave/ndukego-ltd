/**
 * One-off recovery: the Poster→GalleryItem rename recreated the table via
 * `prisma db push` (Prisma does not rename tables), dropping the old poster
 * rows. The uploaded blobs still live in upload_files, so rebuild gallery_items
 * rows from those blobs. Old /uploads/posters/... URLs keep working.
 *
 * Run: node packages/database/scripts/recover-gallery-from-posters.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MIME_BY_EXT = {
  ".jpg": "IMAGE",
  ".jpeg": "IMAGE",
  ".png": "IMAGE",
  ".webp": "IMAGE",
  ".mp4": "VIDEO",
  ".webm": "VIDEO",
  ".mov": "VIDEO",
};

// Original poster rows (captured from GET /posters/public before the rename).
const KNOWN_TITLES = {
  "6e458460-6943-4f83-93b3-631c4f108b53.jpg": "LPO Financing Material - 01",
};

async function main() {
  const blobs = await prisma.uploadFile.findMany({
    where: { path: { startsWith: "posters/" } },
    orderBy: { path: "asc" },
  });

  console.log(`Found ${blobs.length} poster blob(s) in upload_files`);

  const existing = await prisma.galleryItem.findMany({
    select: { imageUrl: true },
  });
  const existingUrls = new Set(existing.map((r) => r.imageUrl));

  let restored = 0;
  let order = 0;

  for (const blob of blobs) {
    const url = `/uploads/${blob.path}`;
    if (existingUrls.has(url)) {
      console.log(`skip (already restored): ${url}`);
      continue;
    }

    const ext = blob.path.slice(blob.path.lastIndexOf(".")).toLowerCase();
    const type = MIME_BY_EXT[ext] ?? "IMAGE";      await prisma.galleryItem.create({
        data: {
          title: KNOWN_TITLES[blob.path.slice("posters/".length)] ?? null,
          imageUrl: url,
          type,
          mediaUrl: type === "VIDEO" ? url : null,
          collageImages: [], // required array — no schema default
          sortOrder: order++,
          isActive: true,
        },
      });
    restored++;
    console.log(`restored: ${url} as ${type}`);
  }

  console.log(`Done — ${restored} item(s) restored.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
