import { execSync } from 'child_process'
export function isProduction() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv) {
        return serverEnv !== 'local' && serverEnv !== 'unittest'
    }
    return serverEnv === 'production' || serverEnv === 'prod'
}

export function isDev() {
    const serverEnv = process.env.NODE_ENV;
    if(serverEnv == 'local' || serverEnv == 'dev' || !serverEnv){
        return true;
    }else{
        return false
    }
}

export function findNodeProcess(names: string[]){
    const ls = execSync('ps -eo "pid,args"')
    const processList = ls.toString().split('\n')
        .reduce((arr, line) => {
        if (!!line && !line.includes('/bin/sh')) {
            const m = line.match(/^\s*(\d+)\s+(.*)/)
            if (m) {
                const item = { pid: m[1], name: m[2].replace(/(^\s*)|(\s*$)/g, "") }
                if(names.includes(item.name)){
                    arr.push(item)
                }
            }
        }
        return arr;
        }, [])
    return processList
}