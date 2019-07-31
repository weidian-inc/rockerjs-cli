"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const argv = JSON.parse(process.argv[2]);
process.title = argv.name + '-' + process.pid;
const path = require("path");
const AppWorkerFilePath = path.resolve(process.cwd(), argv.exec || './test/app.js');
require(AppWorkerFilePath);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW50cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJFbnRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3hDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQTtBQUM3Qyw2QkFBNEI7QUFDNUIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLGVBQWUsQ0FBQyxDQUFBO0FBQ25GLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBIn0=