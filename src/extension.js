// https://segmentfault.com/a/1190000008968904
// https://www.cnblogs.com/virde/p/vscode-extension-input-and-output.html
// https://github.com/steveukx/git-js
// https://www.jianshu.com/p/2b096d8ad9b8
// https://github.com/Microsoft/vscode-extension-samples
// https://www.jianshu.com/p/520c575e91c3
// https://segmentfault.com/a/1190000017279102
// https://segmentfault.com/a/1190000014758981
// https://dev.azure.com/it0815/_usersSettings/tokens
// teh2foynynfdqzxhwe3xqchgkno42yz7h4ergheqhjushrnqtfnq
// https://www.cnblogs.com/liuxianan/p/vscode-plugin-publish.html

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// const {chooicingFolder, chooicingBranch} = require("./MyPlugin");
const myPlugin = require("./MyPlugin");
const simpleGit = require('simple-git')
const axios = require('axios')
const tmp = require('tmp');
var fs = require('fs')
let mdTml = null;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('extension.newBranch', function () {
		newBranch();
	});
	context.subscriptions.push(disposable);
	

	context.subscriptions.push(vscode.commands.registerCommand('extension.newRelease', () => {
		// const terminal = vscode.window.createTerminal(`Ext Terminal #${NEXT_TERM_ID++}`);
		// terminal.sendText("echo 'Sent text immediately after creating'");
		/* myPlugin.chooicingFolder().then(selectedItem => {
			// console.log("selectedItem=>"+selectedItem.name+"/"+selectedItem.uri);
			myPlugin.chooicingRlease(simpleGit(selectedItem.uri.path)).then(release => {
				let cmdStr = `bash ./release.sh ${release.nextRelase} ${release.currentDate}`;
				getTerminal(selectedItem.uri.path).sendText(cmdStr);
			});
		}); */
		myPlugin.chooicingFolder().then(selectedItem => {
			// console.log("selectedItem=>"+selectedItem.name+"/"+selectedItem.uri);
			myPlugin.chooicingRlease(simpleGit(selectedItem.uri.path)).then(release => {
				let cmdStr = `bash ./release.sh ${release.nextRelase} ${release.currentDate}`;
				getTerminal(selectedItem.uri.path).sendText(cmdStr);
			});
		});

	}));
	vscode.window.onDidCloseTerminal((terminal) => {
		console.log(`onDidCloseTerminal, name: ${terminal.name}`);
		mdTml = null;
	});
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

async function newBranch() {
	let selectedItem = await myPlugin.chooicingFolder();
	let newBranch = await myPlugin.chooicingBranch(simpleGit(selectedItem.uri.path));
	// vscode.window.showInformationMessage(newBranch);
	let newBranchFile = "newBranchx.sh";
	let newBranchUrl = "https://raw.githubusercontent.com/zhaoxunyong/vs-code-git-plugin/master/newBranch.sh";
	let tmpdir = tmp.tmpdir;
	let newBranchPath = tmpdir+'/'+newBranchFile;
	fs.exists(newBranchPath, async function(isExist) {
		console.log("isExist----->"+isExist);
		await downloadScripts(newBranchUrl, newBranchPath);
		console.log('newBranchPath======>'+newBranchPath);
		let cmdStr = `bash ${newBranchPath} ${newBranch}`;
		console.log('cmdStr======>'+cmdStr);
		getTerminal(selectedItem.uri.path).sendText(cmdStr);
	});
		
}

function getTerminal(path) {
	if(mdTml == null) {
		mdTml = vscode.window.createTerminal("zerofinance", path);
	}
	mdTml.show(true);
	return mdTml;
}

function downloadScripts(url, file) {
	return new Promise((resolve, reject) => {
		axios({
			url: url,
			method: 'GET',
			responseType: 'blob', // important
		  }).then((response) => {
			fs.writeFile(file, response.data, err => {
				if(err) {
					reject(err);
				} else {
					resolve(file);
				}
			});
		  });
	});
}

module.exports = {
	activate,
	deactivate
}
