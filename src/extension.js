// https://segmentfault.com/a/1190000008968904
// https://www.cnblogs.com/virde/p/vscode-extension-input-and-output.html
// https://github.com/steveukx/git-js
// https://www.jianshu.com/p/2b096d8ad9b8
// https://github.com/Microsoft/vscode-extension-samples
// https://www.jianshu.com/p/520c575e91c3

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// const {chooicingFolder, chooicingBranch} = require("./MyPlugin");
const myPlugin = require("./MyPlugin");
const simpleGit = require('simple-git')
let mdTml = vscode.window.createTerminal("MyOpen");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('extension.newBranch', function () {
		myPlugin.chooicingFolder().then(selectedItem => {
			// console.log("selectedItem=>"+selectedItem.name+"/"+selectedItem.uri);
			myPlugin.chooicingBranch(simpleGit(selectedItem.uri.path)).then(newBranch => {
				// vscode.window.showInformationMessage(newBranch);
				let cmdStr = `bash ./newBranch.sh ${newBranch}`;
				mdTml.show(false);
				mdTml.sendText(cmdStr);
			});
		});
	});
	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.commands.registerCommand('extension.newRelease', () => {
		// const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		// terminal.sendText("echo 'Sent text immediately after creating'");
		myPlugin.chooicingFolder().then(selectedItem => {
			// console.log("selectedItem=>"+selectedItem.name+"/"+selectedItem.uri);
			myPlugin.chooicingRlease(simpleGit(selectedItem.uri.path)).then(release => {
				let cmdStr = `bash ./release.sh ${release.nextRelase} ${release.currentDate}`;
				mdTml.show(false);
				mdTml.sendText(cmdStr);
			});
		});

	}));
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
