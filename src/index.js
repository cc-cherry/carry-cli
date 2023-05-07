#!/usr/bin/env node

const path = require('node:path')
const { Command } = require('commander')
const figlet = require('figlet')
const fs = require('fs-extra')
const { NodeVM } = require('vm2')
const axios = require('axios').default
const init = require('./init')
const cli = require('./cli')
const { error, success, warning, log, getGenerate, writeGenerate, writeConfig } = require('./utils')
const { Generate } = require('./Generate')

const program = new Command()

let userChoicePresets = []

function commandUI(presets) {
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

  const { generatorUrl, sha, shaUrl, islocal } = global.carry.config.generator
  let genes = ''

  if (generatorUrl !== '') {
    if (islocal) {
      genes = fs.readFileSync(generatorUrl, {
        encoding: 'utf8',
      })
    }
    else {
      if (shaUrl !== '') {
        const shaRes = await axios.get(shaUrl)
        if (shaRes && shaRes.data !== sha) {
          const conRes = await axios.get(generatorUrl)
          genes = conRes.data
          await writeGenerate(conRes.data)
          writeConfig('generator.sha', shaRes.data)
        }
        else {
          genes = await getGenerate()
        }
      }
      else {
        try {
          const conRes = await axios.get(generatorUrl)
          genes = conRes.data
          writeGenerate(conRes.data)
        }
        catch (err) {
          log(err)
        }
      }
    }
  }
  else {
    genes = await getGenerate()
  }

  const vmRun = new NodeVM({
    console: 'inherit',
    sandbox: {
      Generate,
    },
    require: {
      builtin: ['fs', 'path'],
      external: [],
      mock: {
        'edit-json-file': require('edit-json-file'),
        'fs-extra': require('fs-extra'),
      },
    },
  })

  const presetGensMapping = vmRun.run(genes)

  const presets = Object.keys(presetGensMapping)

  global.carry.configurable = presets

  await commandUI(presets)

  if (userChoicePresets.length === 0)
    userChoicePresets = (await cli()).preset

  if (userChoicePresets.length === 0)
    return

  const gens = []
  for (const preset of userChoicePresets)
    gens.push(presetGensMapping[preset])

  for (const Gen of gens)
    await (new Gen()).install()

  await fs.copy(path.resolve(path.dirname(__dirname), 'dist'), process.cwd())
  fs.emptyDir(path.resolve(path.dirname(__dirname), 'dist'))

  hello()
})()
