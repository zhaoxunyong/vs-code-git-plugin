# zerofinance-git

The zerofinance-git, Visual Studio Code. Learn more at https://github.com/zhaoxunyong/vs-code-git-plugin.

<h1>This repose has been Deprecated,please visit the new plugin including eclispe/idea/vscode repository: https://github.com/zhaoxunyong/IDEPlugins.git.</h1>

## publish 

```bash
npm i vsce -g
npm install
# vsce create-publisher zerofinance
#vsce delete-publisher zerofinance
#Generated token from "https://dev.azure.com/it0815/_usersSettings/tokens"
#Just login once
vsce login zerofinance
#vsce package
vsce publish
```

## Settings

Setting "terminal.integrated.shell.windows" at "settings.json":

```
#Changing "D:\\Developer\\Git\\bin\\bash.exe" as your Customizes
"terminal.integrated.shell.windows": "YourGitPath\\bin\\bash.exe"
```
