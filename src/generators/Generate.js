const path = require('node:path')
const execa = require('execa')
const chalk = require('chalk')
const ora = require('ora')
const Metalsmith = require('metalsmith')
const handlebars = require('handlebars')
const filter = require('metalsmith-filter')
const fs = require('fs-extra')
const { log, error } = require('../utils')

class Generate {
  shells = []
  files = []
  packagePrefix = global.carry.packagePrefix
  postFunc = null
  options = null

  constructor() {}

  /**
   * 安装对应的依赖
   */
  async install() {
    // 构建模板
    if (this.files.length !== 0) {
      const templateSpinner = ora('Build Templates').start()
      const temRes = await this.initTemplate()

      if (temRes === 'ok')
        templateSpinner.succeed('Template build completed')

      else templateSpinner.fail(chalk.red('Template build failed'))
    }

    // 执行shell脚本
    this.shells.forEach(async (shell) => {
      const spinner = ora(`Loading dependencies: ${chalk.blue(shell)}`).start()
      try {
        await execa(shell)
      }
      catch (err) {
        log(error(err))
        spinner.fail()
      }
      finally {
        spinner.succeed()
      }
    })
    this.postFunc && this.postFunc()
  }

  /**
   * 初始化脚本函数
   * @returns Promise
   */
  initTemplate() {
    return new Promise((resolve, reject) => {
      Metalsmith(__dirname)
        .source('../../templates')
        .destination('../../dist')
        .use(filter(this.files))
        .use((files, metalsmith, done) => {
          Object.keys(files).forEach((filename) => {
            const file = files[filename]
            const content = file.contents.toString()
            const template = handlebars.compile(content)
            const result = template(this.options)
            file.contents = require('node:buffer').Buffer.from(result)
          })
          done()
        })
        .build((err) => {
          if (err)
            reject(err)
          else
            resolve('ok')
        })
    })
  }
}

module.exports = {
  Generate,
}
