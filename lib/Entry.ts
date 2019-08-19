const argv = JSON.parse(process.argv[2])
process.title = argv.name + '-' + process.pid
require(argv.exec)