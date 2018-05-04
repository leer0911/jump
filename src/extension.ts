'use strict';
import {
  commands,
  window,
  ExtensionContext,
  TextEditor,
  TextEditorRevealType,
  Selection
} from 'vscode';

import {
  createCodeArray,
  getLines,
  getPosition,
  JumpPosition,
  createDecorationOptions,
  createDataUriCaches,
  getCodeIndex
} from './utils';

export function activate(context: ExtensionContext) {
  // 跳转正则匹配规则
  const defaultRexgexp = '\\w{2,}';
  // 跳转位置
  let positions: JumpPosition[] = null;
  let firstKeyOfCode: string = null;

  // 是否为jump模式
  let isJumpMode: boolean = false;
  const codeArray = createCodeArray();
  createDataUriCaches(codeArray);
  const decorationType = window.createTextEditorDecorationType({});

  setJumpMode(false);

  const jumpDisposable = commands.registerCommand('extension.jump', () => {
    runJump(new RegExp(defaultRexgexp, 'g'));
  });
  const jumpTypeDisposable = commands.registerCommand('type', args => {
    if (!isJumpMode) {
      commands.executeCommand('default:type', args);
      return;
    }

    const editor = window.activeTextEditor;
    const text: string = args.text;

    if (text.search(/[a-z]/i) === -1) {
      exitJumpMode();
      return;
    }

    if (!firstKeyOfCode) {
      firstKeyOfCode = text;
      return;
    }
    const code = firstKeyOfCode + text;
    const position = positions[getCodeIndex(code.toLowerCase())];

    editor.setDecorations(decorationType, []);

    window.activeTextEditor.selection = new Selection(
      position.line,
      position.character,
      position.line,
      position.character
    );

    const reviewType: TextEditorRevealType = TextEditorRevealType.Default;
    window.activeTextEditor.revealRange(
      window.activeTextEditor.selection,
      reviewType
    );

    setJumpMode(false);
  });

  const exitJumpyModeDisposable = commands.registerCommand(
    'extension.jump-exit',
    () => {
      exitJumpMode();
    }
  );

  context.subscriptions.push(exitJumpyModeDisposable);
  context.subscriptions.push(jumpDisposable);
  context.subscriptions.push(jumpTypeDisposable);

  function setJumpMode(value: boolean) {
    isJumpMode = value;
    commands.executeCommand('setContext', 'jump.isJumpMode', value);
  }

  function runJump(regexp: RegExp) {
    const editor = window.activeTextEditor;
    const linesInfo = getLines(editor);
    const { firstLineNumber, lines } = linesInfo;
    const { length: maxDecorations } = codeArray;
    positions = getPosition(maxDecorations, firstLineNumber, lines, regexp);

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

    setJumpMode(true);
    firstKeyOfCode = null;
  }

  function exitJumpMode() {
    const editor = window.activeTextEditor;
    setJumpMode(false);
    editor.setDecorations(decorationType, []);
  }
}
