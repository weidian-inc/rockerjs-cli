import * as path from "path";
import * as fs from "fs";
import scandir from "sb-scandir";
import * as ini from "ini";
import * as ejs from "ejs";
import * as fse from "fs-extra"

const CONFIG_REG = /^app\.(?:(\w+?)\.)?config$/i;
const CONFIG_TABLE = {};
const ENV = {
    DEV: "dev",
    DAILY: "daily",
    PRE: "pre",
    PROD: "prod",
};
const excludeKey = ["port", "excludesDir"];
const filterPrefix = "filter:";
let typesPath = path.resolve(process.cwd(), 'types')
fse.ensureDirSync(typesPath)

function parseConfigFile(rootPath: string) {
    return scandir(rootPath, true, function(pth) {
        const stat = fs.statSync(pth),
            baseName = path.basename(pth);
        return baseName !== "node_modules" && (baseName.match(CONFIG_REG) || stat.isDirectory());
    }).then((result) => {
        // config file in ascending order, like app.daily.config < app.dev.config < app.pre.config < app.prod.config < properties.config
        // so, kv pairs in properties.config have the highest priority  
        result.files.sort((a, b) => {
            const aBaseName = path.basename(a),
            bBaseName = path.basename(b);
            return aBaseName > bBaseName;
        });
        result.files.forEach((fpath: string) => {
            const baseName = path.basename(fpath);
            const matchArray = baseName.match(CONFIG_REG),
            configEnv = matchArray && matchArray[1];
            configEnv ? (CONFIG_TABLE[configEnv] ? Object.assign(CONFIG_TABLE[configEnv], ini.parse(fs.readFileSync(fpath, "utf-8"))) : CONFIG_TABLE[configEnv] = ini.parse(fs.readFileSync(fpath, "utf-8")))
                : (CONFIG_TABLE[ENV.PROD] ? Object.assign(CONFIG_TABLE[ENV.PROD], ini.parse(fs.readFileSync(fpath, "utf-8"))) : CONFIG_TABLE[ENV.PROD] = ini.parse(fs.readFileSync(fpath, "utf-8")));
        });
        return CONFIG_TABLE;
    });
}

function generate() {
    let finalConfig = {}, items = [], filters = [];
    Object.keys(CONFIG_TABLE).forEach((env) => {
        finalConfig = Object.assign(finalConfig, CONFIG_TABLE[env]);
    });
    let template = ejs.compile(fs.readFileSync(path.join(__dirname, "class.tmpl"), "utf8"), null);

    Object.keys(finalConfig).forEach((key) => {
        if (excludeKey.includes(key)) {
            return;
        }
        const props = [];
        Object.keys(finalConfig[key]).forEach((prop) => {
            props.push({
                key: prop,
                type: typeof finalConfig[key][prop]
            });
        });
        if (key.indexOf(filterPrefix) !== -1) {
            const tmpKey = key.slice(filterPrefix.length);
            filters.push({
                className: tmpKey.substring(0, 1).toUpperCase() + tmpKey.substring(1),
                props
            });
        } else {
            items.push({
                className: key.substring(0, 1).toUpperCase() + key.substring(1),
                props
            });
        }
    });

    items = filters.concat(items);

    let ret = template({
        items
    });
    fs.writeFileSync(path.join(typesPath, 'app.config.d.ts'), ret);
}

process.on("unhandledRejection", (e,b) =>{
    console.log(e,b)
});

export default async function(){
    await parseConfigFile(process.cwd());
    generate()
}