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

const readIfExists = async (filePath) => {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};

export const generateReleaseNotes = async ({
  releaseManifestPath: sourcePath = releaseManifestPath,
  outputPath: destinationPath = outputPath,
  check = false,
  logger = console,
} = {}) => {
  const source = await readIfExists(sourcePath);

  if (source === null) {
    const generated = await readIfExists(destinationPath);

    if (generated === null) {
      throw new Error(
        `RELEASE.md 와 생성된 release-notes.json 이 모두 없습니다: ${sourcePath}, ${destinationPath}`
      );
    }

    logger.warn(
      `[release-notes] RELEASE.md 없음, 커밋된 생성물을 유지합니다: ${destinationPath}`
    );
    return { status: 'preserved', outputPath: destinationPath };
  }

  const notes = parsePublicReleaseNotes(source);
  const nextOutput = `${JSON.stringify(notes, null, 2)}\n`;

  if (check) {
    const currentOutput = await readIfExists(destinationPath);

    if (currentOutput !== nextOutput) {
      throw new Error(
        `RELEASE.md 와 생성된 release-notes.json 이 다릅니다. npm run generate:release-notes 를 실행하세요: ${destinationPath}`
      );
    }

    logger.log(`[release-notes] 생성물 일치 확인: ${destinationPath}`);
    return {
      status: 'checked',
      count: notes.length,
      outputPath: destinationPath,
    };
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, nextOutput, 'utf8');

  logger.log(`[release-notes] ${notes.length}개 생성: ${destinationPath}`);
  return {
    status: 'generated',
    count: notes.length,
    outputPath: destinationPath,
  };
};

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    await generateReleaseNotes({ check: process.argv.includes('--check') });
  } catch (error) {
    console.error(`[release-notes] ${error.message}`);
    process.exitCode = 1;
  }
}
