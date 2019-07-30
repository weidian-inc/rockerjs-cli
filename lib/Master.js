"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
const logManager_1 = require("./utils/logManager");
const fs = require("fs");
const path = require("path");
const utils_1 = require("../lib/utils/utils");
const watch_1 = require("./gen/watch");
class Master {
    constructor() { }
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
            process.title = options['name'] = `node ${path.resolve(process.cwd(), exec || '.index.js')}`;
        }
        this.initClient(options);
    }
    initClient(options) {
        logManager_1.setLogger(options);
        const client = new Client_1.Client({ options });
        process.on('uncaughtException', err => {
            console.log('uncaughtException', err);
            client.onReload();
        });
        process.on('unhandledRejection', (reason, p) => {
            console.log('unhandledRejection:', p, '原因：', reason);
            client.onReload();
        });
        this.gen();
    }
    gen() {
        if (utils_1.isDev()) {
            watch_1.default();
        }
    }
}
exports.Master = Master;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFzdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTWFzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQWtDO0FBQ2xDLG1EQUErQztBQUMvQyx5QkFBd0I7QUFDeEIsNkJBQTRCO0FBQzVCLDhDQUEwQztBQUMxQyx1Q0FBc0M7QUFFdEMsTUFBYSxNQUFNO0lBQ2YsZ0JBQWMsQ0FBQztJQUVmLEtBQUssQ0FBQyxHQUFHLEVBQUUsU0FBUztRQUNoQixJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sR0FBRyxFQUFFLENBQUE7UUFDdEMsSUFBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFDO1lBQ3BCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDeEMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3BFLElBQUk7Z0JBQ0YsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO2dCQUMzRCxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDL0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtnQkFDbkMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTthQUN4QztZQUFDLE9BQU0sQ0FBQyxFQUFFO2dCQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFNBQVMsR0FBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ3BELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDaEI7U0FDSjthQUFJO1lBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUE7WUFDdEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQTtZQUN0QixPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFBO1NBQy9GO1FBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRUQsVUFBVSxDQUFDLE9BQU87UUFDZCxzQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2xCLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtRQUN0QyxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDckMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDcEQsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3JCLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ2QsQ0FBQztJQUVELEdBQUc7UUFDQyxJQUFHLGFBQUssRUFBRSxFQUFDO1lBQ1AsZUFBWSxFQUFFLENBQUE7U0FDakI7SUFDTCxDQUFDO0NBRUo7QUE3Q0Qsd0JBNkNDIn0=