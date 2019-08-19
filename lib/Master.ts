import { Client }  from './Client'
import { setLogger }  from './utils/logManager'
import * as fs from 'fs'
import * as path from 'path'
import { ensureDirSync } from 'fs-extra'
import { isDev, findNodeProcess } from '../lib/utils/utils'
import watchAppConf from './gen/watch'
import { exec } from 'shelljs'
import * as Table from 'cli-table-redemption'

export class Master {
    configPath: string
    constructor(){
        this.configPath = path.resolve(process.env.HOME, './.rocker_config')
    }

    start(cmd: string[], commander: any){
        let filePath = cmd && cmd[0], options = {}
        if(filePath.match(/\.json/)){
            const isAbsolute = path.isAbsolute(filePath)
            const file_path = isAbsolute ? filePath : path.join(process.cwd(), filePath)
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
            options['exec'] = filePath

            const pkgInfo = require(path.join(process.cwd(), 'package.json'));
            process.title = options['name'] = `rocker-server-${pkgInfo.name}`

            const defaultLogPath = path.resolve(process.env.HOME, './rocker_logs')
            ensureDirSync(defaultLogPath)
            options['out_file'] = path.resolve(defaultLogPath, './stdout.log')
            options['error_file'] = path.resolve(defaultLogPath, './stderr.log')
        }
        options['exec'] = path.resolve(process.cwd(), options['exec'] || './test/app.js')
        this.initClient(options)
    }

    initClient(options: any){
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

    writeConfigFile(options: any){
        ensureDirSync(this.configPath)
        fs.writeFile(path.resolve(this.configPath, `./${options.name}.json`), JSON.stringify(options), err => {
            console.log('err', err);
        })
    }

    getConfig(name?: string){
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

    readLog(name?: string){
        const configs = this.getConfig(name)
        const logPaths = []
        configs.map( config => {
            logPaths.push(config.out_file)
            logPaths.push(config.error_file)
        })
        logPaths.map( log =>{
            exec(`tail -fn 20 ${log}`, {silent:false}, (stdout, stderr)=>{console.log(stdout,stderr)})
        })
    }

    async getProcessList(name?: string){
        const configs = this.getConfig(name)
        const names: string[] = []
        configs.map( config => {
            names.push(config.name)
        })
        let processList = await findNodeProcess(names)
        processList = processList.map( item => {
            configs.map( config => {
                if(item.name == config.name){
                    item = Object.assign(item, config)
                }
            })
            return item
        })
        return processList
    }

    async kill(name?: string){
        const processList = await this.getProcessList(name)
        const pids = processList.map( item => item.pid )
        if(pids){
            exec(`kill ${pids.join(' ')}`, {
                silent: false
            }, (stdout, stderr) => {
                if(stderr){
                    console.log('stderr', stderr)
                }else{
                    console.log('kill success!')
                }
            })
        }
    }

    async list(){
        const processList = await this.getProcessList()
        const table = new Table({
            head: ['pid', 'name', 'instances', 'execFile', 'logFile']
        })
        processList.map( item => {
            table.push([item.pid, item.name, item.instances, item.exec, item.out_file])
        })
        console.log(table.toString())
    }
}