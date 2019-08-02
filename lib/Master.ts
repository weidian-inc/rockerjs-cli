import { Client }  from './Client'
import { setLogger }  from './utils/logManager'
import * as fs from 'fs'
import * as path from 'path'
import * as fse from 'fs-extra'
import { isDev, findNodeProcess } from '../lib/utils/utils'
import watchAppConf from './gen/watch'
import * as shell from 'shelljs'

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
            } catch(e) {
              console.error('File ' + file_path +' not found:', e)
              process.exit(1)
            }
        }else{
            options['instances'] = commander.instances
            options['exec'] = exec

            const pkgInfo = require(path.join(process.cwd(), 'package.json'));
            process.title = options['name'] = `rocker-server-${pkgInfo.name}`

            const defaultLogPath = path.resolve(process.env.HOME, './rocker_logs')
            fse.ensureDirSync(defaultLogPath)
            options['out_file'] = path.resolve(defaultLogPath, './stdout.log')
            options['error_file'] = path.resolve(defaultLogPath, './stderr.log')
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

    getConfig(name){
        const logPath = path.resolve(process.env.HOME, './.rocker_config')
        const files = fs.readdirSync(logPath)
        const configs = []
        files.map( file => {
            if(file.replace('.json', '') == name || !name || name == 'all'){
                let config = JSON.parse(fs.readFileSync( path.resolve(logPath, file), { encoding: 'utf8' }))
                configs.push(config)
                
            }
        })
        return configs
    }

    readLog(name){
        const configs = this.getConfig(name)
        const logPaths = []
        configs.map( config => {
            logPaths.push(config.out_file)
            logPaths.push(config.error_file)
        })
        logPaths.map( log =>{
            shell.exec(`tail -fn 20 ${log}`, {silent:false}, (stdout, stderr)=>{console.log(stdout,stderr)})
            // let size = Math.max(0, fs.statSync(log).size - (20 * 200));
            // let fd = fs.createReadStream( log, { start: size, autoClose: false })
            // fd.on('data', data => {
            //     console.log('chunk', data.toString())
            // })
            // fd.on('end', ()=>{
            //     console.log('end');
            // })
        })
    }

    async kill(name){
        const configs = this.getConfig(name)
        const names = []
        configs.map( config => {
            names.push(config.name)
        })
        const process = await findNodeProcess(item => names.includes(item.cmd.replace(/(^\s*)|(\s*$)/g, "")))
        const pids = process.map( item => item.pid )
        if(pids){
            shell.exec(`kill ${pids.join(' ')}`, {
                silent: false
            }, (stdout, stderr) => {
                console.log(stdout, stderr)
            })
        }
    }
}