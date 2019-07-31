const argv = JSON.parse(process.argv[2])
process.title = argv.name + '-' + process.pid
import * as path from 'path'
const AppWorkerFilePath = path.resolve(process.cwd(), argv.exec || './test/app.js')
require(AppWorkerFilePath)