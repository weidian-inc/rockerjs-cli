import { Client }  from './Client'
import { setLogger }  from './utils/logManager'
import * as fs from 'fs'
import * as path from 'path'
import * as fse from 'fs-extra'
import { isDev } from '../lib/utils/utils'
import watchAppConf from './gen/watch'

export class Master {
    configPath: string
    constructor(){
        this.configPath = path.resolve(process.env.HOME, './.rocker_config')
    }

    start(cmd, commander){
        let exec = cmd && cmd[0], options = {}
        if(exec.match(/\.json/)){
            const isAbsolute = path.isAbsolute(exec)
            const file_path = isAbsolute ? exec : path.join(process.cwd(), exec)
            try {
              options = JSON.parse(fs.readFileSync(file_path).toString())
              process.title = options['name']
              options['exec'] = options['script']
              options['count'] = options['instances']
            } catch(e) {
              console.error('File ' + file_path +' not found:', e)
              process.exit(1)
            }
        }else{
            options['count'] = commander.instances
            options['exec'] = exec
            const pkgInfo = require(path.join(process.cwd(), 'package.json'));
            process.title = options['name'] = `rocker-server-${pkgInfo.name}`
        }
        this.initClient(options)
    }

    initClient(options){
        setLogger(options)
        const client = new Client(options)
        process.on('uncaughtException', err => {
            console.log('uncaughtException', err)
            client.onReload()
        });
        process.on('unhandledRejection', (reason, p) => {
            console.log('unhandledRejection:', p, '原因：', reason)
            client.onReload()
        })
        this.writeConfigFile(options)
        this.gen()
    }

    gen(){
        if(isDev()){
            watchAppConf()
        }
    }

    writeConfigFile(options){
        fse.ensureDirSync(this.configPath)
        fs.writeFile(path.resolve(this.configPath, `./${options.name}.json`), JSON.stringify(options), err => {
            console.log('err', err);
        })
    }

    readLog(name){
        const logPath = path.resolve(process.env.HOME, './.rocker_config')
        const files = fs.readdirSync(logPath)
        const logPaths = []
        files.map( file => {
            if(file.replace('.json', '') == name || !name || name == 'all'){
                let config = JSON.parse(fs.readFileSync( path.resolve(logPath, file), { encoding: 'utf8' }))   
                logPaths.push(config.out_file)
                logPaths.push(config.error_file)
            }
        })
        logPaths.map( log =>{
            let chunk = '', arr = [], size = Math.max(0, fs.statSync(log).size - (20 * 200));
            let fd = fs.createReadStream( log, { start: size, autoClose: false })
            fd.on('data', data => {
                chunk += data.toString()
            })
            fd.on('end', () => {
                arr = chunk.split('\n')
                console.log('chunk', chunk);
            })
        })
    }
}