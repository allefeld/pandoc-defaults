import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { kill } from 'process';


// display name of the extension
const extDisplayName = 'Pandoc/Defaults';

// icon for status bar
const icon = 'whitespace';


// --- control Terminal -------------------------------------------------------

// used to write to terminal
const writeEmitter = new vscode.EventEmitter<string>();

// `Terminal` instance
var terminal: vscode.Terminal;

function terminalCreate(): void {

	terminal = vscode.window.createTerminal({
		name: extDisplayName,
		iconPath: new vscode.ThemeIcon(icon),
		pty: {
			// implement PseudoTerminal

			// used by terminal to listen to write events
			onDidWrite: writeEmitter.event,

			// called when the terminal is ready to be written to
			open(): void {
			},

			// called when the terminal is closed
			close(): void {
				terminalDispose();
				// terminate process if running
				pdKill();
				// make new terminal, because we need it always open in case of output
				terminalCreate();
				// to be closed, the terminal must have been visible; keep it that way
				terminalShow();
			},

			// called when the user types into the terminal
			handleInput(data : any) {
				terminal.hide();
			}		
		}
	});
}

function terminalWrite(str: string): void {
	writeEmitter.fire(str.replaceAll('\n', '\r\n'));
}

function terminalClear(): void {
	writeEmitter.fire('\x1b[H\x1b[2J\x1b[3J');
}

function terminalShow() {
	terminal.show(false);
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
	status = vscode.window.createStatusBarItem();
	status.tooltip = extDisplayName;
	status.command = extDisplayName + '.showTerminal';
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


// --- process by running pd executable ---------------------------------------

var pd: child_process.ChildProcess;

var processing: boolean = false;

function pdRun(args: string[] = []): void {
	// get configured killing policy
	const killPreviousProcess = vscode.workspace.getConfiguration(extDisplayName)
		.get<string>('killPreviousProcess');
	// ensure there is no other processing happening
	if (processing && !killPreviousProcess) {
		// abort this call
		return;
	}
	pdKill();
	// get configured executable name
	const executable = vscode.workspace.getConfiguration(extDisplayName)
		.get<string>('executable');
	if (executable === undefined) {
		// this should never happen!
		console.log(`${extDisplayName}: configuration 'executable' is undefined`);
		return;
	}
	// run executable
	terminalClear();
	statusClear();
	processing = true;
	pd = child_process.spawn(executable, args);
	if (pd.stdout !== null) {
		pd.stdout.on('data', (data) => pdHandleData(data));
	}
	if (pd.stderr !== null) {
		pd.stderr.on('data', (data) => pdHandleData(data));
	}
	pd.on('exit', (code, signal) => pdHandleExit(code, signal));
	pd.on('error', (err) => pdHandleError(err));
}

function pdKill(): void {
	if (processing) {
		pd.kill();
	}
}

function pdHandleData(data: Buffer): void {
	terminalWrite(data.toString());
	statusBusy('processing');
}

function pdHandleExit(code: number | null, signal: string | null): void {
	processing = false;
	if (code !== null) {
		terminalWrite(`\nexited with code ${code}\n`);
		switch (code) {
			case 0:
				statusClear();
				break;
			case 1:
				statusWarning('warnings');
				break;
			case 2:
				statusError('errors');
				terminalShow();
				break;
			case 3:
				statusError('failed');
				terminalShow();
				break;
			default:	// shouldn't happen
				statusError('?');
		}
	}
	if (signal !== null) {
		terminalWrite(`\nterminated by signal ${signal}\n`);
		// Termination by signal has most likely been caused by the user, and
		// therefore does not necessarily need their attention.
		statusWarning('terminated');
	}
}

function pdHandleError(err: Error) {
	processing = false;
	terminalWrite(`failed running executable "${pd.spawnfile}":\n`);
	terminalWrite(`"` + pd.spawnargs.join('", "') + '"\n');
	statusError('failed');
	console.log(err);
}


// --- re- / processing -------------------------------------------------------

// set of processed documents
var processed : WeakSet<vscode.TextDocument>;

function createProcessed(): void {
	processed = new WeakSet<vscode.TextDocument>();
}

function process(document: vscode.TextDocument, args: any[]): void {
	// check whether the document is "titled"
	if (document.isUntitled) {
		// show error message, and don't do anything further
		// The user can save the document if they want to, and repeat the command.
		vscode.window.showErrorMessage('Active editor is untitled, please save!');
		return;
	}
	// get filename
	const fileName = document.fileName;
	// check whether the document is dirty
	if (document.isDirty) {
		// avoid triggering another processing on save
		processed.delete(document);
		// save if necessary
		document.save().then((saved) => {
			if (!saved) {
				vscode.window.showErrorMessage('Cannot save active editor!');
			}
			// run after saving
			pdRun([fileName].concat(args));
			// put document on watchlist
			processed.add(document);
		});
	} else {
		// already saved, run
		pdRun([fileName].concat(args));
		// put document on watchlist
		processed.add(document);
	}
}

function reprocessSaved(document: vscode.TextDocument): void {
	// get configured reprocessing policy
	const reprocessOnSave = vscode.workspace.getConfiguration(extDisplayName)
		.get<boolean>('reprocessOnSave');
	// is reprocessing on?
	if (!reprocessOnSave) {
		// if not, remove all documents from list
		createProcessed();
		return;
	}
	// document was saved – from the active editor?
	if ((vscode.window.activeTextEditor === undefined)
			|| (vscode.window.activeTextEditor.document !== document)) {
		// if not, do nothing
		return;
	}
	// has the document been processed before?
	if (!processed.has(document)) {
		// if not, do nothing
		return;
	}
	// process the document again
	vscode.commands.executeCommand(extDisplayName + '.processFirst');
}


// --- commands ---------------------------------------------------------------

function processFirst(document: vscode.TextDocument): void {
	process(document, ['--first']);
}

function processAll(document: vscode.TextDocument): void {
	process(document, []);
}

function clean(document: vscode.TextDocument): void {
	process(document, ['--clean']);
}


// --- de- / activation -------------------------------------------------------

export function activate(context: vscode.ExtensionContext): void {
	console.log(`${extDisplayName}: activate`);

	// prepare terminal
	terminalCreate();

	// prepare status bar item
	statusCreate();

	// commands
	let disposable;
	disposable = vscode.commands.registerTextEditorCommand(
		extDisplayName + '.processFirst',
		(editor, edit) => processFirst(editor.document));
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerTextEditorCommand(
		extDisplayName + '.processAll',
		(editor, edit) => processAll(editor.document));
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerTextEditorCommand(
		extDisplayName + '.clean',
		(editor, edit) => clean(editor.document));
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand(
		extDisplayName + '.showTerminal', terminalShow);
	context.subscriptions.push(disposable);

	// prepare reprocessing on save of already processed documents
	createProcessed();
	disposable = vscode.workspace.onDidSaveTextDocument(reprocessSaved);
	context.subscriptions.push(disposable);
}

export function deactivate() {
	terminalDispose();
	statusDispose();
}
