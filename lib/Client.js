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
const path = require("path");
const cfork = require("cfork");
const EventEmitter = require("events");
const cluster = require("cluster");
const fs = require("fs");
const manager_1 = require("./utils/manager");
const terminate_1 = require("./utils/terminate");
const utils_1 = require("./utils/utils");
class Client extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.isProduction = utils_1.isProduction();
        this.workerManager = new manager_1.Manager();
        // https://nodejs.org/api/process.html#process_signal_events
        // https://en.wikipedia.org/wiki/Unix_signal
        // kill(2) Ctrl-C
        process.once('SIGINT', this.onSignal.bind(this, 'SIGINT'));
        // kill(3) Ctrl-\
        process.once('SIGQUIT', this.onSignal.bind(this, 'SIGQUIT'));
        // kill(15) default
        process.once('SIGTERM', this.onSignal.bind(this, 'SIGTERM'));
        this.forkAppWorkers();
        // exit when worker exception
        this.workerManager.on('exception', ({ worker }) => {
            const err = new Error(`${worker} worker(s) alive, exit to avoid unknown state`);
            err.name = 'ClusterWorkerExceptionError';
            err['count'] = { worker };
            console.error(err);
            process.exit(1);
        });
    }
    // startMasterSocketServer(cb) {
    //   // Create the outside facing server listening on our port.
    //   require('net').createServer({ pauseOnConnect: true }, connection => {
    //     // worker. Get the worker for this connection's source IP and pass
    //     if (!connection.remoteAddress) {
    //       connection.destroy();
    //     } else {
    //       const worker = this.stickyWorker(connection.remoteAddress);
    //       worker.send('sticky-session:connection', connection);
    //     }
    //   }).listen(this.options.port, cb);
    // }
    // stickyWorker(ip: string) {
    //   const workerNumbers = this.options.instances;
    //   const ws = this.workerManager.listWorkerIds();
    //   let s:any = '';
    //   for (let i = 0; i < ip.length; i++) {
    //     if (!isNaN(ip[i])) {
    //       s += ip[i];
    //     }
    //   }
    //   s = Number(s);
    //   const pid = ws[s % workerNumbers];
    //   return this.workerManager.getWorker(pid);
    // }
    forkAppWorkers() {
        this.appStartTime = Date.now();
        this.isAllAppWorkerStarted = false;
        this.startSuccessCount = 0;
        const args = [JSON.stringify(this.options)];
        console.log('start appWorker with args %j', args);
        cfork({
            exec: this.getAppWorkerFile(),
            args,
            silent: true,
            stdio: [0, 'ipc', 'ipc'],
            count: this.options.instances,
            refork: this.isProduction
        });
        cluster.on('fork', worker => {
            worker['disableRefork'] = true;
            this.workerManager.setWorker(worker);
            worker.process.stdout.on('data', (msg) => {
                console.log(`[worker](${worker.process.pid})`, msg.toString());
            });
            worker.process.stderr.on('data', (err) => {
                console.error(`[worker](${worker.process.pid})`, err.toString());
            });
            console.log('app_worker#%s:%s start, state: %s, current workers: %j', worker.id, worker.process.pid, worker['state'], Object.keys(cluster.workers));
        });
        cluster.on('disconnect', worker => {
            console.log('app_worker#%s:%s disconnect, suicide: %s, state: %s, current workers: %j', worker.id, worker.process.pid, worker.exitedAfterDisconnect, worker['state'], Object.keys(cluster.workers));
        });
        cluster.on('exit', (worker, code, signal) => {
            console.log('exit');
        });
    }
    killAppWorkers(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            let arr = [];
            for (const id in cluster.workers) {
                const worker = cluster.workers[id];
                worker['disableRefork'] = true;
                arr.push(terminate_1.default(worker, timeout));
            }
            yield Promise.all(arr);
            return arr;
        });
    }
    onAppExit(data) {
        if (this.closed)
            return;
        const worker = this.workerManager.getWorker(data.workerPid);
        // remove all listeners to avoid memory leak
        worker.removeAllListeners();
        this.workerManager.deleteWorker(data.workerPid);
        console.log('app_worker#%s:%s start fail, exiting with code:1', worker.id, worker.process.pid);
        process.exit(1);
    }
    onAppStart(data) {
        const worker = this.workerManager.getWorker(data.workerPid);
        const address = data.address;
        this.startSuccessCount++;
        const remain = this.isAllAppWorkerStarted ? 0 : this.options.instances - this.startSuccessCount;
        console.log('app_worker#%s:%s started at %s, remain %s (%sms)', worker.id, data.workerPid, address.port, remain, Date.now() - this.appStartTime);
        // if app is started, it should enable this worker
        if (this.isAllAppWorkerStarted) {
            worker.disableRefork = false;
        }
        if (this.isAllAppWorkerStarted || this.startSuccessCount < this.options.instances) {
            return;
        }
        this.isAllAppWorkerStarted = true;
        // enable all workers when app started
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            worker['disableRefork'] = false;
        }
        address.protocal = this.options.https ? 'https' : 'http';
        address.port = this.options.sticky ? this.options.port : address.port;
    }
    onExit(code) {
        console.log('exit with code:%s', code);
    }
    onSignal(signal) {
        console.log('signal', signal);
        if (this.closed)
            return;
        console.log('receive signal %s, closing', signal);
        this.close();
    }
    onReload() {
        console.log('reload workers...');
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            worker['isDevReload'] = true;
        }
        require('cluster-reload')(this.options.instances);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.closed = true;
            try {
                console.log('send kill SIGTERM to app workers, will exit with code:0 after 5000 ms');
                yield this.killAppWorkers(5000);
                this.rmConfigFile();
                console.log('close done, exiting with code:0');
                process.exit(0);
            }
            catch (e) {
                console.error('close with error: ', e);
                process.exit(1);
            }
        });
    }
    getAppWorkerFile() {
        return './lib/entry.js';
    }
    rmConfigFile() {
        const configPath = path.resolve(process.env.HOME, './.rocker_config', `./${this.options.name}.json`);
        fs.unlinkSync(configPath);
    }
}
exports.Client = Client;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7OztBQUNiLDZCQUE0QjtBQUM1QiwrQkFBOEI7QUFDOUIsdUNBQXNDO0FBQ3RDLG1DQUFrQztBQUNsQyx5QkFBd0I7QUFDeEIsNkNBQXlDO0FBQ3pDLGlEQUF5QztBQUN6Qyx5Q0FBNEM7QUFFNUMsTUFBYSxNQUFPLFNBQVEsWUFBWTtJQVd0QyxZQUFZLE9BQVk7UUFDdEIsS0FBSyxFQUFFLENBQUE7UUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLG9CQUFZLEVBQUUsQ0FBQTtRQUNsQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFBO1FBRWxDLDREQUE0RDtRQUM1RCw0Q0FBNEM7UUFDNUMsaUJBQWlCO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFBO1FBQzFELGlCQUFpQjtRQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUM1RCxtQkFBbUI7UUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUE7UUFFNUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBRXJCLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7WUFDaEQsTUFBTSxHQUFHLEdB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