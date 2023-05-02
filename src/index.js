const cli = require('./cli')
const generator = require('./generator');

(async () => {
  // const res = await cli()
  // await generator(res.preset)

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
  await generator(['eslint'])
})()
