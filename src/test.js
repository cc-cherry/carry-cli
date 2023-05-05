#!/usr/bin/env node
const fs = require('fs-extra')

fs.ensureFile('../.xx/text', (err) => {
  console.log(err)
})
