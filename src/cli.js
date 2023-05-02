const fs = require('node:fs')
const path = require('node:path')
const inquirer = require('inquirer')

const presetFile = `${path.resolve(__dirname)}/config/preset.json`
const configFile = `${path.resolve(__dirname)}/config/config.json`

const { configurable } = getJson(configFile)
const { presets } = getJson(presetFile)

function getJson(filename) {
  const config = fs.readFileSync(filename, 'utf8')
  return JSON.parse(config)
}

function savePreset(preset) {
  presets.push(preset)
  fs.writeFile(presetFile, JSON.stringify({ presets }), 'utf8', (err) => {
    if (err)
      console.log(`保存预设失败，请稍后再试! ${err}`)
  })
}

function getProjType() {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: '请选择预设模板',
      choices: presets,
    },
  ])
}

module.exports = async function () {
  let presetVal = await getProjType()
  if (presetVal.preset === '') {
    presetVal = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'preset',
        message: '请选择需要的配置',
        choices: configurable,
      },
    ])
    if (presetVal.preset.length !== 0) {
      const res = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'issave',
          message: '是否需要保存该配置为预设',
          default: false,
        },
      ])
      if (res.issave) {
        const res = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '请输入预设的名称: ',
            validate: value => value !== '',
          },
        ])
        savePreset({
          name: res.name,
          value: presetVal.preset,
        })
      }
    }
  }
  return presetVal
}
