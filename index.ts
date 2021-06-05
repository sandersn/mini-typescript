import fs = require('fs')
import { compile } from './compile'
const [_tree, errors, js] = compile(fs.readFileSync(process.argv[1], 'utf8'))
// print errors, write js to file
console.log(errors)
fs.writeFileSync(process.argv[1] + '.js', js)
