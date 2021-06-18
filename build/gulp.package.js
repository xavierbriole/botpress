const exec = require('child_process').exec
const path = require('path')
const fse = require('fs-extra')
const gulp = require('gulp')
const glob = require('glob')
const mkdirp = require('mkdirp')

const promisify = require('util').promisify
const execAsync = promisify(exec)
const archiver = require('archiver')

const zipArchive = async (fileName, osName) => {
  mkdirp.sync('out/archives')

  const version = fse.readJsonSync(path.resolve('package.json')).version.replace(/\./g, '_')
  const endFileName = `botpress-v${version}-${osName}-x64.zip`
  const output = fse.createWriteStream(path.resolve(`out/archives/${endFileName}`))

  const archive = archiver('zip')

  archive.pipe(output)
  archive.directory(`out/binaries/${osName}/bin`, 'bin')
  archive.file(`out/binaries/${fileName}`, { name: fileName.endsWith('.exe') ? 'bp.exe' : 'bp' })

  for (const file of glob.sync('out/binaries/modules/*.tgz')) {
    archive.file(file, { name: `modules/${path.basename(file)}` })
  }

  await archive.finalize()
  console.info(`${endFileName}: ${archive.pointer()} bytes`)
}

const packageApp = async () => {
  const additionalPackageJson = require(path.resolve(__dirname, './package.pkg.json'))
  const realPackageJson = require(path.resolve(__dirname, '../package.json'))
  const tempPkgPath = path.resolve(__dirname, '../out/bp/package.json')
  const cwd = path.resolve(__dirname, '../out/bp')
  const binOut = path.resolve(__dirname, '../out/binaries')

  try {
    const packageJson = Object.assign(realPackageJson, additionalPackageJson)
    await fse.writeFile(tempPkgPath, JSON.stringify(packageJson, null, 2), 'utf8')
    await execAsync(`cross-env pkg --options max_old_space_size=16384 --output ../binaries/bp ./package.json`, {
      cwd
    })

    await execAsync(`yarn bpd init --output ${path.resolve(binOut, 'win')} --platform win32 `)
    await execAsync(`yarn bpd init --output ${path.resolve(binOut, 'darwin')} --platform darwin`)
    await execAsync(`yarn bpd init --output ${path.resolve(binOut, 'linux')} --platform linux`)
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  } finally {
    await fse.unlink(tempPkgPath)
  }
}

const createArchive = async () => {
  await zipArchive('bp-win.exe', 'win')
  await zipArchive('bp-macos', 'darwin')
  await zipArchive('bp-linux', 'linux')
}

module.exports = { packageApp, createArchive }
