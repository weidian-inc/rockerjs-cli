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
const Client_1 = require("./Client");
const logManager_1 = require("./utils/logManager");
const fs = require("fs");
const path = require("path");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../lib/utils/utils");
const watch_1 = require("./gen/watch");
const shelljs_1 = require("shelljs");
const Table = require("cli-table-redemption");
class Master {
    constructor() {
        this.configPath = path.resolve(process.env.HOME, './.rocker_config');
    }
    start(cmd, commander) {
        let filePath = cmd && cmd[0], options = {};
        if (filePath.match(/\.json/)) {
            const isAbsolute = path.isAbsolute(filePath);
            const file_path = isAbsolute ? filePath : path.join(process.cwd(), filePath);
            try {
                options = JSON.parse(fs.readFileSync(file_path).toString());
                process.title = options['name'];
                options['exec'] = options['script'];
            }
            catch (e) {
                console.error('File ' + file_path + ' not found:', e);
                process.exit(1);
            }
        }
        else {
            options['instances'] = commander.instances;
            options['exec'] = filePath;
            const pkgInfo = require(path.join(process.cwd(), 'package.json'));
            process.title = options['name'] = `rocker-server-${pkgInfo.name}`;
            const defaultLogPath = path.resolve(process.env.HOME, './rocker_logs');
            fs_extra_1.ensureDirSync(defaultLogPath);
            options['out_file'] = path.resolve(defaultLogPath, './stdout.log');
            options['error_file'] = path.resolve(defaultLogPath, './stderr.log');
        }
        options['exec'] = path.resolve(process.cwd(), options['exec'] || './test/app.js');
        this.initClient(options);
    }
    initClient(options) {
        logManager_1.setLogger(options);
        const client = new Client_1.Client(options);
        process.on('uncaughtException', err => {
            console.log('uncaughtException', err);
            client.onReload();
        });
        process.on('unhandledRejection', (reason, p) => {
            console.log('unhandledRejection:', p, '原因：', reason);
            client.onReload();
        });
        this.writeConfigFile(options);
        this.gen();
    }
    gen() {
        if (utils_1.isDev()) {
            watch_1.default();
        }
    }
    writeConfigFile(options) {
        fs_extra_1.ensureDirSync(this.configPath);
        fs.writeFile(path.resolve(this.configPath, `./${options.name}.json`), JSON.stringify(options), err => {
            console.log('err', err);
        });
    }
    getConfig(name) {
        const logPath = path.resolve(process.env.HOME, './.rocker_config');
        const files = fs.readdirSync(logPath);
        const configs = [];
        files.map(file => {
            if (file.replace('.json', '') == name || !name || name == 'all') {
                let config = JSON.parse(fs.readFileSync(path.resolve(logPath, file), { encoding: 'utf8' }));
                configs.push(config);
            }
        });
        return configs;
    }
    readLog(name) {
        const configs = this.getConfig(name);
        const logPaths = [];
        configs.map(config => {
            logPaths.push(config.out_file);
            logPaths.push(config.error_file);
        });
        logPaths.map(log => {
            shelljs_1.exec(`tail -fn 20 ${log}`, { silent: false }, (stdout, stderr) => { console.log(stdout, stderr); });
        });
    }
    getProcessList(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = this.getConfig(name);
            const names = [];
            configs.map(config => {
                names.push(config.name);
            });
            let processList = yield utils_1.findNodeProcess(names);
            processList = processList.map(item => {
                configs.map(config => {
                    if (item.name == config.name) {
                        item = Object.assign(item, config);
                    }
                });
                return item;
            });
            return processList;
        });
    }
    kill(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const processList = yield this.getProcessList(name);
            const pids = processList.map(item => item.pid);
            if (pids) {
                shelljs_1.exec(`kill ${pids.join(' ')}`, {
                    silent: false
                }, (stdout, stderr) => {
                    if (stderr) {
                        console.log('stderr', stderr);
                    }
                    else {
                        console.log('kill success!');
                    }
                });
            }
        });
    }
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            const processList = yield this.getProcessList();
            const table = new Table({
                head: ['pid', 'name', 'instances', 'execFile', 'logFile']
            });
            processList.map(item => {
                table.push([item.pid, item.name, item.instances, item.exec, item.out_file]);
            });
            console.log(table.toString());
        });
    }
}
exports.Master = Master;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFzdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTWFzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxxQ0FBa0M7QUFDbEMsbURBQStDO0FBQy9DLHlCQUF3QjtBQUN4Qiw2QkFBNEI7QUFDNUIsdUNBQXdDO0FBQ3hDLDhDQUEyRDtBQUMzRCx1Q0FBc0M7QUFDdEMscUNBQThCO0FBQzlCLDhDQUE2QztBQUU3QyxNQUFhLE1BQU07SUFFZjtRQUNJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO0lBQ3hFLENBQUM7SUFFRCxLQUFLLENBQUMsR0FBYSxFQUFFLFNBQWM7UUFDL0IsSUFBSSxRQUFRLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEdBQUcsRUFBRSxDQUFBO1FBQzFDLElBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBQztZQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQzVDLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUM1RSxJQUFJO2dCQUNGLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtnQkFDM0QsT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7Z0JBQy9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7YUFDcEM7WUFBQyxPQUFN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