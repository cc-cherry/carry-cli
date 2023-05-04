#!/usr/bin/env node
const { EslitGenerator } = require('./generators/gens')

const eslintGen = new EslitGenerator()

eslintGen.install()
