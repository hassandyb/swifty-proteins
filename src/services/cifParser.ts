import { Atom, Bond, Molecule } from '../types/protein.types';
import { CIF_FIELDS } from '../constants/api';
import { isValidLigandId } from '../utils/moleculeHelpers';

// ── Custom error class ──────────
export class CifParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CifParseError';
  }
}

// ── Tokenizer ────
const tokenizeLine = (line: string): string[] => {
  const tokens: string[] = [];
  let i = 0;

  while (i < line.length) {
    // Skip whitespace between tokens
    while (i < line.length && /\s/.test(line[i])) i++;
    if (i >= line.length) break;

    if (line[i] === '"') {
      // Double-quoted string — read until closing double quote
      i++;
      const start = i;
      while (i < line.length && line[i] !== '"') i++;
      tokens.push(line.slice(start, i));
      i++;
    } else {
      // Bare token — read until next whitespace
      const start = i;
      while (i < line.length && !/\s/.test(line[i])) i++;
      tokens.push(line.slice(start, i));
    }
  }

  return tokens;
};

// ── Loop block parser ────────

interface ParsedLoop {
  headers: string[];
  rows: Record<string, string>[];
}

const parseLoop = (
  lines: string[],
  startIndex: number
): { result: ParsedLoop; nextIndex: number } => {
  const headers: string[] = [];
  let i = startIndex;

  // Collect all header lines (start with _)
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('_')) {
      // Normalize to lowercase for consistent key lookup
      headers.push(trimmed.toLowerCase());
      i++;
    } else {
      break;
    }
  }

  //console.log(`[CIF] Loop headers (${headers.length}):`, headers);

  const rows: Record<string, string>[] = [];
  const tokenBuffer: string[] = [];

  // Collect all data tokens from this block
  while (i < lines.length) {
    const line = lines[i].trim();

    // Stop conditions: new loop block, new data block, end-of-block marker
    if (line === 'loop_' || line.startsWith('data_') || line === '#') {
      break;
    }

    // Skip standalone comment lines
    if (line.startsWith('#')) {
      i++;
      continue;
    }

    // Handle multi-line semicolon-delimited values
    // These start with ; on their own line
    if (line.startsWith(';')) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(';')) i++;
      i++; // skip closing semicolon line
      tokenBuffer.push('.'); // placeholder — we don't need multi-line text values
      continue;
    }

    // Tokenize normal data lines and add to buffer
    const lineTokens = tokenizeLine(line);
    tokenBuffer.push(...lineTokens);
    i++;
  }

  //console.log(`[CIF] Token buffer size for this loop: ${tokenBuffer.length}`);

  // Group the flat token buffer into row objects using header count
  const headerCount = headers.length;
  if (headerCount > 0) {
    for (let j = 0; j + headerCount <= tokenBuffer.length; j += headerCount) {
      const row: Record<string, string> = {};
      for (let k = 0; k < headerCount; k++) {
        row[headers[k]] = tokenBuffer[j + k];
      }
      rows.push(row);
    }
  }

  //console.log(`[CIF] Parsed ${rows.length} rows from this loop`);
  if (rows.length > 0) {
    console.log('[CIF] First row sample:', rows[0]);
  }

  return { result: { headers, rows }, nextIndex: i };
};

const parseBondOrder = (value: string): number => {
  switch (value?.toUpperCase()) {
    case 'SING': return 1;
    case 'DOUB': return 2;
    case 'TRIP': return 3;
    case 'AROM': return 1.5;
    default: return 1;
  }
};


