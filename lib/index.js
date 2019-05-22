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
const manager_1 = require("./utils/manager");
const terminate_1 = require("./utils/terminate");
const utils_1 = require("./utils/utils");
const index_1 = require("./gen/index");
const chokidar = require("chokidar");
const lodash_1 = require("lodash");
class rocker_bin extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.isProduction = utils_1.isProduction();
        this.workerManager = new manager_1.Manager();
        this.on('app-exit', this.onAppExit.bind(this));
        this.on('app-start', this.onAppStart.bind(this));
        this.on('reload-worker', this.onReload.bind(this));
        // https://nodejs.org/api/process.html#process_signal_events
        // https://en.wikipedia.org/wiki/Unix_signal
        // kill(2) Ctrl-C
        process.once('SIGINT', this.onSignal.bind(this, 'SIGINT'));
        // kill(3) Ctrl-\
        process.once('SIGQUIT', this.onSignal.bind(this, 'SIGQUIT'));
        // kill(15) default
        process.once('SIGTERM', this.onSignal.bind(this, 'SIGTERM'));
        // process.once('exit', this.onExit.bind(this));
        // detectPort((err, port) => {
        //   if (err) {
        //     err.name = 'ClusterPortConflictError';
        //     err.message = '[master] try get free port error, ' + err.message;
        //     console.error(err);
        //     process.exit(1);
        //   }
        //   this.options.clusterPort = port;
        // });
        this.forkAppWorkers();
        // exit when worker exception
        this.workerManager.on('exception', ({ worker }) => {
            const err = new Error(`[master] ${worker} worker(s) alive, exit to avoid unknown state`);
            err.name = 'ClusterWorkerExceptionError';
            err['count'] = { worker };
            console.error(err);
            process.exit(1);
        });
        if (utils_1.isDev()) {
            this.watchAppConf();
        }
    }
    startMasterSocketServer(cb) {
        // Create the outside facing server listening on our port.
        require('net').createServer({ pauseOnConnect: true }, connection => {
            // worker. Get the worker for this connection's source IP and pass
            if (!connection.remoteAddress) {
                connection.destroy();
            }
            else {
                const worker = this.stickyWorker(connection.remoteAddress);
                worker.send('sticky-session:connection', connection);
            }
        }).listen(this.options.port, cb);
    }
    stickyWorker(ip) {
        const workerNumbers = this.options.count;
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
        console.log('[master] start appWorker with args %j', args);
        cfork({
            exec: this.getAppWorkerFile(),
            args,
            silent: true,
            stdio: [0, 'ipc', 'ipc'],
            count: this.options.count,
            refork: this.isProduction
        });
        cluster.on('fork', worker => {
            // console.log('worker', worker);
            worker['disableRefork'] = true;
            this.workerManager.setWorker(worker);
            worker.process.stdout.on('data', (msg) => {
                console.log(`[${worker.process.pid}]`, msg.toString());
            });
            worker.process.stderr.on('data', (err) => {
                console.error(`[${worker.process.pid}]`, err.toString());
            });
            console.log('[master] app_worker#%s:%s start, state: %s, current workers: %j', worker.id, worker.process.pid, worker['state'], Object.keys(cluster.workers));
        });
        cluster.on('disconnect', worker => {
            console.log('[master] app_worker#%s:%s disconnect, suicide: %s, state: %s, current workers: %j', worker.id, worker.process.pid, worker.exitedAfterDisconnect, worker['state'], Object.keys(cluster.workers));
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
        console.log('[master] app_worker#%s:%s start fail, exiting with code:1', worker.id, worker.process.pid);
        process.exit(1);
    }
    onAppStart(data) {
        const worker = this.workerManager.getWorker(data.workerPid);
        const address = data.address;
        this.startSuccessCount++;
        const remain = this.isAllAppWorkerStarted ? 0 : this.options.count - this.startSuccessCount;
        console.log('[master] app_worker#%s:%s started at %s, remain %s (%sms)', worker.id, data.workerPid, address.port, remain, Date.now() - this.appStartTime);
        // if app is started, it should enable this worker
        if (this.isAllAppWorkerStarted) {
            worker.disableRefork = false;
        }
        if (this.isAllAppWorkerStarted || this.startSuccessCount < this.options.count) {
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
        console.log('[master] exit with code:%s', code);
    }
    onSignal(signal) {
        console.log('signal', signal);
        if (this.closed)
            return;
        console.log('[master] receive signal %s, closing', signal);
        this.close();
    }
    onReload() {
        console.log('[master] reload workers...');
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            worker['isDevReload'] = true;
        }
        require('cluster-reload')(this.options.count);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.closed = true;
            const self = this;
            try {
                const legacyTimeout = process.env.MASTER_CLOSE_TIMEOUT || 5000;
                const appTimeout = process.env.APP_CLOSE_TIMEOUT || legacyTimeout;
                console.log('[master] send kill SIGTERM to app workers, will exit with code:0 after %sms', appTimeout);
                yield self.killAppWorkers(appTimeout);
                console.log('[master] close done, exiting with code:0');
                process.exit(0);
            }
            catch (e) {
                console.error('[master] close with error: ', e);
                process.exit(1);
            }
        });
    }
    getAppWorkerFile() {
        return path.resolve(process.cwd(), this.options.exec || './test/app.js');
    }
    genConf(that) {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.default();
        });
    }
    watchAppConf() {
        const throttled = lodash_1.throttle(this.genConf, 500, { 'trailing': false });
        chokidar.watch(process.cwd(), {
            ignored: /node_modules/,
            persistent: true
        }).on('all', (event, path) => {
            throttled(this);
        });
    }
}
module.exports = rocker_bin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7QUFDYiw2QkFBNEI7QUFDNUIsK0JBQThCO0FBQzlCLHVDQUFzQztBQUN0QyxtQ0FBa0M7QUFDbEMsNkNBQXlDO0FBQ3pDLGlEQUF5QztBQUN6Qyx5Q0FBaUQ7QUFFakQsdUNBQTZCO0FBRTdCLHFDQUFvQztBQUNwQyxtQ0FBK0I7QUFFL0IsTUFBTSxVQUFXLFNBQVEsWUFBWTtJQVduQyxZQUFZLE9BQU87UUFDakIsS0FBSyxFQUFFLENBQUE7UUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLG9CQUFZLEVBQUUsQ0FBQTtRQUNsQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRW5ELDREQUE0RDtRQUM1RCw0Q0FBNEM7UUFDNUMsaUJBQWlCO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzNELGlCQUFpQjtRQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUks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