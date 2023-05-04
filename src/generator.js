#!/usr/bin/env node

const { exec } = require('node:child_process')
const path = require('node:path')
const fs = require('fs-extra')
const Metalsmith = require('metalsmith')
const handlebars = require('handlebars')
const filter = require('metalsmith-filter')
const editJsonFile = require('edit-json-file')
const execa = require('execa')
const ora = require('ora')

const chalk = require('chalk')
const { log, success, error, warning, copyTemplateFiles } = require('./utils')

const packagejson = editJsonFile(path.resolve(process.cwd(), 'package.json'))

const presetFileMapping = {
  eslint: ['.eslintrc', '.eslintignore', '.vscode\\extensions.json', '.vscode\\settings.json'],
  editorconfig: ['.editorconfig'],
  stylelint: ['.stylelintrc', '.stylelintignore'],
  markdownlint: ['.markdownlint.json', 'markdownlintignore'],
  prettier: ['.prettierrc'],
  commitizen: [],
  husky: [],
  lintstaged: [],
  commitlint: ['commitlint.config.js'],
}

function initTemplate(presetFiles) {
  return new Promise((resolve, reject) => {
    Metalsmith(__dirname)
      .source('../templates')
      .destination('../dist')
      .use(filter(presetFiles))
      .use((files, metalsmith, done) => {
        Object.keys(files).forEach((filename) => {
          const file = files[filename]
          const content = file.contents.toString()
          const template = handlebars.compile(content)
          const result = template({ title: 'cherry' })
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

async function initPresetShellMapping(pkgPrefix) {
  let commitizenshell = ''
  let huskyshell = ''
  if (pkgPrefix === 'npm install ') {
    commitizenshell = 'commitizen init cz-conventional-changelog -D --save-exact'
    huskyshell = 'npx husky-init && npm install'
  }
  else if (pkgPrefix === 'yarn add ') {
    commitizenshell = 'commitizen init cz-conventional-changelog --yarn --dev --exact'
    huskyshell = 'yarn dlx husky-init --yarn2 && yarn'

    const { stdout } = await execa('yarn -v')
    if (+stdout.split('.')[0] < 2)
      huskyshell = 'npx husky-init && yarn'
  }
  else {
    commitizenshell = 'commitizen init cz-conventional-changelog --pnpm -D --save-exact'
    huskyshell = 'pnpm dlx husky-init && pnpm install'
  }

  const presetShellMapping = {
    eslint: [
      `${pkgPrefix}-D eslint @antfu/eslint-config`,
    ],
    editorconfig: [],
    stylelint: [`${pkgPrefix}stylelint-config-ali stylelint stylelint-scss -D`],
    markdownlint: [`${pkgPrefix}markdownlint-config-ali markdownlint -D`],
    prettier: [`${pkgPrefix}-D --save-exact prettier`],
    commitizen: [`${pkgPrefix}commitizen -D`, commitizenshell, () => {
      packagejson.set('scripts.commit', 'cz')
      packagejson.save()
    }],
    husky: [huskyshell],
    lintstaged: [`${pkgPrefix}-D lint-staged`, () => {
      fs.appendFileSync(path.resolve(process.cwd(), '.husky/pre-commit.sh'), 'npx --no-install lint-staged')
      packagejson.set('lint-staged.*', 'eslint --fix')
      packagejson.save()
    }],
    commitlint: [`${pkgPrefix}-D @commitlint/config-conventional @commitlint/cli`, 'npx husky add .husky/commit-msg "npx --no -- commitlint --edit ${1}"'],
  }
  return presetShellMapping
}

module.exports = async function (presets) {
  const presetFiles = []
  const presetShell = []

  for (const preset of presets)
    presetFiles.push(...presetFileMapping[preset])

  if (presetFiles.length !== 0) {
    const templateSpinner = ora('Build Templates').start()

    const temRes = await initTemplate(presetFiles)

    if (temRes === 'ok') {
      templateSpinner.succeed('Template build completed')
      await fs.copy(path.resolve(path.dirname(__dirname), 'dist'), process.cwd())
      fs.emptyDir(path.resolve(path.dirname(__dirname), 'dist'))
    }

    else { templateSpinner.fail(chalk.red('Template build failed')) }
  }

  const pkg = global.carry.pkg

  let runPrefix = ''
  if (pkg === 'npm')
    runPrefix = `${pkg} install `
  else
    runPrefix = `${pkg} add `

  const presetShellMapping = await initPresetShellMapping(runPrefix)
  for (const preset of presets)
    presetShell.push(...presetShellMapping[preset])

  presetShell.forEach(async (val) => {
    if (typeof val === 'string') {
      const spinner = ora(`Loading dependencies: ${chalk.blue(val)}`).start()
      try {
        await execa(val)
      }
      catch (err) {
        log(error(err))
      }
      finally {
        spinner.succeed()
      }
    }
    else { val() }
  })
}
