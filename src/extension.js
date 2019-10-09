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
const tmp = require('tmp')
const fs = require('fs')

const util = require('util')
const exec = util.promisify(require('child_process').exec)

let mdTml = null
let myStatusBarItem = null

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
const gitCheckFile = 'gitCheck.sh'
const tmpdir = tmp.tmpdir
const newBranchPath = tmpdir + '/' + newBranchFile
const newReleasePath = tmpdir + '/' + newReleaseFile
const newTagPath = tmpdir + '/' + newTagFile
const gitCheckPath = tmpdir + '/' + gitCheckFile
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

function clearCacheFile() {
    try {
        fs.unlinkSync(newBranchPath)
    } catch (error) {}

    try {
        fs.unlinkSync(newReleasePath)
    } catch (error) {}

    try {
        fs.unlinkSync(newTagPath)
    } catch (error) {}

    try {
        fs.unlinkSync(gitCheckPath)
    } catch (error) {}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.newBranch', function() {
            clearCacheFile()
            newBranch()
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.newRelease', () => {
            clearCacheFile()
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

async function gitCheck(rootPath) {
    rootPath = rootPath.replace(/\\/gm, '/')
    const gitConfigPath = rootPath + '/.git'
    if (!fs.existsSync(gitConfigPath)) {
        const errMsg = `${rootPath} isn't a git project, make sure you are opening the root folder of project!`
        vscode.window.showErrorMessage(errMsg)
        throw new Error(errMsg)
    }
    let projectScriptPath = rootPath + '/' + gitCheckFile
    let scriptPath = gitCheckPath
    scriptPath = scriptPath.replace(/\\/gm, '/')

    if (fs.existsSync(projectScriptPath)) {
        scriptPath = projectScriptPath
    } else {
        let gitCheckUrl = getRootUrl() + '/' + gitCheckFile
        try {
            await myPlugin.downloadScripts(gitCheckUrl, gitCheckPath)
            // await downloadScripts(gitCheckUrl, gitCheckPath).catch(err => {
            //     vscode.window.showErrorMessage(`Can't found ${gitCheckUrl}: ${err}`)
            //     throw new Error(err)
            // })
        } catch (err) {
            console.warn('gitCheck.sh not found in remote git!')
        }
    }
    if (fs.existsSync(scriptPath)) {
        try {
            let isWin = process.platform === 'win32'
            let cmd = ''
            if (isWin) {
                const rootFolder = rootPath.replace(/\/.+$/gm, '')
                cmd = `cd ${rootPath} && ${rootFolder} && ${getWindowsExec()} ${scriptPath}`
            } else {
                cmd = `cd ${rootPath} && bash ${scriptPath}`
            }
            // await exec(cmd, { encoding: "UTF-8" })
            if (myStatusBarItem == null) {
                myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
            }
            // disposable = vscode.window.setStatusBarMessage('Checking git status, it may take a few seconds...')
            myStatusBarItem.text = `Checking git status, it may take a few seconds...`
            // myStatusBarItem.color = new vscode.ThemeColor('statusBar.background')
            myStatusBarItem.color = 'red'
            myStatusBarItem.show()
            await exec(cmd)
        } catch (err) {
            const { stdout, stderr } = err
            const msg = stdout ? stdout : stderr
            // console.log('stdout:', stdout)
            // console.log('stderr:', stderr)
            vscode.window.showErrorMessage(msg)
            throw new Error(msg)
        } finally {
            // disposable.dispose()
            myStatusBarItem.hide()
        }
    } else {
        // Skipping check when gitCheck.sh is existing.
        // vscode.window.showErrorMessage(`Can't found ${newTagFile}`)
    }
}

/**
 * @description: Create branch
 * @Date: 2019-07-03 14:05:21
 */
async function newBranch() {
    let selectedItem = await myPlugin.chooicingFolder()
    const rootPath = selectedItem.uri.fsPath
    await gitCheck(rootPath)
    let newBranch = await myPlugin.chooicingBranch(simpleGit(rootPath))
    // vscode.window.showInformationMessage(newBranch);

    // The path of the root project, if exist, using it, otherwise downloaded from gitlab
    let projectScriptPath = rootPath + '/' + newBranchFile
    let scriptPath = newBranchPath
    if (fs.existsSync(projectScriptPath)) {
        scriptPath = projectScriptPath
    } else {
        let newBranchUrl = getRootUrl() + '/' + newBranchFile
        await myPlugin.downloadScripts(newBranchUrl, newBranchPath).catch(err => {
            vscode.window.showErrorMessage(`Can't found ${newBranchUrl}: ${err}`)
            throw new Error(err)
        })
    }
    if (fs.existsSync(scriptPath)) {
        try {
            let desc = await myPlugin.getDesc()
            if (desc === '' || desc === undefined) {
                let err = 'The message for git description must not be empty!'
                vscode.window.showErrorMessage(err)
                throw new Error(err)
            }
            let cmdStr = `cd "${rootPath}" && bash "${scriptPath}" ${newBranch} "${desc}"`
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
    await gitCheck(rootPath)
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
            await myPlugin.downloadScripts(newTagUrl, newTagPath).catch(err => {
                vscode.window.showErrorMessage(`Can't found ${newTagUrl}: ${err}`)
                throw new Error(err)
            })
        }
        if (fs.existsSync(scriptPath)) {
            try {
                let desc = await myPlugin.getDesc()
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
            await myPlugin.downloadScripts(newReleaseUrl, newReleasePath).catch(err => {
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
                let desc = await myPlugin.getDesc()
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
    // In windows system, if not found "bash.exe", throw an exception
    if (isWin && getWindowsExec().indexOf('bash.exe') == -1) {
        const errMsg = 'Please set "git bash" for the terminal, which is in the Settings: Terminal->External: Windows Exec.'
        vscode.window.showErrorMessage(errMsg)
        throw new Error(errMsg)
    }
    return mdTml
}

exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}

/**
 * @description: Expose objects to the outside
 * @Date: 2019-07-03 13:58:39
 */
module.exports = {
    activate,
    deactivate
}
