const vscode = require('vscode')
const dateUtils = require('./dateUtils')

async function chooicingFolder() {
    return await vscode.window.showWorkspaceFolderPick()
}

function chooicingBranch(simpleGit) {
    return new Promise((resolve, reject) => {
        simpleGit.branch((err, branch) => {
            let currentBranch = getCurrentBranch(branch)
            // Get next branch
            const currentBranchs = currentBranch.split('.')
            let nextBranch = ''

            if (currentBranch.endsWith('.x') && currentBranchs.length == 3) {
                const [p1, p2, p3] = currentBranchs
                const nextP2 = parseInt(p2) + 1
                nextBranch = p1 + '.' + nextP2 + '.x'
            } else {
                nextBranch = '1.0.x'
            }
            vscode.window
                .showInputBox({
                    // 这个对象中所有参数都是可选参数
                    password: false, // 输入内容是否是密码
                    ignoreFocusOut: false, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    placeHolder: 'Fill in new branch', // 在输入框内的提示信息
                    prompt: 'The new branch has been filled in!', // 在输入框下方的提示信息
                    value: nextBranch,
                    validateInput: function(text) {
                        if (text == '' || !text.endsWith('.x')) {
                            return 'Please fill in a correct branch name: similar to 1.0.x and so on.'
                        }
                        return ''
                    } // 对输入内容进行验证并返回
                })
                .then(function(newBranch) {
                    if (!newBranch) return
                    resolve(newBranch)
                })
        })
    })
}

function chooicingRlease(releaseType, simpleGit) {
    return new Promise((resolve, reject) => {
        const currentDate = dateUtils.formatTime('yyyyMMddhhmm', new Date())
        simpleGit.branch((err, branch) => {
            /* if (!branch.current.endsWith('.x')) {
                vscode.window.showErrorMessage('Only support ' + releaseType + ' version based on branch version(similar to 1.0.x)!')
                return
            } */
            let currentBranch = getCurrentBranch(branch)
            simpleGit.tags((err, tags) => {
                let nextRelase = ''
                if (currentBranch == '') {
                    vscode.window.showErrorMessage('Please create a branch first.')
                    return
                } else {
                    let currentBranchs = currentBranch.split('.')
                    let [b1, b2] = currentBranchs
                    // console.log("Latest available tag: %s", tags.latest);
                    const latestTag = tags.latest
                    if (latestTag != undefined && latestTag.indexOf('-') != -1) {
                        const [currentRelease] = latestTag.split('-')
                        // console.log("currentRelease="+currentRelease);
                        const currentReleases = currentRelease.split('.')
                        // Get next relase
                        if (currentReleases.length >= 3) {
                            const [p1, p2, p3] = currentReleases
                            const compareBranch = b1 + b2
                            const compareTag = p1 + p2
                            // 如果当前tag的版本与当前分支的不一样，以当前分支为主
                            if (compareBranch != compareTag) {
                                nextRelase = `${b1}.${b2}.0.${releaseType}`
                            } else {
                                const nextP3 = parseInt(p3) + 1
                                nextRelase = p1 + '.' + p2 + '.' + nextP3 + '.' + releaseType
                            }
                        }
                    } else {
                        // 没有tag，默认以当前分支创建
                        nextRelase = `${b1}.${b2}.0.${releaseType}`
                    }
                    vscode.window
                        .showInputBox({
                            // 这个对象中所有参数都是可选参数
                            password: false, // 输入内容是否是密码
                            ignoreFocusOut: false, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                            placeHolder: 'Fill in new ' + releaseType, // 在输入框内的提示信息
                            prompt: 'The new ' + releaseType + ' has been filled in!', // 在输入框下方的提示信息
                            value: nextRelase,
                            validateInput: function(text) {
                                if (text == '' || text.indexOf('.' + releaseType) == -1) {
                                    return 'Please fill in a correct relase name: similar to 1.0.0.' + releaseType + ' and so on.'
                                }
                                return ''
                            } // 对输入内容进行验证并返回
                        })
                        .then(function(nextRelase) {
                            if (!nextRelase) return
                            resolve({
                                nextRelase: nextRelase,
                                currentDate: currentDate
                            })
                        })
                }
            })
        })
    })
}

/* async function chooicingFolder() {
    return await vscode.window.showWorkspaceFolderPick()
} */

async function chooicingRleaseType() {
    const items = [
        {
            label: 'release',
            description: 'The full version for release.'
            // detail: 'first item details'
        },
        {
            label: 'hotfix',
            description: 'The hotfix version for release.'
        }
    ]
    return await vscode.window.showQuickPick(items, { placeHolder: 'Which release type would you want to pick?' }).then(value => {
        return value.label
    })
}

/**
 * 得到当前最大的分支版本
 */
function getCurrentBranch(branch) {
    /* let currentBranchTemp = 0
    let currentBranch = ''
    for (let key in branch.branches) {
        if (!key.startsWith('remotes/') && key.endsWith('.x')) {
            let keyTemp = parseInt(key.replace(/\.|x/gm, ''))
            if (keyTemp > currentBranchTemp) {
                currentBranchTemp = keyTemp
                currentBranch = key
            }
        }
    }
    // console.log("currentBranch--->"+currentBranch);
    return currentBranch */

    let currentBranch = ''
    for (let version in branch.branches) {
        if (version.startsWith('remotes/origin/') && version.endsWith('.x')) {
            const remoteBranchVersion = version.split('/')[2]
            currentBranch = remoteBranchVersion
        }
    }
    // console.log('currentBranch--->', currentBranch)
    return currentBranch
}

module.exports = {
    chooicingFolder,
    chooicingBranch,
    chooicingRlease,
    chooicingRleaseType
}
