import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveProjectDir, ensureProjectLayout } from './lib/paths.js';

async function main() {
  const projectDir = resolveProjectDir(process.argv[2]);
  const layout = ensureProjectLayout(projectDir);
  const explicitFile = process.argv[3] ? path.resolve(projectDir, process.argv[3]) : null;
  const xlsxPath = explicitFile || findXlsx(projectDir);

  if (!xlsxPath) {
    const message = 'CR xlsx 파일을 찾지 못했습니다. 프로젝트 폴더에 cr.xlsx 또는 .xlsx 파일을 넣으면 추출됩니다.';
    fs.writeFileSync(path.join(layout.extractedDir, 'cr.txt'), message + '\n', 'utf8');
    fs.writeFileSync(path.join(layout.extractedDir, 'cr.json'), JSON.stringify({ sheets: [], warning: message }, null, 2), 'utf8');
    console.log(message);
    return;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdp-xlsx-'));
  try {
    unzipXlsx(xlsxPath, tempDir);
    const extracted = readWorkbook(tempDir);

    const json = {
      sourceFile: path.basename(xlsxPath),
      extractedAt: new Date().toISOString(),
      sheets: extracted,
    };

    fs.writeFileSync(path.join(layout.extractedDir, 'cr.json'), JSON.stringify(json, null, 2), 'utf8');
    fs.writeFileSync(path.join(layout.extractedDir, 'cr.txt'), renderText(json), 'utf8');
    console.log(`CR extracted: ${path.relative(projectDir, xlsxPath)} -> extracted/cr.txt, extracted/cr.json`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function findXlsx(projectDir) {
  const entries = fs.readdirSync(projectDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && /\.xlsx$/i.test(entry.name) && !entry.name.startsWith('~$'))
    .map((entry) => path.join(projectDir, entry.name));

  const preferred = candidates.find((file) => path.basename(file).toLowerCase() === 'cr.xlsx');
  return preferred || candidates[0] || null;
}

function renderText(json) {
  const lines = [
    '# CR 강의 구성 추출',
    '',
    `Source: ${json.sourceFile}`,
    `Extracted at: ${json.extractedAt}`,
    '',
    '추출 기준: 헤더명 "변경 파트명" + "변경 클립명" 우선 탐지, 실패 시 F열 + K열 사용',
    '',
  ];

  for (const sheet of json.sheets) {
    lines.push(`## Sheet: ${sheet.sheetName}`);
    lines.push(`- 사용 열: 파트명 ${sheet.partColumn}열 / 클립명 ${sheet.clipColumn}열`);
    if (!sheet.parts.length) {
      lines.push('- 추출된 파트/클립 없음');
      lines.push('');
      continue;
    }

    for (const part of sheet.parts) {
      lines.push(`### ${part.partName}`);
      for (const clip of part.clips) {
        lines.push(`- ${clip.clipName}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n').trim() + '\n';
}

function unzipXlsx(xlsxPath, tempDir) {
  const zipPath = path.join(tempDir, 'source.zip');
  fs.copyFileSync(xlsxPath, zipPath);
  const command = `Expand-Archive -LiteralPath '${psQuote(zipPath)}' -DestinationPath '${psQuote(tempDir)}' -Force`;

  const result = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    command,
  ], {
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`Failed to unzip xlsx file.\n${result.stderr || result.stdout}`);
  }
}

function psQuote(value) {
  return String(value).replace(/'/g, "''");
}

function readWorkbook(rootDir) {
  const sharedStrings = readSharedStrings(path.join(rootDir, 'xl', 'sharedStrings.xml'));
  const sheets = readSheetIndex(rootDir);

  return sheets.map((sheet) => {
    const parsedSheet = readSheet(path.join(rootDir, 'xl', sheet.target), sharedStrings);
    return {
      sheetName: sheet.name,
      partColumn: parsedSheet.partColumn,
      clipColumn: parsedSheet.clipColumn,
      rows: parsedSheet.rows,
      parts: groupRowsByPart(parsedSheet.rows),
    };
  });
}

function readSharedStrings(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const xml = fs.readFileSync(filePath, 'utf8');
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map((match) => {
    return [...match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeXml(part[1]))
      .join('');
  });
}

function readSheetIndex(rootDir) {
  const workbookPath = path.join(rootDir, 'xl', 'workbook.xml');
  const relsPath = path.join(rootDir, 'xl', '_rels', 'workbook.xml.rels');
  const workbookXml = fs.readFileSync(workbookPath, 'utf8');
  const relsXml = fs.existsSync(relsPath) ? fs.readFileSync(relsPath, 'utf8') : '';
  const rels = new Map();

  for (const rel of relsXml.matchAll(/<Relationship\b([^>]+)>/g)) {
    const attrs = parseAttrs(rel[1]);
    if (attrs.Id && attrs.Target) {
      rels.set(attrs.Id, attrs.Target.replace(/^\/?xl\//, ''));
    }
  }

  return [...workbookXml.matchAll(/<sheet\b([^>]+)>/g)].map((sheet, index) => {
    const attrs = parseAttrs(sheet[1]);
    const relId = attrs['r:id'];
    return {
      name: attrs.name || `Sheet${index + 1}`,
      target: rels.get(relId) || `worksheets/sheet${index + 1}.xml`,
    };
  });
}

function readSheet(filePath, sharedStrings) {
  if (!fs.existsSync(filePath)) return { partColumn: 'F', clipColumn: 'K', rows: [] };
  const xml = fs.readFileSync(filePath, 'utf8');
  const rawRows = readRawRows(xml, sharedStrings);
  const columns = detectTargetColumns(rawRows);
  const mergedValues = readMergedValues(xml, sharedStrings, columns.partColumn);
  const rows = [];

  for (const rawRow of rawRows) {
    if (rawRow.rowNumber <= columns.headerRowNumber) continue;

    const partName = normalizeText(rawRow.cellsByColumn[columns.partColumn] || mergedValues.get(rawRow.rowNumber) || '');
    const clipName = normalizeText(rawRow.cellsByColumn[columns.clipColumn] || '');

    if (partName || clipName) {
      rows.push({ rowNumber: rawRow.rowNumber, partName, clipName });
    }
  }

  return { ...columns, rows };
}

function readRawRows(xml, sharedStrings) {
  const rows = [];

  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowAttrs = parseAttrs(rowMatch[1]);
    const rowNumber = Number(rowAttrs.r);
    const cellsByColumn = {};

    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = parseAttrs(cellMatch[1]);
      const ref = attrs.r || '';
      const column = ref.replace(/\d+/g, '');
      if (!column) continue;
      cellsByColumn[column] = readCellValue(attrs, cellMatch[2], sharedStrings);
    }

    if (Object.keys(cellsByColumn).length) {
      rows.push({ rowNumber, cellsByColumn });
    }
  }

  return rows;
}

function detectTargetColumns(rawRows) {
  for (const row of rawRows) {
    let partColumn = '';
    let clipColumn = '';

    for (const [column, value] of Object.entries(row.cellsByColumn)) {
      const normalized = normalizeText(value);
      if (/변경\s*파트명/.test(normalized)) partColumn = column;
      if (/변경\s*클립명/.test(normalized)) clipColumn = column;
    }

    if (partColumn && clipColumn) {
      return { partColumn, clipColumn, headerRowNumber: row.rowNumber };
    }
  }

  return { partColumn: 'F', clipColumn: 'K', headerRowNumber: 0 };
}

function groupRowsByPart(rows) {
  const parts = [];
  let currentPart = null;
  let lastPartName = '';

  for (const row of rows) {
    if (row.partName && isMeaningfulPartName(row.partName)) {
      lastPartName = row.partName;
      currentPart = parts.find((part) => part.partName === lastPartName);
      if (!currentPart) {
        currentPart = { partName: lastPartName, clips: [] };
        parts.push(currentPart);
      }
    }

    if (!row.clipName || isHeaderLike(row.clipName)) continue;
    if (!lastPartName) continue;

    const partName = lastPartName;
    if (!currentPart || currentPart.partName !== partName) {
      currentPart = parts.find((part) => part.partName === partName);
      if (!currentPart) {
        currentPart = { partName, clips: [] };
        parts.push(currentPart);
      }
    }

    currentPart.clips.push({
      rowNumber: row.rowNumber,
      clipName: row.clipName,
    });
  }

  return parts.filter((part) => part.clips.length > 0);
}

function readMergedValues(xml, sharedStrings, targetColumn) {
  const values = new Map();
  const mergeRefs = [...xml.matchAll(/<mergeCell\b[^>]*ref="([^"]+)"/g)].map((match) => match[1]);

  for (const ref of mergeRefs) {
    const parsed = parseRangeRef(ref);
    if (!parsed || parsed.startColumn !== targetColumn || parsed.endColumn !== targetColumn) continue;

    const cellValue = readCellByRef(xml, `${targetColumn}${parsed.startRow}`, sharedStrings);
    for (let row = parsed.startRow; row <= parsed.endRow; row += 1) {
      values.set(row, cellValue);
    }
  }

  return values;
}

function readCellByRef(xml, cellRef, sharedStrings) {
  const escaped = cellRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<c\\b([^>]*\\br="${escaped}"[^>]*)>([\\s\\S]*?)<\\/c>`));
  if (!match) return '';
  return readCellValue(parseAttrs(match[1]), match[2], sharedStrings);
}

function readCellValue(attrs, body, sharedStrings) {
  const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
  const inlineMatch = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);

  if (attrs.t === 's' && valueMatch) {
    return sharedStrings[Number(valueMatch[1])] || '';
  }
  if (inlineMatch) {
    return decodeXml(inlineMatch[1]);
  }
  if (valueMatch) {
    return decodeXml(valueMatch[1]);
  }
  return '';
}

function parseRangeRef(ref) {
  const match = ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    startColumn: match[1],
    startRow: Number(match[2]),
    endColumn: match[3],
    endRow: Number(match[4]),
  };
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function isHeaderLike(value) {
  return /변경\s*(파트|클립)명|파트명|클립명/i.test(value);
}

function isMeaningfulPartName(value) {
  const normalized = normalizeText(value);
  return Boolean(normalized) && !isHeaderLike(normalized) && !/^\d+$/.test(normalized);
}

function parseAttrs(source) {
  const attrs = {};
  for (const attr of source.matchAll(/([\w:]+)="([^"]*)"/g)) {
    attrs[attr[1]] = decodeXml(attr[2]);
  }
  return attrs;
}

function decodeXml(value) {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
