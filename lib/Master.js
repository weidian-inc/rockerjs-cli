"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
const logManager_1 = require("./utils/logManager");
const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const utils_1 = require("../lib/utils/utils");
const watch_1 = require("./gen/watch");
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
                options['count'] = options['instances'];
            }
            catch (e) {
                console.error('File ' + file_path + ' not found:', e);
                process.exit(1);
            }
        }
        else {
            options['count'] = commander.instances;
            options['exec'] = exec;
            const pkgInfo = require(path.join(process.cwd(), 'package.json'));
            process.title = options['name'] = `rocker-server-${pkgInfo.name}`;
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
    readLog(name) {
        const logPath = path.resolve(process.env.HOME, './.rocker_config');
        const files = fs.readdirSync(logPath);
        const logPaths = [];
        files.map(file => {
            if (file.replace('.json', '') == name || !name || name == 'all') {
                let config = JSON.parse(fs.readFileSync(path.resolve(logPath, file), { encoding: 'utf8' }));
                logPaths.push(config.out_file);
                logPaths.push(config.error_file);
            }
        });
        logPaths.map(log => {
            let chunk = '', arr = [];
            let fd = fs.createReadStream(log, { start: 10, autoClose: false });
            fd.on('data', data => {
                chunk += data.toString();
            });
            fd.on('end', () => {
                arr = chunk.split('\n');
                console.log('chunk', chunk);
            });
        });
    }
}
exports.Master = Master;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFzdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTWFzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQWtDO0FBQ2xDLG1EQUErQztBQUMvQyx5QkFBd0I7QUFDeEIsNkJBQTRCO0FBQzVCLGdDQUErQjtBQUMvQiw4Q0FBMEM7QUFDMUMsdUNBQXNDO0FBRXRDLE1BQWEsTUFBTTtJQUVmO1FBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUE7SUFDeEUsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLEVBQUUsU0FBUztRQUNoQixJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sR0FBRyxFQUFFLENBQUE7UUFDdEMsSUFBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFDO1lBQ3BCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDeEMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3BFLElBQUk7Z0JBQ0YsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO2dCQUMzRCxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDL0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtnQkFDbkMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENB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