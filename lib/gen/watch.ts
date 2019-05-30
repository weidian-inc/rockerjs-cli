import gen from './index'
import {throttle} from 'lodash'
import * as chokidar from 'chokidar'
; (async () => {
    await gen()
    const throttled = throttle(gen, 500, { 'trailing': false })
    chokidar.watch(process.cwd(), {
      ignored: /node_modules/,
      persistent: true
    }).on('all', (event, path) => {
      throttled()
    })
})()
