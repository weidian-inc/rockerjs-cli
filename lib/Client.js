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
    stickyWorker(ip) {
        const workerNumbers = this.options.instances;
        const ws = this.workerManager.listWorkerIds();
        let s = '';
        for (let i = 0; i < ip.length; i++) {
            if (!isNaN(ip[i])) {
                s += ip[i];
            }
        }
        s = Number(s);
        const pid = ws[s % workerNumbers];
        return this.workerManager.getWorker(pid);
    }
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
        cluster.on('listening', (worker, address) => {
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
                const legacyTimeout = process.env.MASTER_CLOSE_TIMEOUT || 5000;
                const appTimeout = process.env.APP_CLOSE_TIMEOUT || legacyTimeout;
                console.log('send kill SIGTERM to app workers, will exit with code:0 after %sms', appTimeout);
                yield this.killAppWorkers(appTimeout);
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
        // return path.resolve(process.cwd(), this.options.exec || './test/app.js')
    }
    rmConfigFile() {
        const configPath = path.resolve(process.env.HOME, './.rocker_config', `./${this.options.name}.json`);
        fs.unlinkSync(configPath);
    }
}
exports.Client = Client;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7OztBQUNiLDZCQUE0QjtBQUM1QiwrQkFBOEI7QUFDOUIsdUNBQXNDO0FBQ3RDLG1DQUFrQztBQUNsQyx5QkFBd0I7QUFDeEIsNkNBQXlDO0FBQ3pDLGlEQUF5QztBQUN6Qyx5Q0FBNEM7QUFHNUMsTUFBYSxNQUFPLFNBQVEsWUFBWTtJQVd0QyxZQUFZLE9BQU87UUFDakIsS0FBSyxFQUFFLENBQUE7UUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLG9CQUFZLEVBQUUsQ0FBQTtRQUNsQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBRW5DLDREQUE0RDtRQUM1RCw0Q0FBNEM7UUFDNUMsaUJBQWlCO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzNELGlCQUFpQjtRQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RCxtQkFBbUI7UUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBRXJCLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7WUFDaEQsTUFBTSxHQUFHLEdB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