#!/usr/bin/env node

const { NodeVM } = require('vm2')
const fs = require('fs-extra')
const { Generate } = require('./Generate')

const vm = new NodeVM({
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

// Sync
// const editJsonFilePath = path.resolve(__dirname, 'node_modules/edit-json-file')
// vm.run(`require.resolve.paths.push("${editJsonFilePath}")`)

const data = fs.readFileSync('F:\\stu\\cli\\projs\\generators\\gens.js', { encoding: 'utf8' })
console.log(data)
const pres = vm.run(data)
console.log(pres)
