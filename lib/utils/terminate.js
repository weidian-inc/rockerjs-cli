'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sleep = require('mz-modules/sleep');
const awaitEvent = require('await-event');
const pstree = require('ps-tree');
function default_1(subProcess, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const pid = subProcess.process ? subProcess.process.pid : subProcess.pid;
        const childPids = yield getChildPids(pid);
        yield [
            killProcess(subProcess, timeout),
            killChildren(childPids, timeout),
        ];
    });
}
exports.default = default_1;
;
// kill process, if SIGTERM not work, try SIGKILL
function killProcess(subProcess, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        subProcess.kill('SIGTERM');
        yield Promise.race([
            awaitEvent(subProcess, 'exit'),
            sleep(timeout),
        ]);
        if (subProcess.killed)
            return;
        // SIGKILL: http://man7.org/linux/man-pages/man7/signal.7.html
        // worker: https://github.com/nodejs/node/blob/master/lib/internal/cluster/worker.js#L22
        // subProcess.kill is wrapped to subProcess.destroy, it will wait to disconnected.
        (subProcess.process || subProcess).kill('SIGKILL');
    });
}
// kill all children processes, if SIGTERM not work, try SIGKILL
function killChildren(children, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!children.length)
            return;
        kill(children, 'SIGTERM');
        const start = Date.now();
        // if timeout is 1000, it will check twice.
        const checkInterval = 400;
        let unterminated = [];
        while (Date.now() - start < timeout - checkInterval) {
            yield sleep(checkInterval);
            unterminated = getUnterminatedProcesses(children);
            if (!unterminated.length)
                return;
        }
        console.log('unterminated', unterminated);
        kill(unterminated, 'SIGKILL');
    });
}
function getChildPids(pid) {
    return new Promise(resolve => {
        pstree(pid, (err, children) => {
            if (err)
                children = [];
            resolve(children.map(children => parseInt(children.PID)));
        });
    });
}
function kill(pids, signal) {
    for (const pid of pids) {
        try {
            process.kill(pid, signal);
        }
        catch (e) {
            // ignore
        }
    }
}
function getUnterminatedProcesses(pids) {
    return pids.filter(pid => {
        try {
            // success means it's still alive
            process.kill(pid, 0);
            return true;
        }
        catch (err) {
            // error means it's dead
            return false;
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVybWluYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7OztBQUViLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMxQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFbEMsbUJBQStCLFVBQVUsRUFBRSxPQUFPOztRQUNoRCxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztRQUN6RSxNQUFNLFNBQVMsR0FBRyxNQUFNLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxQyxNQUFNO1lBQ0osV0FBVyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUM7WUFDaEMsWUFBWSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUM7U0FDakMsQ0FBQTtJQUNILENBQUM7Q0FBQTtBQVBELDRCQU9DO0FBQUEsQ0FBQztBQUVGLGlEQUFpRDtBQUNqRCxTQUFlLFdBQVcsQ0FBQyxVQUFVLEVBQUUsT0FBTzs7UUFDNUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzQixNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDakIsVUFBVSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUM7WUFDOUIsS0FBSyxDQUFDLE9BQU8sQ0FBQztTQUNmLENBQUMsQ0FBQztRQUNILElBQUksVUFBVSxDQUFDLE1BQU07WUFBRSxPQUFPO1FBQzlCLDhEQUE4RDtRQUM5RCx3RkFBd0Y7UUFDeEYsa0ZBQWtGO1FBQ2xGLENBQUMsVUFBVSxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckQsQ0FBQztDQUFBO0FBRUQsZ0VBQWdFO0FBQ2hFLFNBQWUsWUFBWSxDQUFDLFFBQVEsRUFBRSxPQUFPOztRQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU07WUFBRSxPQUFPO1FBQzdCLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLDJDQUEyQztRQUMzQyxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUM7UUFDMUIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBRXRCLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxPQUFPLEdBQUcsYUFBYSxFQUFFO1lBQ25ELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzNCLFlBQVksR0FBRyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU07Z0JBQUUsT0FBTztTQUNsQztRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUFBO0FBRUQsU0FBUyxZQUFZLENBQUMsR0FBRztJQUN2QixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzNCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxHQUFHO2dCQUFFLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNO0lBQ3hCLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1FBQ3RCLElBQUk7WUFDRixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMzQjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsU0FBUztTQUNWO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsU0FBUyx3QkFBd0IsQ0FBQyxJQUFJO0lBQ3BDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN2QixJQUFJO1lBQ0YsaUNBQWlDO1lBQ2pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLHdCQUF3QjtZQUN4QixPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIn0=