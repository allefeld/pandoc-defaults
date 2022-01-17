import * as vscode from 'vscode';
import * as cp from 'child_process';


// name of the extension
const extName = 'pandoc-defaults';

// display name of the extension
const extDisplayName = 'Pandoc/Defaults';

// name of external executable `pd`
const pdExecutable = 'pd';

// icon for status bar
const icon = 'whitespace';


// --- control Terminal -------------------------------------------------------

// used to write to terminal
const writeEmitter = new vscode.EventEmitter<string>();

// `Terminal` instance
var terminal: vscode.Terminal;

function terminalCreate(): void {
	console.log(`${extDisplayName}: TerminalRunner.terminalCreate`);

	terminal = vscode.window.createTerminal({
		name: extDisplayName,
		iconPath: new vscode.ThemeIcon(icon),
		pty: {
			// implement PseudoTerminal

			// used by terminal to listen to write events
			onDidWrite: writeEmitter.event,

			// called when the terminal is ready to be written to
			open(): void {
				console.log(`${extDisplayName}: TerminalRunner.open`);
			},

			// called when the terminal is closed
			close(): void {
				// terminate running process?
				// make new terminal, because we need it always open
				console.log(`${extDisplayName}: TerminalRunner.close`);
				terminalDispose();
				terminalCreate();
			},

			// called when the user types into the terminal
			handleInput(data : any) {
			}		
		}
	});
}

function terminalWrite(str: string): void {
	writeEmitter.fire(str.replaceAll('\n', '\r\n'));
}

function terminalClear(): void {
	writeEmitter.fire('\x1b[2J');
}

function terminalShow() {
	terminal.show();
}

function terminalDispose() {
	terminal.dispose();
}


// --- control StatusBarItem --------------------------------------------------

// `StatusBarItem` instance
var status: vscode.StatusBarItem;

// background colors
const warningBg = new vscode.ThemeColor('statusBarItem.warningBackground');
const errorBg = new vscode.ThemeColor('statusBarItem.errorBackground');

function statusCreate(): void {
	console.log(`${extDisplayName}: TerminalRunner.statusCreate`);

	status = vscode.window.createStatusBarItem();
	status.tooltip = extDisplayName;
	status.command = 'pandocDefaults.showTerminal';
	status.show();

	statusClear();
}

function statusClear(): void {
	status.text = `$(${icon})`;
	status.backgroundColor = undefined;
}

function statusBusy(message: string): void {
	status.text = `$(${icon}) ${message} $(loading~spin)`;
	status.backgroundColor = undefined;
}

function statusWarning(message: string): void {
	status.text = `$(${icon}) ${message}`;
	status.backgroundColor = warningBg;
}

function statusError(message: string): void {
	status.text = `$(${icon}) ${message}`;
	status.backgroundColor = errorBg;
}

function statusDispose() {
	status.dispose();
}


// --- run child process ------------------------------------------------------

function childRun(command: string, args: string[] = []): void {
	console.log(`${extDisplayName}: TerminalRunner.run`);

	terminalClear();
	statusBusy('processing');

	const pd = cp.spawn(command, args);
	pd.stdout.on('data', (data) => childHandleData(data));
	pd.stderr.on('data', (data) => childHandleData(data));
	pd.on('close', (code) => childHandleClose(code));
}

function childHandleData(data: Buffer): void {
	terminalWrite(data.toString());
}

function childHandleClose(code: number | null): void {
	terminalWrite(`child process exited with code ${code}\n`);

	switch (code) {
		case 1:
			statusWarning('warnings');
			break;
		case 2:
			statusError('errors');
			break;
		case 3:
			statusError('failed');
			break;
		default:
			statusClear();
	}
}


// --- commands ---------------------------------------------------------------

function process(textEditor: vscode.TextEditor, args: any[]): void {
	console.log(`${extDisplayName}: process`);

	// get document
	const document = textEditor.document;

	// check whether the document is "titled"
	if (document.isUntitled) {
		// show error message, and don't do anything further
		// The user can save the document if they want to, and repeat the command.
		vscode.window.showErrorMessage('Active editor is untitled, please save!');
		return;
	}

	// get filename
	const fileName = document.fileName;

	// check whether the document is dirty; save if necessary
	if (document.isDirty) {
		document.save().then((saved) => {
			if (!saved) {
				vscode.window.showErrorMessage('Cannot save active editor!');
			}
			// run after saving
			childRun(pdExecutable, [fileName].concat(args));
		});
	} else {
		// already saved, run
		childRun(pdExecutable, [fileName].concat(args));
	}
}

function processFirst(textEditor: vscode.TextEditor,
		edit: vscode.TextEditorEdit): void {
	console.log(`${extDisplayName}: processFirst`);

	process(textEditor, ['--first']);
}

function processAll(textEditor: vscode.TextEditor,
		edit: vscode.TextEditorEdit): void {
	console.log(`${extDisplayName}: processAll`);

	process(textEditor, []);
}


// --- extension --------------------------------------------------------------

export function activate(context: vscode.ExtensionContext): void {
	console.log(`${extDisplayName}: activate`);

	// terminal
	terminalCreate();

	// status
	statusCreate();

	// commands
	let disposable;
	disposable = vscode.commands.registerTextEditorCommand(
		'pandocDefaults.processFirst', processFirst);
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerTextEditorCommand(
		'pandocDefaults.processAll', processAll);
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand(
		'pandocDefaults.showTerminal', terminalShow);
	context.subscriptions.push(disposable);

}

export function deactivate() {
	terminalDispose();
	statusDispose();
}


// https://nodejs.org/api/child_process.html
// https://code.visualstudio.com/api/references/vscode-api
