'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cluster = require('cluster');
const sendmessage = require('sendmessage');
const debug = require('debug')('rocker-cluster:messenger');
/**
 *
 * ```js
 * process.send({
 *   action: 'xxx',
 *   data: '',
 *   to: 'master/parent', // default to app
 * });
 */
class Messenger {
    constructor(master) {
        this.master = master;
        this.hasParent = !!process.send;
        process.on('message', msg => {
            msg.from = 'parent';
            this.send(msg);
        });
        process.once('disconnect', () => {
            this.hasParent = false;
        });
    }
    /**
     * send message
     * @param {Object} data message body
     *  - {String} from from who
     *  - {String} to to who
     */
    send(data) {
        if (!data.from) {
            data.from = 'master';
        }
        // recognise receiverPid is to who
        if (data.receiverPid) {
            if (data.receiverPid === String(process.pid)) {
                data.to = 'master';
            }
            else if (data.receiverPid === String(this.master.agentWorker.pid)) {
                data.to = 'agent';
            }
            else {
                data.to = 'app';
            }
        }
        // default from -> to rules
        if (!data.to) {
            if (data.from === 'agent')
                data.to = 'app';
            if (data.from === 'app')
                data.to = 'agent';
            if (data.from === 'parent')
                data.to = 'master';
        }
        // app -> master
        // agent -> master
        if (data.to === 'master') {
            debug('%s -> master, data: %j', data.from, data);
            // app/agent to master
            this.sendToMaster(data);
            return;
        }
        // master -> parent
        // app -> parent
        // agent -> parent
        if (data.to === 'parent') {
            debug('%s -> parent, data: %j', data.from, data);
            this.sendToParent(data);
            return;
        }
        // parent -> master -> app
        // agent -> master -> app
        if (data.to === 'app') {
            debug('%s -> %s, data: %j', data.from, data.to, data);
            this.sendToAppWorker(data);
            return;
        }
    }
    /**
     * send message to master self
     * @param {Object} data message body
     */
    sendToMaster(data) {
        this.master.emit(data.action, data.data);
    }
    /**
     * send message to parent process
     * @param {Object} data message body
     */
    sendToParent(data) {
        if (!this.hasParent) {
            return;
        }
        process.send(data);
    }
    /**
     * send message to app worker
     * @param {Object} data message body
     */
    sendToAppWorker(data) {
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            if (worker.state === 'disconnected') {
                continue;
            }
            // check receiverPid
            if (data.receiverPid && data.receiverPid !== String(worker.process.pid)) {
                continue;
            }
            sendmessage(worker, data);
        }
    }
}
exports.Messenger = Messenger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2VuZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVzc2VuZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7QUFFYixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBRTNEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBYSxTQUFTO0lBR3BCLFlBQVksTUFBTTtRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxJQUFJLENBQUMsSUFBSTtRQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ2QsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7U0FDdEI7UUFFRCxrQ0FBa0M7UUFDbEMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM1QyxJ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