import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { UnexpectedError } from 'common/http'
import { extractArchive } from 'core/misc/archive'
import e from 'express'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'
import tmp from 'tmp'

class VersioningRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Versioning', services)
    this.setupRoutes()
  }

  log(msg: string) {
    this.logger.info(`[VersioningRouter] ${msg}`)
  }

  setupRoutes() {
    this.router.get(
      '/export',
      this.asyncMiddleware(async (req, res) => {
        const archive = await this.bpfs.exportArchive()

        res.writeHead(200, {
          'Content-Type': 'application/tar+gzip',
          'Content-Disposition': `attachment; filename=archive_${Date.now()}.tgz`,
          'Content-Length': archive.length
        })
        res.end(archive)
      })
    )

    this.router.post(
      '/changes',
      this.asyncMiddleware(async (req, res) => {
        const tmpDir = tmp.dirSync({ unsafeCleanup: true })

        try {
          await this.extractArchiveFromRequest(req, tmpDir.name)

          res.send(await this.bpfs.listFileChanges(tmpDir.name))
        } catch (error) {
          res.status(500).send('Error while listing changes')
        } finally {
          tmpDir.removeCallback()
        }
      })
    )

    // Force update of the remote files by the local files
    this.router.post(
      '/update',
      this.asyncMiddleware(async (req, res) => {
        this.log('Received update request request')
        const tmpDir = tmp.dirSync({ unsafeCleanup: true })
        const beforeBotIds = await this.botService.getBotsIds()

        try {
          this.log('Extracting archive from request')
          await this.extractArchiveFromRequest(req, tmpDir.name)

          this.log('Force updating BPFS')
          const newBotIds = await this.bpfs.forceUpdate(tmpDir.name)

          // Unmount all previous bots and re-mount only the remaining (and new) bots
          this.log(`Unmounting bots: ${beforeBotIds.join(', ')}`)
          await Promise.all(beforeBotIds.map(id => this.botService.unmountBot(id)))

          this.log(`Mounting bots: ${newBotIds.join(', ')}`)
          await Promise.map(newBotIds, id => this.botService.mountBot(id))

          this.log('Sending back response')
          res.sendStatus(200)
        } catch (error) {
          this.log('Error while pushing changes: ' + error.message)
          throw new UnexpectedError('Error while pushing changes', error)
        } finally {
          this.log('Removing temp dir')
          tmpDir.removeCallback()
          this.log('Removed temp dir')
        }
      })
    )

    this.router.get('/bpfs_status', (req, res) => {
      res.send({ isAvailable: process.BPFS_STORAGE === 'database' })
    })
  }

  extractArchiveFromRequest = async (request, folder) => {
    const dataFolder = path.join(folder, 'data')
    await mkdirp.sync(dataFolder)

    const buffer: Buffer[] = []
    request.on('data', chunk => buffer.push(chunk))

    await Promise.fromCallback(cb => request.on('end', cb))
    this.log('Extracting archive ...')
    await extractArchive(Buffer.concat(buffer), dataFolder)
  }
}

export default VersioningRouter
