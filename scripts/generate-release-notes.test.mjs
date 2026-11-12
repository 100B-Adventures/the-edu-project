import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateReleaseNotes } from './generate-release-notes.mjs';

const releaseManifest = `## 운영 v2.0.22

\`\`\`yaml
public_note:
  version: "v2.0.22"
  date: "2026-11-12"
  title: "업데이트 소식"
  body:
    - "새 기능을 확인할 수 있어요."
  notify: true
  try_href: "/updates"
\`\`\`
`;

describe('릴리스 노트 생성 스크립트 계약', () => {
  let temporaryDirectory;
  let releaseManifestPath;
  let outputPath;
  let logger;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), 'release-notes-test-')
    );
    releaseManifestPath = path.join(temporaryDirectory, 'RELEASE.md');
    outputPath = path.join(temporaryDirectory, 'release-notes.json');
    logger = { log: vi.fn(), warn: vi.fn() };
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('REL-GEN-001 정상: RELEASE.md가 있으면 JSON을 다시 생성한다', async () => {
    await writeFile(releaseManifestPath, releaseManifest, 'utf8');

    const result = await generateReleaseNotes({
      releaseManifestPath,
      outputPath,
      logger,
    });

    expect(result).toMatchObject({ status: 'generated', count: 1 });
    expect(JSON.parse(await readFile(outputPath, 'utf8'))).toEqual([
      expect.objectContaining({ version: 'v2.0.22', notify: true }),
    ]);
  });

  it('REL-GEN-002 정상: RELEASE.md가 없으면 커밋된 JSON을 그대로 둔다', async () => {
    const committedOutput = '[{"version":"v2.0.22"}]\n';
    await writeFile(outputPath, committedOutput, 'utf8');

    const result = await generateReleaseNotes({
      releaseManifestPath,
      outputPath,
      logger,
    });

    expect(result.status).toBe('preserved');
    expect(await readFile(outputPath, 'utf8')).toBe(committedOutput);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('REL-GEN-003 거절: RELEASE.md와 커밋된 JSON이 모두 없으면 실패한다', async () => {
    await expect(
      generateReleaseNotes({ releaseManifestPath, outputPath, logger })
    ).rejects.toThrow('모두 없습니다');
  });

  it('REL-GEN-004 거절: --check에서 원본과 생성물이 다르면 실패한다', async () => {
    await writeFile(releaseManifestPath, releaseManifest, 'utf8');
    await writeFile(outputPath, '[]\n', 'utf8');

    await expect(
      generateReleaseNotes({
        releaseManifestPath,
        outputPath,
        check: true,
        logger,
      })
    ).rejects.toThrow('release-notes.json 이 다릅니다');
    expect(await readFile(outputPath, 'utf8')).toBe('[]\n');
  });
});
