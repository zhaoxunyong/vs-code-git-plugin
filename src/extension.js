// https://segmentfault.com/a/1190000008968904
// https://www.cnblogs.com/virde/p/vscode-extension-input-and-output.html
// https://github.com/steveukx/git-js
// https://www.jianshu.com/p/2b096d8ad9b8
// https://github.com/Microsoft/vscode-extension-samples
// https://www.jianshu.com/p/520c575e91c3
// https://segmentfault.com/a/1190000017279102
// https://segmentfault.com/a/1190000014758981
// https://dev.azure.com/it0815/_usersSettings/tokens
// https://www.cnblogs.com/liuxianan/p/vscode-plugin-publish.html
// https://www.cnblogs.com/virde/p/vscode-extension-input-and-output.html
// https://www.cnblogs.com/virde/p/vscode-extension-input-and-output.html
// http://nodejs.cn/api/fs.html#fs_fs_unlinksync_path
// https://www.cnblogs.com/liuxianan/p/vscode-plugin-snippets-and-settings.html
// https://code.visualstudio.com/api/references/contribution-points

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const myPlugin = require('./myPlugin')
const simpleGit = require('simple-git')
const axios = require('axios')
const tmp = require('tmp')
const fs = require('fs')

let mdTml = null
// const rootUrl = 'https://raw.githubusercontent.com/zhaoxunyong/vs-code-git-plugin/master/'
// let rootUrl = process.env.GIT_PLUGIN_URL
// const config = vscode.workspace.getConfiguration()
// let rootUrl = vscode.workspace.getConfiguration().get('zerofinanceGit.gitScriptsUrlPreference')
// if (!rootUrl) {
//     rootUrl = 'http://gitlab.aeasycredit.net/dave.zhao/deployPlugin/raw/master'
// }
const newBranchFile = 'newBranch.sh'
const newReleaseFile = 'release.sh'
const newTagFile = 'tag.sh'
const tmpdir = tmp.tmpdir
const newBranchPath = tmpdir + '/' + newBranchFile
const newReleasePath = tmpdir + '/' + newReleaseFile
const newTagPath = tmpdir + '/' + newTagFile
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function getRootUrl() {
    // If you wanna get realtime config, must use "vscode.workspace.getConfiguration()"
    let rootUrl = vscode.workspace.getConfiguration().get('zerofinanceGit.gitScriptsUrlPreference')
    if (!rootUrl) {
        rootUrl = 'http://gitlab.zerofinance.net/dave.zhao/deployPlugin/raw/master'
    }
    return rootUrl
}

// function getGitHomePath() {
//     return vscode.workspace.getConfiguration().get('zerofinanceGit.gitHomePathPreference')
// }

function getNeedTagWhileBranch() {
    // If you wanna get realtime config, must use "vscode.workspace.getConfiguration()"
    return vscode.workspace.getConfiguration().get('zerofinanceGit.tagWhileBranchPreference')
}

function getWindowsExec() {
    // If you wanna get realtime config, must use "vscode.workspace.getConfiguration()"
    return vscode.workspace.getConfiguration().get('terminal.external.windowsExec')
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.newBranch', function() {
            newBranch()
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.newRelease', () => {
            newRelease()
        })
    )

    /*context.subscriptions.push(
        vscode.commands.registerCommand('extension.clearCache', () => {
            try {
                fs.unlinkSync(newBranchPath)
            } catch (error) {}

            try {
                fs.unlinkSync(newReleasePath)
            } catch (error) {}

            try {
                fs.unlinkSync(newTagPath)
            } catch (error) {}
            vscode.window.showInformationMessage('Clear cache sussessfully!')
        })
    )*/

    vscode.window.onDidCloseTerminal(terminal => {
        console.log(`onDidCloseTerminal, name: ${terminal.name}`)
        mdTml = null
    })
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}

/**
 * @description: Create branch
 * @Date: 2019-07-03 14:05:21
 */
async function newBranch() {
    let selectedItem = await myPlugin.chooicingFolder()
    const rootPath = selectedItem.uri.fsPath
    let newBranch = await myPlugin.chooicingBranch(simpleGit(rootPath))
    // vscode.window.showInformationMessage(newBranch);

    // The path of the root project, if exist, using it, otherwise downloaded from gitlab
    let projectScriptPath = rootPath + '/' + newBranchFile
    let scriptPath = newBranchPath
    if (fs.existsSync(projectScriptPath)) {
        scriptPath = projectScriptPath
    } else {
        let newBranchUrl = getRootUrl() + '/' + newBranchFile
        await downloadScripts(newBranchUrl, newBranchPath).catch(err => {
            vscode.window.showErrorMessage(`Can't found ${newBranchUrl}: ${err}`)
            throw new Error(err)
        })
    }
    if (fs.existsSync(scriptPath)) {
        try {
            let cmdStr = `cd "${rootPath}" && bash "${scriptPath}" ${newBranch}`
            // console.log('cmdStr======>'+cmdStr);
            getTerminal().sendText(cmdStr)
        } catch (err) {
            vscode.window.showErrorMessage(err)
        }
    } else {
        vscode.window.showErrorMessage(`Can't found ${newBranchFile}`)
    }
}

/**
 * @description: Create release
 * @Date: 2019-07-03 14:05:43
 */
