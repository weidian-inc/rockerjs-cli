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
const ini_1 = require("ini");
const ejs_1 = require("ejs");
const fs_extra_1 = require("fs-extra");
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
fs_extra_1.ensureDirSync(typesPath);
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
            configEnv ? (CONFIG_TABLE[configEnv] ? Object.assign(CONFIG_TABLE[configEnv], ini_1.parse(fs.readFileSync(fpath, "utf-8"))) : CONFIG_TABLE[configEnv] = ini_1.parse(fs.readFileSync(fpath, "utf-8")))
                : (CONFIG_TABLE[ENV.PROD] ? Object.assign(CONFIG_TABLE[ENV.PROD], ini_1.parse(fs.readFileSync(fpath, "utf-8"))) : CONFIG_TABLE[ENV.PROD] = ini_1.parse(fs.readFileSync(fpath, "utf-8")));
        });
        return CONFIG_TABLE;
    });
}
function generate() {
    let finalConfig = {}, items = [], filters = [];
    Object.keys(CONFIG_TABLE).forEach((env) => {
        finalConfig = lodash_1.defaultsDeep(finalConfig, CONFIG_TABLE[env]);
    });
    let template = ejs_1.compile(fs.readFileSync(path.join(__dirname, "class.tmpl"), "utf8"), null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QiwyQ0FBaUM7QUFDakMsNkJBQTRCO0FBQzVCLDZCQUE4QjtBQUM5Qix1Q0FBd0M7QUFDeEMsbUNBQXFDO0FBRXJDLE1BQU0sVUFBVSxHQUFHLDZCQUE2QixDQUFDO0FBQ2pELE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUN4QixNQUFNLEdBQUcsR0FBRztJQUNSLEdBQUcsRUFBRSxLQUFLO0lBQ1YsS0FBSyxFQUFFLE9BQU87SUFDZCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0NBQ2YsQ0FBQztBQUNGLE1BQU0sVUFBVSxHQUFHLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQztBQUMvQixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUNwRCx3QkFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBRXhCLFNBQVMsZUFBZSxDQUFDLFFBQWdCO0lBQ3JDLE9BQU8sb0JBQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVMsR0FBRztRQUN2QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUN6QixRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxPQUFPLFFBQVEsS0FBSyxjQUFjLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQzdGLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ2Ys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