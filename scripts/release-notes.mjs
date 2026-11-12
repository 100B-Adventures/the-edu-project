const parseScalar = (raw) => {
  const value = raw.trim();

  if (value === 'true') return true;
  if (value === 'false') return false;

  if (value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value);
  }

  return value;
};

export const parsePublicReleaseNotes = (source) => {
  const lines = source.split(/\r?\n/);
  const notes = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]?.trim() !== 'public_note:') continue;

    const note = { body: [] };

    for (index += 1; index < lines.length; index += 1) {
      const line = lines[index] ?? '';

      if (!line.startsWith('  ')) {
        index -= 1;
        break;
      }

      const bodyMatch = line.match(/^\s{4}-\s+(.+)$/);
      if (bodyMatch) {
        note.body.push(parseScalar(bodyMatch[1]));
        continue;
      }

      const fieldMatch = line.match(/^\s{2}([a-z_]+):\s*(.*)$/);
      if (!fieldMatch || fieldMatch[1] === 'body') continue;

      note[fieldMatch[1]] = parseScalar(fieldMatch[2]);
    }

    const required = [
      'version',
      'date',
      'title',
      'notify',
      'try_href',
    ];
    const missing = required.filter((field) => note[field] === undefined);

    if (missing.length > 0 || note.body.length === 0) {
      throw new Error(
        `RELEASE.md public_note 필드가 부족합니다: ${[
          ...missing,
          ...(note.body.length === 0 ? ['body'] : []),
        ].join(', ')}`
      );
    }

    notes.push(note);
  }

  if (notes.length === 0) {
    throw new Error('RELEASE.md 에 public_note 블록이 없습니다.');
  }

  const versions = new Set(notes.map((note) => note.version));
  if (versions.size !== notes.length) {
    throw new Error('RELEASE.md public_note 버전이 중복됐습니다.');
  }

  return notes;
};
