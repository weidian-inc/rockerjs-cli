import gen from './index'
import { throttle } from 'lodash'
import { watch } from 'chokidar'
export default async function() {
    await gen()
    const throttled = throttle(gen, 500, { 'trailing': false })
    watch(process.cwd(), {
      ignored: /node_modules|types|\.git/,
      persistent: true
    }).on('all', (event, path) => {
      throttled()
    })
}
