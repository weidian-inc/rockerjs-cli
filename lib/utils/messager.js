'use strict';
const cluster = require('cluster');
const sendmessage = require('sendmessage');
const debug = require('debug')('egg-cluster:messenger');
/**
 * master messenger,provide communication between parent, master, agent and app.
 *
 *             ┌────────┐
 *             │ parent │
 *            /└────────┘\
 *           /     |      \
 *          /  ┌────────┐  \
 *         /   │ master │   \
 *        /    └────────┘    \
 *       /     /         \    \
 *     ┌───────┐         ┌───────┐
 *     │ agent │ ------- │  app  │
 *     └───────┘         └───────┘
 *
 *
 * in app worker
 *
 * ```js
 * process.send({
 *   action: 'xxx',
 *   data: '',
 *   to: 'agent/master/parent', // default to app
 * });
 * ```
 *
 * in agent worker
 *
 * ```js
 * process.send({
 *   action: 'xxx',
 *   data: '',
 *   to: 'app/master/parent', // default to agent
 * });
 * ```
 *
 * in parent
 *
 * ```js
 * process.send({
 *   action: 'xxx',
 *   data: '',
 *   to: 'app/agent/master', // default to be ignore
 * });
 * ```
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
        // parent -> master -> agent
        // app -> master -> agent，可能不指定 to
        if (data.to === 'agent') {
            debug('%s -> %s, data: %j', data.from, data.to, data);
            this.sendToAgentWorker(data);
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
    /**
     * send message to agent worker
     * @param {Object} data message body
     */
    sendToAgentWorker(data) {
        if (this.master.agentWorker) {
            sendmessage(this.master.agentWorker, data);
        }
    }
}
module.exports = Messenger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXNzYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBR3hEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Q0c7QUFDSCxNQUFNLFNBQVM7SUFJYixZQUFZLE1BQU07UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztRQUNoQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRTtZQUMxQixHQUFHLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztZQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFDLElBQUk7UUFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNkLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO1NBQ3RCO1FBRUQsa0NBQWtDO1FBQ2xDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFD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