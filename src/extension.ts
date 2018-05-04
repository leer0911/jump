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
  const defaultRexgexp = '\\w{2,}'; // 跳转正则匹配规则
  let positions: JumpPosition[] = null; // 跳转位置
  let firstKeyOfCode: string = null; // 记录jump下输入的第一个字符
  let isJumpMode: boolean = false; // jump模式
  const codeArray = createCodeArray(); // 生成 [aa,ab,ac....] 的数组
  createDataUriCaches(codeArray); // 创建 jump UI
  const decorationType = window.createTextEditorDecorationType({});

  setJumpMode(false);

  // jump 命令
  const jumpDisposable = commands.registerCommand('extension.jump', () => {
    runJump(new RegExp(defaultRexgexp, 'g'));
  });

  // jump模式下 输入命令
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
    const { line, character } = position;
    editor.setDecorations(decorationType, []);

    window.activeTextEditor.selection = new Selection(
      line,
      character,
      line,
      character
    );

    const reviewType: TextEditorRevealType = TextEditorRevealType.Default;
    window.activeTextEditor.revealRange(
      window.activeTextEditor.selection,
      reviewType
    );

    setJumpMode(false);
  });

  // jump 退出命令
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
