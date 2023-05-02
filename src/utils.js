const { detect } = require('detect-package-manager')

async function getPkg() {
  return await detect()
}

module.exports = {
  getPkg,
}
