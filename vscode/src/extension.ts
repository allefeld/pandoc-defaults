import * as vscode from 'vscode';

// name of the extension
const extName = 'pandoc-defaults';

// display name of the extension
const extDisplayName = 'Pandoc/Defaults';

// name of external executable `pd`
const pdExecutable = 'pd';

// icon for status bar
const icon = '$(whitespace)';


function process(
		textEditor: vscode.TextEditor,
		args: any[]): void {

	// get document
	const document = textEditor.document;

	// check whether the document is "titled"
	// It's not necessary to make sure the document is saved, because currently
	// VS Code automatically saves all dirty documents before executing a task
	//   <https://github.com/Microsoft/vscode/issues/21342>
	// – if they are "titled".
	if (document.isUntitled) {
		// show error message, and don't do anything further
		// The user can save the document if they want to, and repeat the command.
		vscode.window.showErrorMessage('Active editor is untitled, please save!');
		return;
	}

	// get filename
	const fileName = document.fileName;

	// create task
	const task = new vscode.Task(
		{type: ''},
		vscode.TaskScope.Workspace,
		extDisplayName, 		// name of terminal tab
		extName,
		new vscode.ProcessExecution(pdExecutable, [fileName].concat(args)));
	task.presentationOptions.echo = true;
	task.presentationOptions.echo = false;
	task.presentationOptions.focus = false;
	task.presentationOptions.panel = vscode.TaskPanelKind.Dedicated;
	task.presentationOptions.reveal = vscode.TaskRevealKind.Never;
	task.presentationOptions.showReuseMessage = false;

	// execute task
	vscode.tasks.executeTask(task);
}

function processFirst(
		textEditor: vscode.TextEditor,
		edit: vscode.TextEditorEdit): void {
	console.log(`${extDisplayName}: processFirst`);

	process(textEditor, ['--first']);
}

function processAll(
		textEditor: vscode.TextEditor,
		edit: vscode.TextEditorEdit): void {
	console.log(`${extDisplayName}: processAll`);

	process(textEditor, []);
}


var statusBarItem : vscode.StatusBarItem;
const warningBg = new vscode.ThemeColor('statusBarItem.warningBackground');
const errorBg = new vscode.ThemeColor('statusBarItem.errorBackground');

function setStatus(message? : string, bgColor? : vscode.ThemeColor): void {
	if (message !== undefined) {
		statusBarItem.text = icon + ' ' + message;
	} else {
		statusBarItem.text = icon;
	}
	statusBarItem.backgroundColor = bgColor;
}

function taskStarted(event: vscode.TaskProcessStartEvent): void {
	// our task?
	if (event.execution.task.name !== extDisplayName) { return; }
	console.log(`${extDisplayName}: processStarted`);

	setStatus('processing $(loading~spin)');
}

function taskEnded(event: vscode.TaskProcessEndEvent): void {
	// our task?
	if (event.execution.task.name !== extDisplayName) { return; }
	console.log(`${extDisplayName}: processEnded`);

	switch (event.exitCode) {
		case 1:
			setStatus('warnings', warningBg);
			break;
		case 2:
			setStatus('errors', errorBg);
			break;
		case 3:
			setStatus('failed', errorBg);
			break;
		default:
			setStatus();
		}
}

function showTerminal(): void {
	console.log(`${extDisplayName}: toggleTerminal`);

  // get terminal of the extension's task
	const terminal = vscode.window.terminals.find(
			t => { return t.name === extDisplayName; });
	// show terminal
	if (terminal !== undefined) {
		terminal.show(true);
	} else {
		setStatus('no terminal');
		setTimeout(() => {
			setStatus();
		}, 500);
	}
}


export function activate(context: vscode.ExtensionContext): void {
	console.log(`${extDisplayName}: activate` + icon);

	let disposable;

	disposable = vscode.commands.registerTextEditorCommand(
			'pandocDefaults.processFirst', processFirst);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerTextEditorCommand(
			'pandocDefaults.processAll', processAll);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(
			'pandocDefaults.showTerminal', showTerminal);
	context.subscriptions.push(disposable);

	disposable = vscode.tasks.onDidStartTaskProcess(taskStarted);
	context.subscriptions.push(disposable);

	disposable = vscode.tasks.onDidEndTaskProcess(taskEnded);
	context.subscriptions.push(disposable);

	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left, 49.5);
	// This priority is just high enough to place our item to the left of "Tasks".
	statusBarItem.tooltip = extDisplayName;
	statusBarItem.command = 'pandocDefaults.showTerminal';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);
	setStatus();
}

export function deactivate() {}
