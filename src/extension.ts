'use strict';
import { commands, window, ExtensionContext, TextEditor } from 'vscode';

import {
  createCodeArray,
  getLines,
  getPosition,
  JumpPosition,
  createDecorationOptions,
  createDataUriCaches
} from './utils';

export function activate(context: ExtensionContext) {
  const defaultRexgexp = '\\w{2,}';
  let positions: JumpPosition[] = null;

  const codeArray = createCodeArray();
  createDataUriCaches(codeArray);

  function runJump(regexp: RegExp) {
    const editor = window.activeTextEditor;
    const linesInfo = getLines(editor);
    const { firstLineNumber, lines } = linesInfo;
    const { length: maxDecorations } = codeArray;
    positions = getPosition(maxDecorations, firstLineNumber, lines, regexp);

    const decorationType = window.createTextEditorDecorationType({});
    const decorations = positions
      .map((position, i) => {
        const { line, character: start } = position;
        const end = start + 2;
        const code = codeArray[i];
        return createDecorationOptions(line, start, end, code);
      })
      .filter(x => !!x);

    // 设置跳转 UI
    editor.setDecorations(decorationType, decorations);
  }
  const jumpDisposable = commands.registerCommand('extension.jump', () => {
    runJump(new RegExp(defaultRexgexp, 'g'));
  });

  context.subscriptions.push(jumpDisposable);
}
