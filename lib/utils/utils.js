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
const runScript = require("runScript");
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
function findNodeProcess(filterFn) {
    return __awaiter(this, void 0, void 0, function* () {
        const isWin = process.platform === 'win32';
        const REGEX = isWin ? /^(.*)\s+(\d+)\s*$/ : /^\s*(\d+)\s+(.*)/;
        const command = isWin ? 'wmic Path win32_process Where "Name = \'node.exe\'" Get CommandLine,ProcessId' : 'ps -eo "pid,args"';
        const stdio = yield runScript(command, { stdio: 'pipe' });
        const processList = stdio.stdout.toString().split('\n')
            .reduce((arr, line) => {
            if (!!line && !line.includes('/bin/sh')) {
                const m = line.match(REGEX);
                if (m) {
                    const item = isWin ? { pid: m[2], cmd: m[1] } : { pid: m[1], cmd: m[2] };
                    console.log('item', item);
                    if (!filterFn || filterFn(item)) {
                        arr.push(item);
                    }
                }
            }
            return arr;
        }, []);
        return processList;
    });
}
exports.findNodeProcess = findNodeProcess;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsdUNBQXNDO0FBQ3RDLFNBQWdCLFlBQVk7SUFDeEIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDdkMsSUFBSSxTQUFTLEVBQUU7UUFDWCxPQUFPLFNBQVMsS0FBSyxPQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsQ0FBQztLQUM1RDtJQUNELE9BQU8sU0FBUyxLQUFLLFlBQVksSUFBSSxTQUFTLEtBQUssTUFBTSxDQUFDO0FBQzlELENBQUM7QUFORCxvQ0FNQztBQUVELFNBQWdCLEtBQUs7SUFDakIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDdkMsSUFBRyxTQUFTLElBQUksT0FBTyxJQUFJLFNBQVMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUM7UUFDeEQsT0FBTyxJQUFJLENBQUM7S0FDZjtTQUFJO1FBQ0QsT0FBTyxLQUFLLENBQUE7S0FDZjtBQUNMLENBQUM7QUFQRCxzQkFPQztBQUVELFNBQXNCLGVBQWUsQ0FBQyxRQUFROztRQUMxQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQTtRQUMxQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQTtRQUM5RCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLCtFQUErRSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQTtRQUM3SCxNQUFNLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtRQUN6RCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7YUFDbEQsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3JDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQzNCLElBQUksQ0FBQyxFQUFFO29CQUNILE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtvQkFDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzFCLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUM3QixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO3FCQUNqQjtpQkFDSjthQUNKO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWCxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDVixPQUFPLFdBQVcsQ0FBQztJQUN2QixDQUFDO0NBQUE7QUFwQkQsMENBb0JDIn0=