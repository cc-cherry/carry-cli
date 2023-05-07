const path = require('node:path')
const editJsonFile = require('edit-json-file')
const fs = require('fs-extra')


/**
 * EslitGenerator
 * eslint的生成器
 */
class EslitGenerator extends Generate {
  /**
   * 初始化脚本和文件映射
   */
  constructor() {
    super()
    this.files.push(...['.eslintrc', '.eslintignore', '.vscode\\extensions.json', '.vscode\\settings.json'])
    this.shells.push(...[
      `${this.packagePrefix}-D eslint typescript @antfu/eslint-config`,
    ])
  }
}

class EditorGenerator extends Generate {
  constructor() {
    super()
    this.files.push(...['.editorconfig'])
  }
}

class StylelintGenerator extends Generate {
  constructor() {
    super()
    this.files.push(...['.stylelintrc', '.stylelintignore'])
    this.shells.push(...[
      `${this.packagePrefix}stylelint-config-ali stylelint stylelint-scss -D`,
    ])
  }
}

class MarkdownlintGenerator extends Generate {
  constructor() {
    super()
    this.files.push(...['.markdownlint.json', 'markdownlintignore'])
    this.shells.push(...[
      `${this.packagePrefix}markdownlint-config-ali markdownlint -D`,
    ])
  }
}

class PrettierGenerator extends Generate {
  constructor() {
    super()
    this.files.push(...['.prettierrc'])
    this.shells.push(...[
      `${this.packagePrefix}-D --save-exact prettier`,
    ])
  }
}

class CommitizenGenerator extends Generate {
  constructor() {
    super()

    let commitizenshell = ''

    if (this.packagePrefix === 'npm install ')
      commitizenshell = 'commitizen init cz-conventional-changelog -D --save-exact'

    else if (this.packagePrefix === 'yarn add ')
      commitizenshell = 'commitizen init cz-conventional-changelog --yarn --dev --exact'

    else
      commitizenshell = 'commitizen init cz-conventional-changelog --pnpm -D --save-exact'

    this.shells.push(...[`${this.packagePrefix}commitizen -D`, commitizenshell])

    this.postFunc = () => {
      const packagejson = editJsonFile(path.resolve(process.cwd(), 'package.json'))

      packagejson.set('scripts.commit', 'cz')
      packagejson.save()
    }
  }
}

class HuskyGenerator extends Generate {
  constructor() {
    super()
    let huskyshell = ''
    if (this.packagePrefix === 'npm install ') {
      huskyshell = 'npx husky-init && npm install'
    }
    else if (this.packagePrefix === 'yarn add ') {
      huskyshell = 'yarn dlx husky-init --yarn2 && yarn'

      if (global.carry.isYarnOne)
        huskyshell = 'npx husky-init && yarn'
    }
    else {
      huskyshell = 'pnpm dlx husky-init && pnpm install'
    }
    this.shells.push(...[huskyshell])
  }
}

class LintstagedGenerator extends Generate {
  constructor() {
    super()

    this.shells.push(...[`${this.packagePrefix}-D lint-staged@11.2.2`])

    this.postFunc = async () => {
      const file = path.resolve(process.cwd(), '.husky/pre-commit')

      await fs.ensureFile(file)

      fs.appendFileSync(file, 'npx --no-install lint-staged')

      const packagejson = editJsonFile(path.resolve(process.cwd(), 'package.json'))
      packagejson.set('lint-staged.*', 'eslint --fix')
      packagejson.set('scripts.test', 'echo \"Test: no test specified\"')
      packagejson.save()
    }
  }
}

class CommitlintGenerator extends Generate {
  constructor() {
    super()

    this.files.push(...['commitlint.config.js'])

    this.shells.push(...[
      `${this.packagePrefix}-D @commitlint/config-conventional @commitlint/cli`,
      'npx husky add .husky/commit-msg "npx --no -- commitlint --edit ${1}"'])
  }
}

const presetGensMapping = {
  eslint: EslitGenerator,
  editorconfig: EditorGenerator,
  stylelint: StylelintGenerator,
  markdownlint: MarkdownlintGenerator,
  prettier: PrettierGenerator,
  commitizen: CommitizenGenerator,
  husky: HuskyGenerator,
  lintstaged: LintstagedGenerator,
  commitlint: CommitlintGenerator,
  cherry: '',
}


module.exports = presetGensMapping

