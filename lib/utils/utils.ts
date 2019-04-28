export function isProduction() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv) {
        return serverEnv !== 'local' && serverEnv !== 'unittest';
    }
    return process.env.NODE_ENV === 'production';
}
