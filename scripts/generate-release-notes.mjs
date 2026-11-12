import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parsePublicReleaseNotes } from './release-notes.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const releaseManifestPath = path.resolve(scriptDirectory, '../../RELEASE.md');
const outputPath = path.resolve(
  scriptDirectory,
  '../src/generated/release-notes.json'
);

const source = await readFile(releaseManifestPath, 'utf8');
const notes = parsePublicReleaseNotes(source);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(notes, null, 2)}\n`, 'utf8');

console.log(`[release-notes] ${notes.length}개 생성: ${outputPath}`);
