'use strict';
import * as path from 'path'
import * as cfork from 'cfork'
import * as EventEmitter from 'events'
import * as cluster from 'cluster'
import { Manager } from './utils/manager'
import terminate from './utils/terminate'
import {isProduction, isDev} from './utils/utils'
import { Messenger } from './utils/messager'
import gen from './gen/index'
import * as childprocess from 'child_process'
import * as detectPort from 'detect-port'
import * as chokidar from 'chokidar'
import {throttle} from 'lodash'

class rocker_bin extends EventEmitter{

  options: any
  isProduction: boolean
  workerManager: any
  appStartTime: number
  isAllAppWorkerStarted: boolean
  startSuccessCount: number
  closed: boolean
  exec: string
  messenger: any;
  agentStartTime: number;
  agentWorkerIndex: any;
  logger: any;

  constructor(options){
    super()
    this.options = options
    this.isProduction = isProduction()
    this.workerManager = new Manager();
    this.messenger = new Messenger(this);
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
    //     err.message = 'try get free port error, ' + err.message;
    //     console.error(err);
    //     process.exit(1);
    //   }
    //   this.options.clusterPort = port;
    // });
    this.forkAppWorkers()

    // exit when worker exception
    this.workerManager.on('exception', ({ worker }) => {
      const err = new Error(`${worker} worker(s) alive, exit to avoid unknown state`);
      err.name = 'ClusterWorkerExceptionError';
      err['count'] = { worker };
      console.error(err);
      process.exit(1);
    });

    if(isDev()){
      this.watchAppConf()
    }
  }
  
  startMasterSocketServer(cb) {
    // Create the outside facing server listening on our port.
    require('net').createServer({ pauseOnConnect: true }, connection => {
      // worker. Get the worker for this connection's source IP and pass
      if (!connection.remoteAddress) {
        connection.destroy();
      } else {
        const worker = this.stickyWorker(connection.remoteAddress);
        worker.send('sticky-session:connection', connection);
      }
    }).listen(this.options.port, cb);
  }

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
      // console.log('worker', worker);
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
      this.appStart({ workerPid: worker.process.pid, address })
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

  appStart(data) {
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

  forkAgentWorker() {
    this.agentStartTime = Date.now();

    const args = [ JSON.stringify(this.options) ];
    const opt = {};

    // add debug execArgv
    const debugPort = process.env.EGG_AGENT_DEBUG_PORT || 5800;

    const agentWorker = childprocess.fork(this.getAgentWorkerFile(), args, opt);
    agentWorker['status'] = 'starting';
    agentWorker['id'] = ++this.agentWorkerIndex;
    this.workerManager.setAgent(agentWorker);

    // send debug message
    if (this.options.isDebug) {
      this.messenger.send({ to: 'parent', from: 'agent', action: 'debug', data: { debugPort, pid: agentWorker.pid } });
    }
    // forwarding agent' message to messenger
    agentWorker.on('message', msg => {
      if (typeof msg === 'string') msg = { action: msg, data: msg };
      msg.from = 'agent';
      this.messenger.send(msg);
    });
    agentWorker.on('error', err => {
      err.name = 'AgentWorkerError';
      err['id'] = agentWorker['id'];
      err['pid'] = agentWorker['pid'];
      this.logger.error(err);
    });
    // agent exit message
    agentWorker.once('exit', (code, signal) => {
      this.messenger.send({
        action: 'agent-exit',
        data: { code, signal },
        to: 'master',
        from: 'agent',
      });
    });
  }
  getAgentWorkerFile() {
    return path.join(process.cwd(), this.options.exec || './test/app.js');
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
    return path.resolve(process.cwd(), this.options.exec || './test/app.js')
  }

  async genConf(){
    await gen()
  }

  watchAppConf(){
    const throttled = throttle(this.genConf, 500, { 'trailing': false })
    chokidar.watch(process.cwd(), {
      ignored: /node_modules/,
      persistent: true
    }).on('all', (event, path) => {
      throttled()
    })
  }
}

module.exports = rocker_bin