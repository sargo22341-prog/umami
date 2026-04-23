'use strict'

const { spawn } = require('child_process')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const nodeBin = process.execPath
const proxyEntry = path.join(__dirname, 'recipes-search-proxy.cjs')
const viteEntry = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js')

function startProcess(command, args) {
  return spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    windowsHide: false,
  })
}

const proxyProcess = startProcess(nodeBin, [proxyEntry])
const viteProcess = startProcess(nodeBin, [viteEntry])

function stopAll(signal) {
  proxyProcess.kill(signal)
  viteProcess.kill(signal)
}

process.on('SIGINT', () => stopAll('SIGINT'))
process.on('SIGTERM', () => stopAll('SIGTERM'))
