'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require('events');
// worker manager to record worker forked by cluster
// can do some check stuff here to monitor the healthy
class Manager extends EventEmitter {
    constructor() {
        super();
        this.workers = new Map();
    }
    setWorker(worker) {
        this.workers.set(worker.process.pid, worker);
    }
    getWorker(pid) {
        return this.workers.get(pid);
    }
    deleteWorker(pid) {
        this.workers.delete(pid);
    }
    listWorkerIds() {
        return Array.from(this.workers.keys());
    }
    getListeningWorkerIds() {
        const keys = [];
        for (const id of this.workers.keys()) {
            if (this.getWorker(id).state === 'listening') {
                keys.push(id);
            }
        }
        return keys;
    }
    count() {
        return {
            worker: this.listWorkerIds().length,
        };
    }
    // check worker must both alive
    // if exception appear 3 times, emit an exception event
    startCheck() {
        this.exception = 0;
        this.timer = setInterval(() => {
            const count = this.count();
            if (count.worker) {
                this.exception = 0;
                return;
            }
            this.exception++;
            if (this.exception >= 3) {
                this.emit('exception', count);
                clearInterval(this.timer);
            }
        }, 10000);
    }
}
exports.Manager = Manager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUV2QyxvREFBb0Q7QUFDcEQsc0RBQXNEO0FBQ3RELE1BQWEsT0FBUSxTQUFRLFlBQVk7SUFDdkM7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsU0FBUyxDQUFDLE1BQU07UUFDZCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsU0FBUyxDQUFDLEdBQUc7UUFDWCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCxZQUFZLENBQUMsR0FBRztRQUNkLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxhQUFhO1FBQ1gsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQscUJBQXFCO1FBQ25CLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNoQixLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDcEMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxXQUFXLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDZjtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSztRQUNILE9BQU87WUFDTCxNQUFNLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLE1BQU07U0FDcEMsQ0FBQztJQUNKLENBQUM7SUFFRCwrQkFBK0I7SUFDL0IsdURBQXVEO0lBQ3ZELFVBQVU7UUFDUixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUU7WUFDNUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzNCLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7Z0JBQ25CLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNqQixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxFQUFFO2dCQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDOUIsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMzQjtRQUNILENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNaLENBQUM7Q0FDRjtBQXZERCwwQkF1REMifQ==