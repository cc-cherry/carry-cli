#!/usr/bin/env node

const path = require('node:path')
const os = require('node:os')
const fs = require('fs-extra')
const { detect } = require('detect-package-manager')
const chalk = require('chalk')
const editJsonFile = require('edit-json-file')

const HOME_DIR = os.homedir()
const CONFIG_DIR = path.join(HOME_DIR, '.carry-cli')
const CONFIG_PRESETS_FILE = path.resolve(CONFIG_DIR, 'presets.json')
const CONFIG_GENERATE_FILE = path.resolve(CONFIG_DIR, 'generates.js')

const error = chalk.red
const warning = chalk.keyword('orange')
const success = chalk.green
const log = console.log

async function getPkg() {
  return await detect()
}

async function writeGenerate(con) {
  fs.writeFile(CONFIG_GENERATE_FILE, con)
}
async function getGenerate() {
  if (!fs.existsSync(CONFIG_GENERATE_FILE))
    await fs.copy(path.resolve(__dirname, 'config/generates.js'), CONFIG_GENERATE_FILE)

  return fs.readFileSync(CONFIG_GENERATE_FILE, { encoding: 'utf8' })
}

async function getConfig() {
  if (!fs.existsSync(CONFIG_PRESETS_FILE))
    await fs.copy(path.resolve(__dirname, 'config/config.json'), CONFIG_PRESETS_FILE)

  try {
    const data = await fs.readJson(CONFIG_PRESETS_FILE)
    return data
  }
  catch (err) {
    log(error(`读取配置失败，请稍后再试! ${err}`))
  }
}

function savePresets(presets) {
  writeConfig('presets', presets)
}

function writeConfig(name, val) {
  const config = editJsonFile(CONFIG_PRESETS_FILE)
  config.set(name, val)
  config.save()
}

module.exports = {
  getPkg,
  savePresets,
  error,
  warning,
  success,
  log,
  getConfig,
  writeConfig,
  writeGenerate,
  getGenerate,
}
