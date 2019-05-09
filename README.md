# zerofinance-git

The zerofinance-git, Visual Studio Code. Learn more at https://github.com/zhaoxunyong/vs-code-git-plugin.

## publish 

```bash
npm i vsce -g
npm install
vsce create-publisher zerofinance
#vsce delete-publisher zerofinance
vsce login zerofinance
#vsce package
vsce publish
```