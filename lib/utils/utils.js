"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function isProduction() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv) {
        return serverEnv !== 'local' && serverEnv !== 'unittest';
    }
    return serverEnv === 'production' || serverEnv === 'prod';
}
exports.isProduction = isProduction;
function isDev() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv == 'local' || serverEnv == 'dev' || !serverEnv) {
        return true;
    }
    else {
        return false;
    }
}
exports.isDev = isDev;
function findNodeProcess(names) {
    const ls = child_process_1.execSync('ps -eo "pid,args"');
    const processList = ls.toString().split('\n')
        .reduce((arr, line) => {
        if (!!line && !line.includes('/bin/sh')) {
            const m = line.match(/^\s*(\d+)\s+(.*)/);
            if (m) {
                const item = { pid: m[1], name: m[2].replace(/(^\s*)|(\s*$)/g, "") };
                if (names.includes(item.name)) {
                    arr.push(item);
                }
            }
        }
        return arr;
    }, []);
    return processList;
}
exports.findNodeProcess = findNodeProcess;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUF3QztBQUN4QyxTQUFnQixZQUFZO0lBQ3hCLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0lBQ3ZDLElBQUksU0FBUyxFQUFFO1FBQ1gsT0FBTyxTQUFTLEtBQUssT0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLENBQUE7S0FDM0Q7SUFDRCxPQUFPLFNBQVMsS0FBSyxZQUFZLElBQUksU0FBUyxLQUFLLE1BQU0sQ0FBQTtBQUM3RCxDQUFDO0FBTkQsb0NBTUM7QUFFRCxTQUFnQixLQUFLO0lBQ2pCLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0lBQ3ZDLElBQUcsU0FBUyxJQUFJLE9BQU8sSUFBSSxTQUFTLElBQUksS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFDO1FBQ3hELE9BQU8sSUFBSSxDQUFDO0tBQ2Y7U0FBSTtRQUNELE9BQU8sS0FBSyxDQUFBO0tBQ2Y7QUFDTCxDQUFDO0FBUEQsc0JBT0M7QUFFRCxTQUFnQixlQUFlLENBQUMsS0FBZTtJQUMzQyxNQUFNLEVBQUUsR0FBRyx3QkFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUE7SUFDeEMsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7U0FDeEMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3RCLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDckMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1lBQ3hDLElBQUksQ0FBQyxFQUFFO2dCQUNILE1BQU0sSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFBO2dCQUNwRSxJQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDO29CQUN6QixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2lCQUNqQjthQUNKO1NBQ0o7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNYLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUNWLE9BQU8sV0FBVyxDQUFBO0FBQ3RCLENBQUM7QUFoQkQsMENBZ0JDIn0=