export const parseCif = (rawText: string, ligandId: string): Molecule => {
  if (!rawText || rawText.trim().length === 0) {
    throw new CifParseError('CIF file is empty.');
  }

  //console.log(`[CIF] Parsing ${ligandId}, raw text length: ${rawText.length}`);
  console.log('[CIF] First 300 chars:', rawText.slice(0, 300));

  // Split into lines and trim trailing whitespace
  const lines = rawText.split('\n').map((l) => l.trimEnd());
  //console.log(`[CIF] Total lines: ${lines.length}`);

  let atoms: Atom[] = [];
  let bonds: Bond[] = [];
  let loopCount = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === 'loop_') {
      loopCount++;
      i++; // advance past loop_ to first header

      // Peek at the first header to identify the loop type
      const firstHeader = lines[i]?.trim().toLowerCase() ?? '';
      //console.log(`[CIF] Loop #${loopCount} — first header: "${firstHeader}"`);

      if (firstHeader.startsWith('_chem_comp_atom.')) {
        // This loop contains atom coordinate data
        console.log('[CIF] → Identified as ATOM loop');
        const { result, nextIndex } = parseLoop(lines, i);
        i = nextIndex;

        const xField = CIF_FIELDS.ATOM.X;
        const yField = CIF_FIELDS.ATOM.Y;
        const zField = CIF_FIELDS.ATOM.Z;
        const symbolField = CIF_FIELDS.ATOM.TYPE_SYMBOL;
        const atomIdField = CIF_FIELDS.ATOM.ATOM_ID;

        //console.log(`[CIF] Looking for fields: x="${xField}" y="${yField}" z="${zField}"`);
        console.log('[CIF] Available headers:', result.headers);

        // Check if expected fields exist in parsed headers
        const hasX = result.headers.includes(xField);
        const hasY = result.headers.includes(yField);
        const hasZ = result.headers.includes(zField);
        const hasSymbol = result.headers.includes(symbolField);
        const hasAtomId = result.headers.includes(atomIdField);

        //console.log(`[CIF] Field presence: x=${hasX} y=${hasY} z=${hasZ} symbol=${hasSymbol} atomId=${hasAtomId}`);

        if (!hasX || !hasY || !hasZ) {
          console.warn('[CIF] Missing coordinate fields — trying ideal coordinates');
        }

        atoms = result.rows
          .map((row) => {
            let x = parseFloat(row[xField]);
            let y = parseFloat(row[yField]);
            let z = parseFloat(row[zField]);

            if (isNaN(x) || isNaN(y) || isNaN(z)) {
              x = parseFloat(row[CIF_FIELDS.ATOM.IDEAL_X]);
              y = parseFloat(row[CIF_FIELDS.ATOM.IDEAL_Y]);
              z = parseFloat(row[CIF_FIELDS.ATOM.IDEAL_Z]);
            }

            if (isNaN(x) || isNaN(y) || isNaN(z)) {
              console.warn(`[CIF] Skipping atom with invalid coords:`, row);
              return null;
            }

            return {
              id: row[atomIdField] ?? '',
              element: (row[symbolField] ?? 'C').toUpperCase(),
              x,
              y,
              z,
              name: row[atomIdField] ?? '',
            } satisfies Atom;
          })
          .filter((a): a is Atom => a !== null);

        //console.log(`[CIF] Successfully parsed ${atoms.length} atoms`);

      } else if (firstHeader.startsWith('_chem_comp_bond.')) {
        // This loop contains bond connectivity data
        console.log('[CIF] → Identified as BOND loop');
        const { result, nextIndex } = parseLoop(lines, i);
        i = nextIndex;

        const atom1Field = CIF_FIELDS.BOND.ATOM_ID_1;
        const atom2Field = CIF_FIELDS.BOND.ATOM_ID_2;
        const orderField = CIF_FIELDS.BOND.VALUE_ORDER;

        bonds = result.rows
          .filter((row) => row[atom1Field] && row[atom2Field])
          .map((row) => ({
            atomId1: row[atom1Field],
            atomId2: row[atom2Field],
            order: parseBondOrder(row[orderField]),
          }));

        //console.log(`[CIF] Successfully parsed ${bonds.length} bonds`);

      } else {
        // Unrecognized loop type — skip it entirely
        //console.log(`[CIF] → Unknown loop type, skipping`);
        while (
          i < lines.length &&
          lines[i].trim() !== 'loop_' &&
          !lines[i].trim().startsWith('data_')
        ) {
          i++;
        }
      }
    } else {
      i++;
    }
  }

  //console.log(`[CIF] Parse complete: ${atoms.length} atoms, ${bonds.length} bonds`);

  // Fail clearly if no atoms were found
  if (atoms.length === 0) {
    console.error('[CIF] PARSE FAILED — no atoms extracted');
    console.error('[CIF] Total loops found:', loopCount);
    throw new CifParseError(
      'Failed to parse ligand data. No atoms found in the file.'
    );
  }

  return {
    id: ligandId.toUpperCase(),
    name: ligandId.toUpperCase(),
    atoms,
    bonds,
  };
};