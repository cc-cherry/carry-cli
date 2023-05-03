#!/usr/bin/env node

const path = require('node:path')
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

  global.carry = {
    config,
    presetConfig,
    pkg,
  }
}

module.exports = init
