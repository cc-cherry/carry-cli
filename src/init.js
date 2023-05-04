#!/usr/bin/env node

const path = require('node:path')
const execa = require('execa')
const { getPkg, getJson } = require('./utils')

const presetFile = `${path.resolve(__dirname)}/config/preset.json`
const configFile = `${path.resolve(__dirname)}/config/config.json`

/**
 * 读取配置文件
 * 读取包管理工具
 *
 */
async function init() {
  const config = await getJson(configFile)
  const presetConfig = await getJson(presetFile)
  const pkg = await getPkg()
  const packagePrefix = getPackagePrefix(pkg)

  const { stdout } = await execa('yarn -v')
  let isYarnOne = false
  if (+stdout.split('.')[0] < 2)
    isYarnOne = true

  global.carry = {
    config,
    presetConfig,
    pkg,
    packagePrefix,
    isYarnOne,
  }
}

function getPackagePrefix(pkg) {
  let runPrefix = ''
  if (pkg === 'npm')
    runPrefix = `${pkg} install `
  else
    runPrefix = `${pkg} add `

  return runPrefix
}

module.exports = init
