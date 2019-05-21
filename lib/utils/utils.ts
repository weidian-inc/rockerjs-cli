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