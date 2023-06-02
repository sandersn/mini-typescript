import fs = require('fs')
import { compile } from './compile'
// should probably support flags (at least target, verbose and strict)
// more realistic exception handling and errors
// more realistic interface (eg createChecker, createFile, getSemanticDiagnostics, etc)
// maybe generate error messages like diagnosticMessages.json?

const args = process.argv.slice(2);
const title = (str: string) => console.log('\x1b[1m%s\x1b[0m', str);

if (!args.length) {
    console.error("Expected a path to a TS file as the argument")
    process.exit(1)
}

title(`Looking at: ${args[0]}\n`)
const ts = fs.readFileSync(args[0], 'utf8')
const [_tree, errors, js] = compile(ts)


title("> TS input:")
console.log(ts)

if (errors.length) {
    title("> Errors:")
    console.log(errors)
}

title("> Output:")
console.log(js)

// Print errors, write js to file
fs.writeFileSync(args[0] + '.js', js)
