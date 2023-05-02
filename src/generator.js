const path = require('node:path')
const fs = require('node:fs')
const { execSync } = require('node:child_process')
const Metalsmith = require('metalsmith')
const handlebars = require('handlebars')
const filter = require('metalsmith-filter')
const editJsonFile = require('edit-json-file')
const { getPkg } = require('./utils')

const packagejson = editJsonFile(`${process.cwd()}/package.json`)

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
        console.error(err)
      else
        console.log('Build completed')
    })
}

function initPresetShellMapping(pkgPrefix) {
  let commitizenshell = ''
  let huskyshell = ''
  if (pkgPrefix === 'npm install ') {
    commitizenshell = 'commitizen init cz-conventional-changelog --save-dev --save-exact'
    huskyshell = 'npx husky-init && npm install'
  }
  else if (pkgPrefix === 'yarn add ') {
    commitizenshell = 'commitizen init cz-conventional-changelog --yarn --dev --exact'
    huskyshell = 'yarn dlx husky-init --yarn2 && yarn'
  }
  else {
    commitizenshell = 'commitizen init cz-conventional-changelog --pnpm --save-dev --save-exact'
    huskyshell = 'pnpm dlx husky-init && pnpm install'
  }

  const presetShellMapping = {
    eslint: [
      `${pkgPrefix}-D eslint @antfu/eslint-config`,
    ],
    editorconfig: [],
    stylelint: [`${pkgPrefix}stylelint-config-ali stylelint stylelint-scss --save-dev`],
    markdownlint: [`${pkgPrefix}markdownlint-config-ali markdownlint --save-dev`],
    prettier: [`${pkgPrefix}--save-dev --save-exact prettier`],
    commitizen: [`${pkgPrefix}commitizen -D`, commitizenshell, () => {
      packagejson.set('scripts.commit', 'cz')
      packagejson.save()
    }],
    husky: [huskyshell],
    lintstaged: [`${pkgPrefix}--save-dev lint-staged`, () => {
      fs.appendFileSync(`${process.cwd()}/.husky/pre-commit.sh`, 'npx --no-install lint-staged')
      packagejson.set('lint-staged.*', 'eslint --fix')
      packagejson.save()
    }],
    commitlint: [`${pkgPrefix}--save-dev @commitlint/config-conventional @commitlint/cli`, 'npx husky add .husky/commit-msg "npx --no -- commitlint --edit ${1}"'],
  }
  return presetShellMapping
}

module.exports = async function (presets) {
  const presetFiles = []
  const presetShell = []

  for (const preset of presets)
    presetFiles.push(...presetFileMapping[preset])

  initTemplate(presetFiles)

  const pkg = await getPkg()
  let runPrefix = ''
  if (pkg === 'npm')
    runPrefix = `${pkg} install `
  else
    runPrefix = `${pkg} add `

  const presetShellMapping = initPresetShellMapping(runPrefix)
  for (const preset of presets)
    presetShell.push(...presetShellMapping[preset])

  presetShell.forEach((val) => {
    if (typeof val === 'string')
      execSync(val)
    else
      val()
  })
}
