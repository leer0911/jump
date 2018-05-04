# jump 源码解析

jump 主要用于光标定位跳转，步骤如下：

* 匹配需要跳转的位置，提供跳转位置标识符
* 跳转逻辑实现

## 跳转位置标识符生成

1、生成由字母 `a-z` 组合的标识符

```typescript
const numCharCodes = 26;
const codeArray = createCodeArray();
function createCodeArray(): string[] {
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
```

2、转为可用于在编辑器上展示的 svg 图标，分别有黑白两个主题样式。

```typescript
let darkDataUriCache: { [index: string]: vscode.Uri } = {};
let lightDataUriCache: { [index: string]: vscode.Uri } = {};

createDataUriCaches(codeArray);

function createDataUriCaches(codeArray: string[]) {
  codeArray.forEach(
    code => (darkDataUriCache[code] = getSvgDataUri(code, 'white', 'black'))
  );
  codeArray.forEach(
    code => (lightDataUriCache[code] = getSvgDataUri(code, 'black', 'white'))
  );
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
```

## 编辑器修饰实现

在之前的基础上，已经有对应的 svg URI 数组了。接下来实现如何把这些标识符显示在编辑器上。

首先在 vscode 中，打开的编辑器称为 `window.activeTextEditor`，该实例有个用于修改编辑器修饰的方法 `setDecorations`。

```typescript
const editor = window.activeTextEditor;
const decorationType = window.createTextEditorDecorationType({});
const decorations = [
  {
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
  }
];
editor.setDecorations(decorationType, decorations);
```

vscode 文档中这么 描述 `[setDecorations](https://code.visualstudio.com/docs/extensionAPI/vscode-api#_commands)`

> Adds a set of decorations to the text editor. If a set of decorations already exists with the given decoration type, they will be replaced.

第二个参数比较重要的 选项 [range](https://code.visualstudio.com/docs/extensionAPI/vscode-api#Range)

> A range represents an ordered pair of two positions. It is guaranteed that start.isBeforeOrEqual(end)

> Range objects are immutable. Use the with, intersection, or union methods to derive new ranges from an existing range.

表示在哪个区域添加什么修饰。这里的作用是在找出匹配后的位置，在`contentIconPath`添加带有字符组合 svg 图标。这里会用到两个方法 `getLines` 和 `getPosition` 分别获取`new vscode.Range(line, startCharacter, line, endCharacter)`中对应的参数值。

```typescript
function getPosition(
  maxDecorations: number,
  firstLineNumber: number,
  lines: string[],
  regexp: RegExp
): JumpPosition[] {
  let positionIndex = 0;
  const positions: JumpPosition[] = [];

  //   获取匹配后的字符所在 的位置，包含 行和字符所在位置。
  //   可以想象成 距离编辑器左上角 x ，y 坐标
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

// 由于编辑存在滚动条，这里获取的行主要用于表示从 哪个行开始展示 修饰标识符
function getLines(
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
```

至此 字符匹配后生产对应的标识符 已实现。

## 跳转逻辑实现

交互流程：标识符出现后，键入对应的字符组合后光标跳转到对应位置。

需要做两件事。

1、启动 jump 模式，拦截编辑器 type 输入
2、键入对应字母组合后跳转至对应位置

```typescript
let isJumpMode: boolean = false;
let firstKeyOfCode: string = null;

// 模式设置方法
function setJumpMode(value: boolean) {
  isJumpMode = value;
  commands.executeCommand('setContext', 'jump.isJumpMode', value);
}

// 在执行jump命令后，开启jump模式
setJumpMode(true);

// 注册 type 命令来修改 type 后的逻辑，type的意思是在编辑器中输入字符
const jumpTypeDisposable = commands.registerCommand('type', args => {
  if (!isJumpMode) {
    // 如果不是 jump 模式，恢复 type 默认模式
    commands.executeCommand('default:type', args);
    return;
  }

  const editor = window.activeTextEditor;
  const text: string = args.text;

  // 如果键入的字符 不是 之前 字母组合中的 则退出 jump 模式。
  if (text.search(/[a-z]/i) === -1) {
    exitJumpMode();
    return;
  }

  // 由于 标识符 都是 两个字母，所以需要记录第一个字母
  if (!firstKeyOfCode) {
    firstKeyOfCode = text;
    return;
  }

  const code = firstKeyOfCode + text;
  const position = positions[getCodeIndex(code.toLowerCase())];
  const { line, character } = position;

  // 清空编辑器上的 字母组合标识符
  editor.setDecorations(decorationType, []);

  // 通过 selection 来实现光标的移动。
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
```

至此一个简单的光标快速跳转插件的核心代码已经讲解完毕。
