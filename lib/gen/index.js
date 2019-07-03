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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QiwyQ0FBaUM7QUFDakMsMkJBQTJCO0FBQzNCLDJCQUEyQjtBQUMzQixnQ0FBK0I7QUFFL0IsTUFBTSxVQUFVLEdBQUcsNkJBQTZCLENBQUM7QUFDakQsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLE1BQU0sR0FBRyxHQUFHO0lBQ1IsR0FBRyxFQUFFLEtBQUs7SUFDVixLQUFLLEVBQUUsT0FBTztJQUNkLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLE1BQU07Q0FDZixDQUFDO0FBQ0YsTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDM0MsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDO0FBQy9CLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQ3BELEdBQUcsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUE7QUFFNUIsU0FBUyxlQUFlLENBQUMsUUFBZ0I7SUFDckMsT0FBTyxvQkFBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBUyxHQUFHO1FBQ3ZDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQ3pCLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sUUFBUSxLQUFLLGNBQWMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDN0YsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDZixnSUFB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