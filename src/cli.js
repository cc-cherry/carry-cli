#!/usr/bin/env node

const inquirer = require('inquirer')
const { savePresets } = require('./utils')

function savePreset(presets, preset) {
  const ps = [].concat(presets, preset)
  savePresets(ps)
}

function getProjType(presets) {
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
  const configurable = global.carry.configurable
  const { presets } = global.carry.config

  let presetVal = await getProjType(presets)
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
        savePreset(presets, {
          name: res.name,
          value: presetVal.preset,
        })
      }
    }
  }
  return presetVal
}
