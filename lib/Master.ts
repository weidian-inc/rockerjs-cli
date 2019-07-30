import { Client }  from './Client'
import { setLogger }  from './utils/logManager'
import * as fs from 'fs'
import * as path from 'path'
import { isDev } from '../lib/utils/utils'
import watchAppConf from './gen/watch'

export class Master {
    constructor(){}

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
            process.title = options['name'] = `node ${path.resolve(process.cwd(), exec || '.index.js')}`
        }
        this.initClient(options)
    }

    initClient(options){
        setLogger(options)
        const client = new Client({ options })
        process.on('uncaughtException', err => {
            console.log('uncaughtException', err)
            client.onReload()
        });
        process.on('unhandledRejection', (reason, p) => {
            console.log('unhandledRejection:', p, '原因：', reason)
            client.onReload()
        })
        this.gen()
    }

    gen(){
        if(isDev()){
            watchAppConf()
        }
    }

}