import * as cp from 'child_process'
import * as path from 'path'
import * as vscode from 'vscode'

const execShell = (cmd: string) =>
  new Promise<string>((resolve, reject) => {
    cp.exec(cmd, (err, out) => {
      if (err) {
        return reject(err)
      }
      return resolve(out)
    })
  })

const getActiveFileName = () => {
  const filePath = (vscode.window as any).activeTextEditor.document.uri.path
  if (!filePath) {
    vscode.window.showErrorMessage('Please open e2e test file to debug.')
    return
  }
  const fileName = path.basename(filePath)
  return fileName
}

const launchE2eTest = async () => {
  const fileName = getActiveFileName()
  if (!fileName || !fileName.match(/.e2e-spec.ts/g)) {
    vscode.window.showErrorMessage(
      'Please run e2e test for .e2e-spec.ts file only.'
    )
    return
  }

  const projectPath = (vscode.workspace as any).workspaceFolders[0].uri.path
  await execShell(`cd ${projectPath} && npm run posttest`)
  await execShell(`cd ${projectPath} && npm run pretest`)

  const e2eConfig = {
    name: 'Debug Jest E2E Tests --watch',
    type: 'node',
    request: 'launch',
    runtimeArgs: [
      '--inspect-brk',
      '${workspaceFolder}/node_modules/.bin/jest',
      `--runInBand`,
      '--config',
      '${workspaceRoot}/test/jest-e2e.json',
      '--watch',
      `--testPathPattern=${fileName}`,
    ],
    console: 'integratedTerminal',
    internalConsoleOptions: 'neverOpen',
    port: 9229,
  }

  const commandStr = `open vscode://fabiospampinato.vscode-debug-launcher/launch?${Buffer.from(
    JSON.stringify(e2eConfig),
    'ascii'
  ).toString('base64')}`
  await execShell(commandStr)

  vscode.window.showInformationMessage(
    `Trigger vscode debug launcher for [${fileName}]`
  )
}

const launchJestTest = async () => {
  const fileName = getActiveFileName()
  if (!fileName || !fileName.match(/.spec.ts/g)) {
    vscode.window.showErrorMessage(
      'Please run jest test for .spec.ts file only.'
    )
    return
  }

  const jestConfig = {
    name: 'Debug Jest Tests --watch',
    type: 'node',
    request: 'launch',
    runtimeArgs: [
      '--inspect-brk',
      '${workspaceRoot}/node_modules/.bin/jest',
      '--runInBand',
      '--watch',
      `--testPathPattern=${fileName}`,
    ],
    console: 'integratedTerminal',
    internalConsoleOptions: 'neverOpen',
    port: 9229,
  }
  const commandStr = `open vscode://fabiospampinato.vscode-debug-launcher/launch?${Buffer.from(
    JSON.stringify(jestConfig),
    'ascii'
  ).toString('base64')}`
  await execShell(commandStr)

  vscode.window.showInformationMessage(
    `Trigger vscode debug launcher for [${fileName}]`
  )
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'vscode-debug-launcher-trigger.e2e',
    async () => {
      launchE2eTest()
    }
  )
  context.subscriptions.push(disposable)

  disposable = vscode.commands.registerCommand(
    'vscode-debug-launcher-trigger.jest',
    async () => {
      launchJestTest()
    }
  )
  context.subscriptions.push(disposable)
}

export function deactivate() {}
