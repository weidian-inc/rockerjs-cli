"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const lodash_1 = require("lodash");
const chokidar_1 = require("chokidar");
function default_1() {
    return __awaiter(this, void 0, void 0, function* () {
        yield index_1.default();
        const throttled = lodash_1.throttle(index_1.default, 500, { 'trailing': false });
        chokidar_1.watch(process.cwd(), {
            ignored: /node_modules|types|\.git/,
            persistent: true
        }).on('all', (event, path) => {
            throttled();
        });
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsbUNBQXlCO0FBQ3pCLG1DQUFpQztBQUNqQyx1Q0FBZ0M7QUFDaEM7O1FBQ0ksTUFBTSxlQUFHLEVBQUUsQ0FBQTtRQUNYLE1BQU0sU0FBUyxHQUFHLGlCQUFRLENBQUMsZUFBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQzNELGdCQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ25CLE9BQU8sRUFBRSwwQkFBMEI7WUFDbkMsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDM0IsU0FBUyxFQUFFLENBQUE7UUFDYixDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUM7Q0FBQTtBQVRELDRCQVNDIn0=