#!/usr/bin/env node

const { promisify } = require('node:util')
const path = require('node:path')
const fs = require('fs-extra')
const execa = require('execa')
const axios = require('axios').default
const download = require('download-git-repo')
const ora = require('ora')
const { getPkg, getConfig, log, error, writeConfig } = require('./utils')

/**
 * 读取配置文件、读取包管理工具
 *
 */
async function init() {
  const config = await getConfig()

  await getTemlpate(config.template)

  const pkg = await getPkg()
  const packagePrefix = getPackagePrefix(pkg)

  const { stdout } = await execa('yarn -v')
  let isYarnOne = false
  if (+stdout.split('.')[0] < 2)
    isYarnOne = true

  global.carry = {
    config,
    pkg,
    packagePrefix,
    isYarnOne,
  }
}

/**
 *
 * @param {String} pkg
 * @returns
 */
function getPackagePrefix(pkg) {
  let runPrefix = ''
  if (pkg === 'npm')
    runPrefix = `${pkg} install `
  else
    runPrefix = `${pkg} add `

  return runPrefix
}

async function getTemlpate({ owner, repo, filePath, branch, sha }) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/?ref=${branch}`
  const TEMPDir = path.resolve(__dirname, '../temp')
  const TEMPLATE_Dir = path.resolve(__dirname, `../temp/${filePath}`)
  const TARGET_TEMPLATE_DIR = path.resolve(__dirname, '../templates')

  const res = await axios.get(apiUrl)

  if (res.status === 200) {
    const templ = res.data.filter(value => value.name === filePath)

    if ((fs.readdirSync(TARGET_TEMPLATE_DIR).length === 0) || (templ.length > 0 && templ[0].sha !== sha)) {
      const downloadAsync = promisify(download)
      let templateSpinner = null
      try {
        templateSpinner = ora('正在更新模板 > 👀').start()
        await downloadAsync(`${owner}/${repo}#${branch}/${filePath}`, TEMPDir)
        await fs.copy(TEMPLATE_Dir, TARGET_TEMPLATE_DIR)
        templateSpinner.succeed('模板更新成功 > 👌')
        writeConfig('template.sha', templ[0].sha)
        fs.emptyDir(TEMPDir)
      }
      catch (err) {
        templateSpinner.fail(`模板下载失败: ${error(err)}`)
      }
    }
  }
  else { log(error('更新模板失败!')) }
}

module.exports = init
