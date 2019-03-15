const vscode = require('vscode');

Date.prototype.Format = function (fmt) { 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

async function chooicingFolder() {
    return await vscode.window.showWorkspaceFolderPick();
}

function chooicingBranch(simpleGit) {
    return new Promise((resolve, reject) => {
        simpleGit.branch((err, branch)=> {
            let currentBranch = branch.current;
            const currentBranchs = currentBranch.split('.')
            // Get next branch
            let nextBranch = '';
            if(currentBranch.endsWith('.x') && currentBranchs.length == 3) {
                const [p1,p2,p3] = currentBranchs;
                const nextP2 = parseInt(p2)+1;
                nextBranch = p1+'.'+nextP2+".x";
            }
            vscode.window.showInputBox(
                { // 这个对象中所有参数都是可选参数
                    password:false, // 输入内容是否是密码
                    ignoreFocusOut: false, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    placeHolder:'Fill in new branch', // 在输入框内的提示信息
                    prompt:'The new branch has been filled in!', // 在输入框下方的提示信息
                    value: nextBranch,
                    validateInput: function (text) {
                        if(text == '' || !text.endsWith('.x')) {
                            return 'Please fill in a correct branch name: similar to 1.0.x and so on.';
                        } 
                        return ''; 
                    } // 对输入内容进行验证并返回
            }).then(function(newBranch){
                if (!newBranch) return;
                resolve(newBranch);
            });
        });
    });
}

function chooicingRlease(simpleGit) {
    return new Promise((resolve, reject) => {
        simpleGit.tags((err, tags) => {
            let nextRelase = '';
            console.log("Latest available tag: %s", tags.latest);
            const latestTag = tags.latest;
            if(latestTag != undefined && latestTag.indexOf('-') != -1) {
                const [currentRelease, ] = latestTag.split('-');
                // console.log("currentRelease="+currentRelease);
                const currentReleases = currentRelease.split('.');
                // Get next relase
                if(currentReleases.length >= 3) {
                    const [p1,p2,p3] = currentReleases;
                    const nextP3 = parseInt(p3)+1;
                    nextRelase = p1+'.'+p2+'.'+nextP3+'.release';
                }
            }
            vscode.window.showInputBox(
                { // 这个对象中所有参数都是可选参数
                    password:false, // 输入内容是否是密码
                    ignoreFocusOut: false, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    placeHolder:'Fill in new relase', // 在输入框内的提示信息
                    prompt:'The new relase has been filled in!', // 在输入框下方的提示信息
                    value: nextRelase,
                    validateInput: function (text) {
                        if(text == '' || (text.indexOf('.release') == -1 && text.indexOf('.hotfix') == -1)) {
                            return 'Please fill in a correct relase name: similar to 1.0.0.release and so on.';
                        } 
                        return ''; 
                    } // 对输入内容进行验证并返回
            }).then(function(nextRelase){
                if (!nextRelase) return;
                const currentDate = new Date().Format("yyyyMMddhhmm")
                resolve({
                    'nextRelase': nextRelase,
                    'currentDate': currentDate
                });
            });
        });
    });
}

module.exports = {
	chooicingFolder,
    chooicingBranch,
    chooicingRlease
}