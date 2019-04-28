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
const debug_1 = require("debug");
const logger = new debug_1.default('rocker');
logger.enabled = true;
const EventEmitter = require("events");
const cluster = require("cluster");
const utils_1 = require("./utils/utils");
const messenger_1 = require("./utils/messenger");
const manager_1 = require("./utils/manager");
const terminate_1 = require("./utils/terminate");
const detectPort = require("detect-port");
class rocker_bin extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.isProduction = utils_1.isProduction();
        this.messenger = new messenger_1.Messenger(this);
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
        detectPort((err, port) => {
            if (err) {
                err.name = 'ClusterPortConflictError';
                err.message = '[master] try get free port error, ' + err.message;
                logger(err);
                process.exit(1);
            }
            this.options.clusterPort = port;
            this.forkAppWorkers();
        });
        // exit when worker exception
        this.workerManager.on('exception', ({ worker }) => {
            const err = new Error(`[master] ${worker} worker(s) alive, exit to avoid unknown state`);
            err.name = 'ClusterWorkerExceptionError';
            err['count'] = { worker };
            logger(err);
            process.exit(1);
        });
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
        logger('[master] start appWorker with args %j', args);
        cfork({
            exec: this.getAppWorkerFile(),
            args,
            silent: false,
            count: this.options.count,
            refork: this.isProduction
        });
        cluster.on('fork', worker => {
            worker['disableRefork'] = true;
            this.workerManager.setWorker(worker);
            logger('[master] app_worker#%s:%s start, state: %s, current workers: %j', worker.id, worker.process.pid, worker['state'], Object.keys(cluster.workers));
        });
        cluster.on('disconnect', worker => {
            logger('[master] app_worker#%s:%s disconnect, suicide: %s, state: %s, current workers: %j', worker.id, worker.process.pid, worker.exitedAfterDisconnect, worker['state'], Object.keys(cluster.workers));
        });
        cluster.on('exit', (worker, code, signal) => {
            this.messenger.send({
                action: 'app-exit',
                data: { workerPid: worker.process.pid, code, signal },
                to: 'master',
                from: 'app',
            });
        });
        cluster.on('listening', (worker, address) => {
            this.messenger.send({
                action: 'app-start',
                data: { workerPid: worker.process.pid, address },
                to: 'master',
                from: 'app',
            });
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
        if (this.isAllAppWorkerStarted) {
            // cfork will only refork at production mode
            this.messenger.send({
                action: 'app-worker-died',
                to: 'parent',
            });
        }
        else {
            logger('[master] app_worker#%s:%s start fail, exiting with code:1', worker.id, worker.process.pid);
            process.exit(1);
        }
    }
    onAppStart(data) {
        const worker = this.workerManager.getWorker(data.workerPid);
        const address = data.address;
        this.startSuccessCount++;
        const remain = this.isAllAppWorkerStarted ? 0 : this.options.count - this.startSuccessCount;
        logger('[master] app_worker#%s:%s started at %s, remain %s (%sms)', worker.id, data.workerPid, address.port, remain, Date.now() - this.appStartTime);
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
        logger('[master] exit with code:%s', code);
    }
    onSignal(signal) {
        logger('signal', signal);
        if (this.closed)
            return;
        logger('[master] receive signal %s, closing', signal);
        this.close();
    }
    onReload() {
        logger('[master] reload workers...');
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
                logger('[master] send kill SIGTERM to app workers, will exit with code:0 after %sms', appTimeout);
                yield self.killAppWorkers(appTimeout);
                logger('[master] close done, exiting with code:0');
                process.exit(0);
            }
            catch (e) {
                logger('[master] close with error: ', e);
                process.exit(1);
            }
        });
    }
    getAppWorkerFile() {
        return path.resolve(process.cwd(), this.options.exec || './test/app.js');
    }
}
module.exports = rocker_bin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7QUFDYiw2QkFBNEI7QUFDNUIsK0JBQThCO0FBQzlCLGlDQUF5QjtBQUN6QixNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNsQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUN0Qix1Q0FBc0M7QUFDdEMsbUNBQWtDO0FBQ2xDLHlDQUE0QztBQUM1QyxpREFBNkM7QUFDN0MsNkNBQXlDO0FBQ3pDLGlEQUF5QztBQUN6QywwQ0FBeUM7QUFFekMsTUFBTSxVQUFXLFNBQVEsWUFBWTtJQVluQyxZQUFZLE9BQU87UUFDakIsS0FBSyxFQUFFLENBQUE7UUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLG9CQUFZLEVBQUUsQ0FBQTtRQUNsQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNwQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRW5ELDREQUE0RDtRQUM1RCw0Q0FBNEM7UUFDNUMsaUJBQWlCO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMs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