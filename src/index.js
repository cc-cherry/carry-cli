#!/usr/bin/env node

const { Command } = require('commander')
const figlet = require('figlet')
const ora = require('ora')
const init = require('./init')
const cli = require('./cli')
const generator = require('./generator')
const { error, success, warning, log } = require('./utils')

const program = new Command()

const presets = [
  'eslint',
  'editorconfig',
  'stylelint',
  'markdownlint',
  'prettier',
  'commitizen',
  'husky',
  'lintstaged',
  'commitlint',
]

let userChoicePresets = []

function commandUI() {
  program
    .name('carry-cli')
    .description('Carry-cli is a configuration and plugin management tool')
    .version('0.8.0')

  program.command('init')
    .description('Initialize project configuration and plugin templates')
    .argument('[name]', `The name of the configuration or template, type <string> | <Array>, hope is: ${presets.join()}`)
    .action((name, options, command) => {
      userChoicePresets = command.args.slice(1)
      if (userChoicePresets.length !== 0) {
        const incorrect = userChoicePresets.filter(value => !presets.includes(value))
        if (incorrect.length !== 0) {
          log(error(`参数不正确: ${incorrect}`))
          log(warning(`需要的参数类型为: ${presets}`))
        }
      }
    }).parse()
}

function hello() {
  figlet('Hello Carry', (err, data) => {
    if (err) {
      log(error('A bug here'))
      return
    }
    log(success(data))
  })
}

(async () => {
  await init()

  await commandUI()

  if (userChoicePresets.length === 0)
    userChoicePresets = (await cli()).preset

  if (userChoicePresets.length === 0)
    return

  await generator(userChoicePresets)

  hello()
})()
