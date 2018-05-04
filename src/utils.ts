import * as vscode from 'vscode';

const plusMinusLines = 10000;
const numCharCodes = 26;

export interface JumpPosition {
  line: number;
  character: number;
}

export function createCodeArray(): string[] {
  const codeArray = new Array(numCharCodes * numCharCodes);
  let codeIndex = 0;
  for (let i = 0; i < numCharCodes; i++) {
    for (let j = 0; j < numCharCodes; j++) {
      codeArray[codeIndex++] =
        String.fromCharCode(97 + i) + String.fromCharCode(97 + j);
    }
  }

  return codeArray;
}

let darkDataUriCache: { [index: string]: vscode.Uri } = {};
let lightDataUriCache: { [index: string]: vscode.Uri } = {};

export function createDataUriCaches(codeArray: string[]) {
  codeArray.forEach(
    code => (darkDataUriCache[code] = getSvgDataUri(code, 'white', 'black'))
  );
  codeArray.forEach(
    code => (lightDataUriCache[code] = getSvgDataUri(code, 'black', 'white'))
  );
}

export function getCodeIndex(code: string): number {
  return (code.charCodeAt(0) - 97) * numCharCodes + code.charCodeAt(1) - 97;
}

export function getLines(
  editor: vscode.TextEditor
): { firstLineNumber: number; lines: string[] } {
  const document = editor.document;
  const activePosition = editor.selection.active;

  const startLine =
    activePosition.line < plusMinusLines
      ? 0
      : activePosition.line - plusMinusLines;
  const endLine =
    document.lineCount - activePosition.line < plusMinusLines
      ? document.lineCount
      : activePosition.line + plusMinusLines;

  const lines: string[] = [];
  for (let i = startLine; i < endLine; i++) {
    lines.push(document.lineAt(i).text);
  }

  return {
    firstLineNumber: startLine,
    lines
  };
}

export function getPosition(
  maxDecorations: number,
  firstLineNumber: number,
  lines: string[],
  regexp: RegExp
): JumpPosition[] {
  let positionIndex = 0;
  const positions: JumpPosition[] = [];
  for (let i = 0; i < lines.length && positionIndex < maxDecorations; i++) {
    let lineText = lines[i];
    let word: RegExpExecArray;
    while (!!(word = regexp.exec(lineText)) && positionIndex < maxDecorations) {
      positions.push({
        line: i + firstLineNumber,
        character: word.index
      });
    }
  }
  return positions;
}

export function createDecorationOptions(
  line: number,
  startCharacter: number,
  endCharacter: number,
  code: string
): vscode.DecorationOptions {
  return {
    range: new vscode.Range(line, startCharacter, line, endCharacter),
    renderOptions: {
      dark: {
        before: {
          contentIconPath: darkDataUriCache[code]
        }
      },
      light: {
        before: {
          contentIconPath: lightDataUriCache[code]
        }
      }
    }
  };
}

function getSvgDataUri(
  code: string,
  backgroundColor: string,
  fontColor: string
) {
  const width = code.length * 7;
  return vscode.Uri.parse(
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 13" height="13" width="${width}"><rect width="${width}" height="13" rx="2" ry="2" style="fill: ${backgroundColor};"></rect><text font-family="Consolas" font-size="11px" fill="${fontColor}" x="1" y="10">${code}</text></svg>`
  );
}
