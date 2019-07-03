const fs = require('fs')
const { Console } = require('console');
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
const logger = new Console(output, errorOutput)
global.console.log = logger.log
global.console.info = logger.info
global.console.warn = logger.warn
global.console.error = logger.error
global.console.time = logger.time
global.console.timeEnd = logger.timeEnd
global.console.trace = logger.trace

console.info('11121212123')