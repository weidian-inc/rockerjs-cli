import { ensureDirSync } from 'fs-extra'
import * as moment from 'moment'
import * as fs from 'fs'
import * as path from 'path'
import { Console } from 'console'
export function setLogger(config: any) {
    const _console = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      time: console.time,
      timeEnd: console.timeEnd,
      trace: console.trace,
    }
    
    const logPath = (config && config.out_file) ? path.dirname(config.out_file) : path.resolve(process.env.HOME, './rocker_logs')
    ensureDirSync(logPath)
  
    const output = fs.createWriteStream(config && config.out_file || path.resolve(logPath, './stdout.log'))
    const errorOutput = fs.createWriteStream(config && config.error_file || path.resolve(logPath, './stderr.log'))
  
    const logger = new Console(output, errorOutput)
    global.console.log = function(...args: any) {
      fotmatLog(args, 'LOG')
      _console.log(...args);
      logger.log(...args);
    }
    global.console.info = function(...args: any) {
      fotmatLog(args, 'INFO')
      _console.info(...args);
      logger.info(...args);
    }
    global.console.warn = function(...args: any) {
      fotmatLog(args, 'WARN')
      _console.warn(...args);
      logger.warn(...args);
    }
    global.console.error = function(...args: any) {
      fotmatLog(args, 'ERROR')
      _console.error(...args);
      logger.error(...args);
    }
    global.console.time = function(...args: any) {
      fotmatLog(args, 'TIME')
      _console.time(...args);
      logger.time(...args);
    }
    global.console.timeEnd = function(...args: any) {
      fotmatLog(args, 'TIME')
      _console.timeEnd(...args);
      logger.timeEnd(...args);
    }
    global.console.trace = function(...args: any) {
      fotmatLog(args, 'TARCE')
      _console.trace(...args);
      logger.trace(...args);
    }
  
  }
  
  function fotmatLog(args: any, type: string){
    if(typeof args[0] == 'string' || typeof args[0] == 'number'){
      let info = `${moment().format('YYYY-MM-DD hh:mm:ss')} ${type} `
      if(! /\[worker]\(\d+\)/.test(args[0]) ){
        info += `[master](${process.pid}) `
      }
      args[0] = info + args[0]
    }else{
      if(Array.isArray(args[0])){
        args[0].unshift(`${moment().format('YYYY-MM-DD hh:mm:ss')} ${type} `)
      }
    }
  }