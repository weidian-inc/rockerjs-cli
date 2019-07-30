import gen from './index'
import {throttle} from 'lodash'
import * as chokidar from 'chokidar'
export default async function() {
    await gen()
    const throttled = throttle(gen, 500, { 'trailing': false })
    chokidar.watch(process.cwd(), {
      ignored: /node_modules|types|\.git/,
      persistent: true
    }).on('all', (event, path) => {
      throttled()
    })
}
