const inquirer = require('inquirer')
const download = require('download-git-repo');

(async () => {
  const answ = await getProjType()
  console.log(answ)

  download('cc-cherry/cc-cherry#main', './temlpates', (err) => {
    if (err)
      console.error(err)

    else
      console.log('模板下载成功！')
  })

  function getProjType() {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称：',
      },
      {
        type: 'list',
        name: 'projectType',
        message: '请选择项目类型：',
        choices: ['web', 'node'],
      },
    ])
  }
})()
