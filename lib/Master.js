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
const fse = require("fs-extra");
const utils_1 = require("../lib/utils/utils");
const watch_1 = require("./gen/watch");
const shell = require("shelljs");
class Master {
    constructor() {
        this.configPath = path.resolve(process.env.HOME, './.rocker_config');
    }
    start(cmd, commander) {
        let exec = cmd && cmd[0], options = {};
        if (exec.match(/\.json/)) {
            const isAbsolute = path.isAbsolute(exec);
            const file_path = isAbsolute ? exec : path.join(process.cwd(), exec);
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
            options['exec'] = exec;
            const pkgInfo = require(path.join(process.cwd(), 'package.json'));
            process.title = options['name'] = `rocker-server-${pkgInfo.name}`;
            const defaultLogPath = path.resolve(process.env.HOME, './rocker_logs');
            fse.ensureDirSync(defaultLogPath);
            options['out_file'] = path.resolve(defaultLogPath, './stdout.log');
            options['error_file'] = path.resolve(defaultLogPath, './stderr.log');
        }
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
        fse.ensureDirSync(this.configPath);
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
            // shell.exec(`tail -f ${log}`, {silent:false}, (stdout, stderr)=>{console.log(stdout,stderr)})
            let size = Math.max(0, fs.statSync(log).size - (20 * 200));
            let fd = fs.createReadStream(log, { start: size, autoClose: false });
            fd.on('data', data => {
                console.log('chunk', data.toString());
            });
            fd.on('end', () => {
                console.log('end');
            });
        });
    }
    kill(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = this.getConfig(name);
            const names = [];
            configs.map(config => {
                names.push(config.name);
            });
            const process = yield utils_1.findNodeProcess(item => names.includes(item.cmd.replace(/(^\s*)|(\s*$)/g, "")));
            const pids = process.map(item => item.pid);
            if (pids) {
                shell.exec(`kill ${pids.join(' ')}`, {
                    silent: false
                }, (stdout, stderr) => {
                    console.log(stdout, stderr);
                });
            }
        });
    }
}
exports.Master = Master;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFzdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTWFzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxxQ0FBa0M7QUFDbEMsbURBQStDO0FBQy9DLHlCQUF3QjtBQUN4Qiw2QkFBNEI7QUFDNUIsZ0NBQStCO0FBQy9CLDhDQUEyRDtBQUMzRCx1Q0FBc0M7QUFDdEMsaUNBQWdDO0FBRWhDLE1BQWEsTUFBTTtJQUVmO1FBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUE7SUFDeEUsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLEVBQUUsU0FBUztRQUNoQixJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sR0FBRyxFQUFFLENBQUE7UUFDdEMsSUFBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFDO1lBQ3BCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDeEMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3BFLElBQUk7Z0JBQ0YsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO2dCQUMzRCxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDL0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUNwQztZQUFDLE9BQU0sQ0FBQyxFQUFFO2dC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