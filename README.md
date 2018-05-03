# Vscode 插件开发

## 安装

```bash
cnpm install -g yo generator-code
yo code
```

## 目录说明

两个比较重要的文件：

* `package.json` 用于描述你的插件及命令。
* `extension.js` 入口文件，用于提供命令代码。这个文件暴露了一个函数 `activate`，当插件激活时执行。通过 `registerCommand` 注册命令。

## 开始

* 按 `F5` 会打开一个新窗口来运行你的插件。
* 在命令面板中执行你的命令。 (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)
* 在 `extension.js` 文件中打断点来调试。
* 在调试控制台中查看调试记录。

## 安装扩展

### 个人扩展文件夹

VS Code 会在个人扩展文件夹中`.vscode/extensions`来寻找扩展组件。不同的平台其文件夹所在的位置也不同：

* **Windows** `%USERPROFILE%\.vscode\extensions`
* **Mac** `~/.vscode/extensions`
* **Linux** `~/.vscode/extensions`

如果你想在 VS Code 每次启动都能够加载你自己的扩展或者定制化信息，那么就需要在`.vscode/extensions`文件夹下新建一个文件夹，并把项目文件放进去。例如：`~/.vscode/extensions/myextension`。

## `package.json` 详解

### Contribution

`package.json` extension manifest 中 `contribution` 选项的所有可用字段。

* `configuration` 选项会被暴露给用户。用户能够在“用户设置”或“工作区设置”面板中设置这些配置选项。
* `commands` 提供了一个由 commands 和 title 字段组成的条目，用于在 **命令面板** 中调用。
* `keybindings`
* `menus`
* `languages` 提供一种语言的定义。这会引入一门新的语言或者提升 VS Code 关于一门语言的认知。
* `debuggers` 为 VS Code 设置一个调试器。 调试器可以具有以下属性。
* `grammars` 设置一种语言的 TextMate 语法。您必须提供此语法适用的 language 字段，语法和文件路径的 TextMate scopeName。
* `themes`
* `snippets` 为某一个具体的语言提供代码片段。
* `jsonValidation` 为特定类型的 json 文件贡献一个验证模式。 url 值可以是包含在扩展中的模式文件的本地路径，也可以是远程服务器 URL（如 json 模式存储）。

### Activation Events

提供 以下 activation events:

* `onLanguage:${language}` 指定 Language 后触发
* `onCommand:${command}` 指定 命令执行后触发
* `workspaceContains:${toplevelfilename}` 指定文件打开后触发
* `*` vscode 启动后触发(慎用)

## 知识点

插件包含了以下组件的支持：

* **激活** - 当检测到指定的文件类型，或者指定的文件存在，或者通过命令面板或者键盘快捷键选中一条命令时加载插件
* **编辑器** - 用来处理编辑器的内容 - 读和控制文本, 使用选择区域
* **工作空间** - 访问打开的文件, 状态栏, 信息提示等
* **事件** - 连接编辑器的生命周期，类似：打开，关闭，修改等等
* **高级编辑器** - 为高级语言提供包括智能感知，预览, 悬停, 诊断以及更多的支持

### API 概览

API 按命名空间组织，全局命名空间如下：

* `commands` 执行/注册命令，IDE 自身的和其它插件注册的命令都可以，如 executeCommand
* `debug` 调试相关 API，比如 startDebugging
* `env` IDE 相关的环境信息，比如 machineId, sessionId
* `extensions` 跨插件 API 调用，extensionDependency 声明插件依赖
* `languages` 编程语言相关 API，如 createDiagnosticCollection, registerDocumentFormattingEditProvider
* `scm` 源码版本控制 API，如 createSourceControl
* `window` 编辑器窗体相关 API，如 onDidChangeTextEditorSelection, createTerminal, showTextDocument
* `workspace` 工作空间级 API（打开了文件夹才有工作空间），如 findFiles, openTextDocument, saveAll