async function newRelease() {
    let selectedItem = await myPlugin.chooicingFolder()
    const rootPath = selectedItem.uri.fsPath
    let git = simpleGit(rootPath)

    let releaseType = await myPlugin.chooicingRleaseType()
    let release = {}
    let selectedRelease = ''
    // Only for tag the release version
    if ('tag' === releaseType) {
        selectedRelease = await myPlugin.listAllRemoteReleaseVersions(git)
        release = myPlugin.chooicingTag(selectedRelease)
        // vscode.window.showInformationMessage(newBranch);

        let projectScriptPath = rootPath + '/' + newTagFile
        let scriptPath = newTagPath

        if (fs.existsSync(projectScriptPath)) {
            scriptPath = projectScriptPath
        } else {
            let newTagUrl = getRootUrl() + '/' + newTagFile
            await downloadScripts(newTagUrl, newTagPath).catch(err => {
                vscode.window.showErrorMessage(`Can't found ${newTagUrl}: ${err}`)
                throw new Error(err)
            })
        }
        if (fs.existsSync(scriptPath)) {
            try {
                let desc = await getDesc()
                if (desc === '' || desc === undefined) {
                    let err = 'The message for git description must not be empty!'
                    vscode.window.showErrorMessage(err)
                    throw new Error(err)
                }
                let cmdStr = `cd "${rootPath}" && bash "${scriptPath}" ${release.nextRelase} ${release.currentDate} "${desc}"`
                console.log('cmdStr======>' + cmdStr)
                getTerminal().sendText(cmdStr)
            } catch (err) {
                vscode.window.showErrorMessage(err)
            }
        } else {
            vscode.window.showErrorMessage(`Can't found ${newTagFile}`)
        }
    } else {
        release = await myPlugin.chooicingRlease(releaseType, git)
        console.log('release----->', release)
        // vscode.window.showInformationMessage(newBranch);

        let projectScriptPath = rootPath + '/' + newReleaseFile
        let scriptPath = newReleasePath

        if (fs.existsSync(projectScriptPath)) {
            scriptPath = projectScriptPath
        } else {
            let newReleaseUrl = getRootUrl() + '/' + newReleaseFile
            await downloadScripts(newReleaseUrl, newReleasePath).catch(err => {
                vscode.window.showErrorMessage(`Can't found ${newReleaseUrl}: ${err}`)
                throw new Error(err)
            })
        }
        if (fs.existsSync(scriptPath)) {
            try {
                let needTagWhileBranch = getNeedTagWhileBranch()
                console.log('needTagWhileBranch------------', needTagWhileBranch)
                if (needTagWhileBranch) {
                    let tooltips = `It will tag ${release.nextRelase}-${release.currentDate} for ${release.nextRelase} automatically. Are you sure to tag?`
                    needTagWhileBranch = await vscode.window.showInformationMessage(tooltips, 'Yes', 'No').then(function(select) {
                        if (select === 'No') {
                            return false
                        } else {
                            return true
                        }
                    })
                }
                let desc = await getDesc()
                if (desc === '' || desc === undefined) {
                    let err = 'The message for git description must not be empty!'
                    vscode.window.showErrorMessage(err)
                    throw new Error(err)
                }
                let cmdStr = `cd "${rootPath}" && bash "${scriptPath}" ${release.nextRelase} ${release.currentDate} ${needTagWhileBranch} "${desc}"`
                console.log('cmdStr======>' + cmdStr)
                getTerminal().sendText(cmdStr)
            } catch (err) {
                vscode.window.showErrorMessage(err)
            }
        } else {
            vscode.window.showErrorMessage(`Can't found ${newReleaseFile}`)
        }
    }
}

/**
 * @description: Get the terminal of vscode
 * @returns terminal
 * @Date: 2019-07-03 14:05:53
 */
function getTerminal() {
    if (mdTml == null) {
        mdTml = vscode.window.createTerminal('zerofinance')
    }
    mdTml.show(true)
    let isWin = process.platform === 'win32'
    // In windows system, if not found "git-bash.exe", throw an exception
    if (isWin && getWindowsExec().indexOf('git-bash.exe') == -1) {
        const errMsg = 'Please set "git bash" for the terminal, which is in the Settings: Terminal->External: Windows Exec.'
        vscode.window.showErrorMessage(errMsg)
        throw new Error(errMsg)
    }
    return mdTml
}

async function getDesc() {
    return await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'Add a message for git description',
        prompt: 'Add a message for git description',
        validateInput: function(text) {
            if (text == '') {
                return 'Please add a message for git description.'
            }
            return ''
        }
    })
}

/**
 * @description: Download the script from github
 * @param {string} github url
 * @Date: 2019-07-03 14:06:21
 */
function downloadScripts(url, file) {
    return new Promise((resolve, reject) => {
        axios({
            url: url,
            method: 'GET',
            responseType: 'blob', // important
            headers: {
                'Cache-Control': 'no-cache'
            }
        })
            .then(response => {
                fs.writeFile(file, response.data, err => {
                    if (err) {
                        throw err
                    } else {
                        resolve(file)
                    }
                })
            })
            .catch(function(error) {
                // handle error
                // console.log("error->", error);
                reject(error)
                // throw new Error(error);
            })
    })
}

/**
 * @description: Expose objects to the outside
 * @Date: 2019-07-03 13:58:39
 */
module.exports = {
    activate,
    deactivate
}
