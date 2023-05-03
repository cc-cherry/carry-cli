#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { detect } = require('detect-package-manager')
const chalk = require('chalk')

async function getPkg() {
  return await detect()
}

function getJson(filename) {
  const config = fs.readFileSync(filename, 'utf8')
  return JSON.parse(config)
}

function savePresets(file, presets) {
  fs.writeFile(file, JSON.stringify(presets), 'utf8', (err) => {
    if (err)
      throw new Error(`保存预设失败，请稍后再试! ${err}`)
  })
}

// 将模板文件复制到指定目录
/**
 *
 * @param { string } templateDir
 * @param { string } targetDir
 */
function copyTemplateFiles(templateDir, targetDir) {
  fs.readdirSync(templateDir).forEach((file) => {
    const originalFilePath = path.join(templateDir, file)

    // 获取目标文件路径
    const stats = fs.statSync(originalFilePath)
    if (stats.isFile()) {
      const targetFilePath = path.join(targetDir, file)
      fs.copyFileSync(originalFilePath, targetFilePath)
    }
    else if (stats.isDirectory()) {
      const targetFolderPath = path.join(targetDir, file)
      fs.mkdirSync(targetFolderPath)
      copyTemplateFiles(originalFilePath, targetFolderPath)
    }
  })
}

const error = chalk.red
const warning = chalk.keyword('orange')
const success = chalk.green
const log = console.log

module.exports = {
  getPkg,
  getJson,
  savePresets,
  error,
  warning,
  success,
  log,
  copyTemplateFiles,
}
