import fs from 'fs'
import path from 'path'
import minimist from 'minimist'

import packageJSON from '../package.json'
import JSON5 from './'

const argv = minimist(process.argv.slice(2), {
    alias: {
        'convert': 'c',
        'space': 's',
        'validate': 'v',
        'out-file': 'o',
        'version': 'V',
        'help': 'h',
    },
    boolean: [
        'convert',
        'validate',
        'version',
        'help',
    ],
    string: [
        'space',
        'out-file',
    ],
})

if (argv.version) {
    version()
} else if (argv.help) {
    usage()
} else {
    const inFilename = argv._[0]

    let readStream
    if (inFilename) {
        readStream = fs.createReadStream(inFilename)
    } else {
        readStream = process.stdin
    }

    let json5 = ''
    readStream.on('data', data => {
        json5 += data
    })

    readStream.on('end', () => {
        let space
        if (argv.space === 't' || argv.space === 'tab') {
            space = '\t'
        } else {
            space = Number(argv.space)
        }

        let value
        try {
            value = JSON5.parse(json5)
            if (!argv.validate) {
                const json = JSON.stringify(value, null, space)

                let writeStream

                // --convert is for backward compatibility with v0.5.1. If
                // specified with <file> and not --out-file, then a file with
                // the same name but with a .json extension will be written.
                if (argv.convert && inFilename && !argv.o) {
                    const outFilename = path.format(
                        Object.assign(
                            path.parse(inFilename),
                            {base: undefined, ext: '.json'}
                        )
                    )

                    writeStream = fs.createWriteStream(outFilename)
                } else if (argv.o) {
                    writeStream = fs.createWriteStream(argv.o)
                } else {
                    writeStream = process.stdout
                }

                writeStream.write(json)
            }
        } catch (err) {
            console.error(err.message)
        }
    })
}

function version () {
    console.log(packageJSON.version)
}

function usage () {
    console.log(
        `
  Usage: json5 [options] <file>


  Options:

    -s, --space              The number of spaces to indent or 't' for tabs
    -o, --out-file [file]    Outputs to the specified file
    -v, --validate           Validate JSON5 but do not output JSON
    -V, --version            Output the version number
    -h, --help               Output usage information`
    )
}
