"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const sb_scandir_1 = require("sb-scandir");
const ini = require("ini");
const ejs = require("ejs");
const fse = require("fs-extra");
const lodash_1 = require("lodash");
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
let typesPath = path.resolve(process.cwd(), 'types');
fse.ensureDirSync(typesPath);
function parseConfigFile(rootPath) {
    return sb_scandir_1.default(rootPath, true, function (pth) {
        const stat = fs.statSync(pth), baseName = path.basename(pth);
        return baseName !== "node_modules" && (baseName.match(CONFIG_REG) || stat.isDirectory());
    }).then((result) => {
        // config file in ascending order, like app.daily.config < app.dev.config < app.pre.config < app.prod.config < properties.config
        // so, kv pairs in properties.config have the highest priority  
        result.files.sort((a, b) => {
            const aBaseName = path.basename(a), bBaseName = path.basename(b);
            return aBaseName > bBaseName;
        });
        result.files.forEach((fpath) => {
            const baseName = path.basename(fpath);
            const matchArray = baseName.match(CONFIG_REG), configEnv = matchArray && matchArray[1];
            configEnv ? (CONFIG_TABLE[configEnv] ? Object.assign(CONFIG_TABLE[configEnv], ini.parse(fs.readFileSync(fpath, "utf-8"))) : CONFIG_TABLE[configEnv] = ini.parse(fs.readFileSync(fpath, "utf-8")))
                : (CONFIG_TABLE[ENV.PROD] ? Object.assign(CONFIG_TABLE[ENV.PROD], ini.parse(fs.readFileSync(fpath, "utf-8"))) : CONFIG_TABLE[ENV.PROD] = ini.parse(fs.readFileSync(fpath, "utf-8")));
        });
        return CONFIG_TABLE;
    });
}
function generate() {
    let finalConfig = {}, items = [], filters = [];
    Object.keys(CONFIG_TABLE).forEach((env) => {
        finalConfig = lodash_1.defaultsDeep(finalConfig, CONFIG_TABLE[env]);
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
        }
        else {
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
process.on("unhandledRejection", (e, b) => {
    console.log(e, b);
});
function default_1() {
    return __awaiter(this, void 0, void 0, function* () {
        yield parseConfigFile(process.cwd());
        generate();
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QiwyQ0FBaUM7QUFDakMsMkJBQTJCO0FBQzNCLDJCQUEyQjtBQUMzQixnQ0FBK0I7QUFDL0IsbUNBQXFDO0FBRXJDLE1BQU0sVUFBVSxHQUFHLDZCQUE2QixDQUFDO0FBQ2pELE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUN4QixNQUFNLEdBQUcsR0FBRztJQUNSLEdBQUcsRUFBRSxLQUFLO0lBQ1YsS0FBSyxFQUFFLE9BQU87SUFDZCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0NBQ2YsQ0FBQztBQUNGLE1BQU0sVUFBVSxHQUFHLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztBQUMvQixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUNwRCxHQUFHLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBRTVCLFNBQVMsZUFBZSxDQUFDLFFBQWdCO0lBQ3JDLE9BQU8sb0JBQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVMsR0FBRztRQUN2QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUN6QixRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxPQUFPLFFBQVEsS0FBSyxjQUFjLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQzdGLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxF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