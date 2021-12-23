# vscode-debug-launcher-trigger README

This extension is intended to be used for sending the configuration to [vscode-debug-launcher](https://github.com/Jedliu/vscode-debug-launcher) and launch the debugs from command line or by hot-keys.

## How to build VSIX file
`npm install -g vsce`: install the vsce package
`vsce package`: build the VSIX package

## Requirements

1. Should install the [vscode-debug-launcher](https://github.com/Jedliu/vscode-debug-launcher) firstly. Install from VSIX... from the Extensions panel of visual studio.
2. Should install this plugin via VSIX as well.
3. Set the hot keys for the commands which are listed in commands section of package.json.

**Enjoy!**
