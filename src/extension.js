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
// https://www.cnblogs.com/virde/p/vscode-extension-input-and-output.html
// https://www.cnblogs.com/virde/p/vscode-extension-input-and-output.html
// http://nodejs.cn/api/fs.html#fs_fs_unlinksync_path

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// const {chooicingFolder, chooicingBranch} = require("./MyPlugin");
const myPlugin = require("./myPlugin");
const simpleGit = require('simple-git')
const axios = require('axios')
const tmp = require('tmp');
var fs = require('fs')

let mdTml = null;
const newBranchFile = "newBranch.sh";
const newReleaseFile = "release.sh";
const tmpdir = tmp.tmpdir;
const newBranchPath = tmpdir+'/'+newBranchFile;
const newReleasePath = tmpdir+'/'+newReleaseFile;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.newBranch', function () {
		vscode.window.showInformationMessage("Ensure the code has been submitted, otherwise maybe failed. Are you sure?",'Yes','No')
        .then(function(select){
					if(select === 'Yes') {
						newBranch();
					}
        });
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.newRelease', () => {
		vscode.window.showInformationMessage("Ensure the code has been submitted, otherwise maybe failed. Are you sure?",'Yes','No')
        .then(function(select){
					if(select === 'Yes') {
						newRelease();
					}
        });
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.clearCache', () => {
		try {
			fs.unlinkSync(newBranchPath);
			fs.unlinkSync(newReleasePath);
		} catch (error) {
			// do nothing
		}
		vscode.window.showInformationMessage("Clear cache sussessfully!");
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
	let newBranch = await myPlugin.chooicingBranch(simpleGit(selectedItem.uri.fsPath));
	// vscode.window.showInformationMessage(newBranch);
	let newBranchFile = "newBranch.sh";
	let newBranchUrl = "https://raw.githubusercontent.com/zhaoxunyong/vs-code-git-plugin/master/"+newBranchFile;
	
	fs.exists(newBranchPath, async function(isExist) {
		// console.log("isExist----->"+isExist);
		if(!isExist) {
			vscode.window.showInformationMessage(`${newBranchFile} is downloading...`)
			await downloadScripts(newBranchUrl, newBranchPath).catch(err => {
				vscode.window.showErrorMessage(`Can't found ${newBranchUrl}`);
			});
			vscode.window.showInformationMessage(`${newBranchFile} downloaded in ${newBranchPath}.`)
		}
		// console.log('newBranchPath======>'+newBranchPath);
		try {
			let cmdStr = `cd "${selectedItem.uri.fsPath}" && bash "${newBranchPath}" ${newBranch}`;
			// console.log('cmdStr======>'+cmdStr);
			getTerminal().sendText(cmdStr);
		} catch (err) {
			vscode.window.showErrorMessage(err);
		}
	});
}

async function newRelease() {
	let selectedItem = await myPlugin.chooicingFolder();
	let release = await myPlugin.chooicingRlease(simpleGit(selectedItem.uri.fsPath));
	// vscode.window.showInformationMessage(newBranch);
	let newReleaseUrl = "https://raw.githubusercontent.com/zhaoxunyong/vs-code-git-plugin/master/"+newReleaseFile;
	
	fs.exists(newReleasePath, async function(isExist) {
		// console.log("isExist----->"+isExist);
		if(!isExist) {
			vscode.window.showInformationMessage(`${newReleaseFile} is downloading...`)
			await downloadScripts(newReleaseUrl, newReleasePath).catch(err => {
				vscode.window.showErrorMessage(`Can't found ${newReleaseUrl}`);
			});
			vscode.window.showInformationMessage(`${newReleaseFile} downloaded in ${newReleasePath}.`)
		}
		try {
			// console.log('newReleasePath======>'+newReleasePath);
			let cmdStr = `cd "${selectedItem.uri.fsPath}" && bash "${newReleasePath}" ${release.nextRelase} ${release.currentDate}`;
			// console.log('cmdStr======>'+cmdStr);
			getTerminal().sendText(cmdStr);
		} catch (err) {
			vscode.window.showErrorMessage(err);
		}
	});
}

function getTerminal() {
	if(mdTml == null) {
		mdTml = vscode.window.createTerminal("zerofinance");
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
				headers: {
					'Cache-Control': 'no-cache'
				}
		  }).then((response) => {
				fs.writeFile(file, response.data, err => {
					if(err) {
						throw err;
					} else {
						resolve(file);
					}
				});
		  }).catch(function (error) {
				// handle error
				// console.log("error->", error);
				reject(error);
				// throw new Error(error);
		  });
	});
}

module.exports = {
	activate,
	deactivate
}
