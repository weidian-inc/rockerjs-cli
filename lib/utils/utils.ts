import * as runScript from 'runScript'
export function isProduction() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv) {
        return serverEnv !== 'local' && serverEnv !== 'unittest';
    }
    return serverEnv === 'production' || serverEnv === 'prod';
}

export function isDev() {
    const serverEnv = process.env.NODE_ENV;
    if(serverEnv == 'local' || serverEnv == 'dev' || !serverEnv){
        return true;
    }else{
        return false
    }
}

export async function findNodeProcess(filterFn){
    const isWin = process.platform === 'win32'
    const REGEX = isWin ? /^(.*)\s+(\d+)\s*$/ : /^\s*(\d+)\s+(.*)/
    const command = isWin ? 'wmic Path win32_process Where "Name = \'node.exe\'" Get CommandLine,ProcessId' : 'ps -eo "pid,args"'
    const stdio = await runScript(command, { stdio: 'pipe' })
    const processList = stdio.stdout.toString().split('\n')
        .reduce((arr, line) => {
        if (!!line && !line.includes('/bin/sh')) {
            const m = line.match(REGEX)
            if (m) {
                const item = isWin ? { pid: m[2], cmd: m[1] } : { pid: m[1], cmd: m[2] }
                console.log('item', item);
                if (!filterFn || filterFn(item)) {
                    arr.push(item)
                }
            }
        }
        return arr;
        }, [])
    return processList;
}