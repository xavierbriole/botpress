require('bluebird-global')
const { spawn } = require('child_process')

const execute = async (cmd, args, opts) => {
  await Promise.fromCallback(cb => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts })
    proc.on('exit', (code, signal) =>
      cb(code !== 0 ? new Error(`Process exited with exit-code ${code} and signal ${signal}`) : undefined)
    )
  })
}

module.exports = { execute }
