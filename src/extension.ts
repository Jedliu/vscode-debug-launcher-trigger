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

enum FileType {
  debug = 'debug',
  definition = 'definition',
}

const getActiveFileName = (type: FileType = FileType.debug) => {
  const filePath = (vscode.window as any).activeTextEditor.document.uri.path
  if (!filePath) {
    const message =
      type == FileType.debug
        ? 'Please open test file to debug.'
        : 'Please open entity definition file to generate templates.'
    vscode.window.showErrorMessage(message)
    return
  }
  const fileName = path.basename(filePath)
  return fileName
}

const getProjectPath = () => {
  return (vscode.workspace as any).workspaceFolders[0].uri.path
}

const launchE2eTest = async (fileName: string) => {
  const projectPath = getProjectPath()
  await execShell(`cd ${projectPath} && npm run posttest:e2e`)
  await execShell(`cd ${projectPath} && npm run pretest:e2e`)

  const e2eConfig = {
    name: 'Debug Jest E2E Tests in watch mode',
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

  await sendCommandToLauncher(e2eConfig)
}

const launchJestTest = async (fileName: string, watch?: boolean) => {
  const jestConfig = {
    name: 'Debug Jest Tests in watch mode',
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

  await sendCommandToLauncher(jestConfig)
}

const sendCommandToLauncher = async (setting: any) => {
  const commandStr = `open vscode://fabiospampinato.vscode-debug-launcher/launch?${Buffer.from(
    JSON.stringify(setting),
    'ascii'
  ).toString('base64')}`
  await execShell(commandStr)
}

const runJestTest = async () => {
  console.clear()
  const fileName = getActiveFileName(FileType.debug)
  if (!fileName) {
    vscode.window.showErrorMessage('Please open the Jest test file first.')
    return
  } else if (fileName.match(/e2e-spec\.ts/g)) {
    launchE2eTest(fileName)
  } else if (fileName.match(/spec\.ts/g)) {
    launchJestTest(fileName)
  } else {
    vscode.window.showErrorMessage(
      'Please run Jest test for .spec.ts or .e2e-spec.ts file only.'
    )
    return
  }
  vscode.window.showInformationMessage(
    `Trigger vscode debug launcher for [${fileName}]`
  )
}

const runCodeGenerator = async (isDebug: boolean = false) => {
  let fileName = getActiveFileName(FileType.definition)
  if (!fileName) return
  fileName = fileName.replace(path.extname(fileName), '')

  if (isDebug) {
    const config = {
      name: 'Run code generator',
      type: 'pwa-node',
      request: 'launch',
      program: '${workspaceFolder}/_generators/index.ts',
      args: [fileName],
      console: 'integratedTerminal',
      internalConsoleOptions: 'neverOpen',
    }
    await sendCommandToLauncher(config)
  } else {
    let activeTerm =
      vscode.window.activeTerminal ??
      vscode.window.createTerminal('Code generator')
    activeTerm.show(true)
    activeTerm.sendText(
      `npm run env -- ts-node _generators/index.ts ${fileName}`
    )
  }
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'vscode-debug-launcher-trigger.jest',
    async () => {
      await runJestTest()
    }
  )
  context.subscriptions.push(disposable)

  disposable = vscode.commands.registerCommand(
    'vscode-debug-launcher-trigger.codeGenerator',
    async () => {
      await runCodeGenerator()
    }
  )
  context.subscriptions.push(disposable)

  disposable = vscode.commands.registerCommand(
    'vscode-debug-launcher-trigger.codeGenerator_debug',
    async () => {
      await runCodeGenerator(true)
    }
  )
  context.subscriptions.push(disposable)
}

export function deactivate() {}
