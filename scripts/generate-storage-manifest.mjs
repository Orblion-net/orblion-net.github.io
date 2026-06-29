import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const storageDir = path.resolve("public", "storage");
const outputFile = path.resolve("public", "storage-manifest.json");

function toUrlPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function readDirectory(directory, relativePath = "") {
  const entries = await readdir(directory, { withFileTypes: true });

  const items = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .map(async (entry) => {
        const absolutePath = path.join(directory, entry.name);
        const itemPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          return {
            type: "folder",
            name: entry.name,
            path: toUrlPath(itemPath),
            children: await readDirectory(absolutePath, itemPath)
          };
        }

        const info = await stat(absolutePath);

        return {
          type: "file",
          name: entry.name,
          path: toUrlPath(itemPath),
          size: info.size,
          url: `./storage/${toUrlPath(itemPath)}`
        };
      })
  );

  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

const manifest = {
  root: await readDirectory(storageDir)
};

await writeFile(outputFile, `${JSON.stringify(manifest, null, 2)}\n`);
