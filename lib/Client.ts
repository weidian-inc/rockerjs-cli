'use strict';
import * as path from 'path'
import * as cfork from 'cfork'
import * as EventEmitter from 'events'
import * as cluster from 'cluster'
import { Manager } from './utils/manager'
import terminate from './utils/terminate'
import { isProduction } from './utils/utils'

export class Client extends EventEmitter{

  options: any
  isProduction: boolean
  workerManager: any
  appStartTime: number
  isAllAppWorkerStarted: boolean
  startSuccessCount: number
  closed: boolean
  exec: string

  constructor(options){
    super()
    this.options = options
    this.isProduction = isProduction()
    this.workerManager = new Manager();

    // https://nodejs.org/api/process.html#process_signal_events
    // https://en.wikipedia.org/wiki/Unix_signal
    // kill(2) Ctrl-C
    process.once('SIGINT', this.onSignal.bind(this, 'SIGINT'));
    // kill(3) Ctrl-\
    process.once('SIGQUIT', this.onSignal.bind(this, 'SIGQUIT'));
    // kill(15) default
    process.once('SIGTERM', this.onSignal.bind(this, 'SIGTERM'));

    this.forkAppWorkers()

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
    const workerNumbers = this.options.count;
    const ws = this.workerManager.listWorkerIds();

    let s:any = '';
    for (let i = 0; i < ip.length; i++) {
      if (!isNaN(ip[i])) {
        s += ip[i];
      }
    }
    s = Number(s);
    const pid = ws[s % workerNumbers];
    return this.workerManager.getWorker(pid);
  }

  forkAppWorkers(){
    this.appStartTime = Date.now()
    this.isAllAppWorkerStarted = false
    this.startSuccessCount = 0

    const args = [ JSON.stringify(this.options) ]
    console.log('start appWorker with args %j', args)
    cfork({
      exec: this.getAppWorkerFile(),
      args,
      silent: true,
      stdio: [0,'ipc','ipc'],
      count: this.options.count,
      refork: this.isProduction
    })

    cluster.on('fork', worker => {
      worker['disableRefork'] = true;
      this.workerManager.setWorker(worker);
      worker.process.stdout.on('data', (msg) =>{
        console.log(`[worker](${worker.process.pid})`, msg.toString());
      });
      worker.process.stderr.on('data', (err) =>{
        console.error(`[worker](${worker.process.pid})`, err.toString());
      });
      console.log('app_worker#%s:%s start, state: %s, current workers: %j',
        worker.id, worker.process.pid, worker['state'], Object.keys(cluster.workers));
    });
    cluster.on('disconnect', worker => {
      console.log('app_worker#%s:%s disconnect, suicide: %s, state: %s, current workers: %j',
        worker.id, worker.process.pid, worker.exitedAfterDisconnect, worker['state'], Object.keys(cluster.workers));
    });
    cluster.on('exit', (worker, code, signal) => {
      console.log('exit')
    });
    cluster.on('listening', (worker, address) => {

    });
  }

  async killAppWorkers(timeout) {
    let arr = []
    for(const id in cluster.workers){
      const worker = cluster.workers[id];
      worker['disableRefork'] = true;
      arr.push(terminate(worker, timeout))
    }
    await Promise.all(arr)
    return arr
  }
  
  onAppExit(data) {
    if (this.closed) return;

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

    const remain = this.isAllAppWorkerStarted ? 0 : this.options.count - this.startSuccessCount;
    console.log('app_worker#%s:%s started at %s, remain %s (%sms)', worker.id, data.workerPid, address.port, remain, Date.now() - this.appStartTime);

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
    console.log('exit with code:%s', code);
  }

  onSignal(signal) {
    console.log('signal', signal)
    if (this.closed) return;

    console.log('receive signal %s, closing', signal);
    this.close();
  }

  onReload() {
    console.log('reload workers...');
    for (const id in cluster.workers){
      const worker = cluster.workers[id];
      worker['isDevReload'] = true;
    }
    require('cluster-reload')(this.options.count);
  }

  async close() {
    this.closed = true;
    const self = this;
    try {
      const legacyTimeout = process.env.MASTER_CLOSE_TIMEOUT || 5000;
      const appTimeout = process.env.APP_CLOSE_TIMEOUT || legacyTimeout;
      console.log('send kill SIGTERM to app workers, will exit with code:0 after %sms', appTimeout);
      await self.killAppWorkers(appTimeout);
      console.log('close done, exiting with code:0');
      process.exit(0);
    } catch (e){
      console.error('close with error: ', e);
      process.exit(1);
    }
  }

  getAppWorkerFile() {
    // return './lib/entry.js'
    return path.resolve(process.cwd(), this.options.exec || './test/app.js')
  }

}