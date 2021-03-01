import { Logger, RealTimePayload } from 'botpress/sdk'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { EventEmitter2 } from 'eventemitter2'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import socketio, { Server as SocketIoServer, Socket } from 'socket.io'
import { createAdapter, RedisAdapter } from 'socket.io-redis'
import socketioJwt from 'socketio-jwt'

import { TYPES } from '../../types'
import { MonitoringService } from '../monitoring'

const debug = DEBUG('realtime')

export const getSocketTransports = (config: BotpressConfig): string[] => {
  // Just to be sure there is at least one valid transport configured
  const transports = _.filter(config.httpServer.socketTransports, t => ['websocket', 'polling'].includes(t))
  return transports?.length ? transports : ['websocket', 'polling']
}

@injectable()
export default class RealtimeService {
  private readonly ee: EventEmitter2
  private useRedis: boolean

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Realtime')
    private logger: Logger,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {
    this.ee = new EventEmitter2({
      wildcard: true,
      maxListeners: 100
    })

    this.useRedis = process.CLUSTER_ENABLED && Boolean(process.env.REDIS_URL) && process.IS_PRO_ENABLED
  }

  private isEventTargeted(eventName: string | string[]): boolean {
    if (_.isArray(eventName)) {
      eventName = eventName[0]
    }

    return (eventName as string).startsWith('guest.')
  }

  sendToSocket(payload: RealTimePayload) {
    debug('Send %o', payload)
    this.ee.emit(payload.eventName, payload.payload, 'server')
  }

  async installOnHttpServer(server: Server) {
    const config = await this.configProvider.getBotpressConfig()

    const io = new SocketIoServer(server, {
      transports: getSocketTransports(config) as any, // typing not exported
      path: `${process.ROOT_PATH}/socket.io`,
      cors: config.httpServer.cors,
      serveClient: false
    })

    if (this.useRedis) {
      const redisFactory = this.monitoringService.getRedisFactory()

      if (redisFactory) {
        io.adapter(createAdapter({ pubClient: redisFactory('commands'), subClient: redisFactory('socket') }))
      }
    }

    const admin = io.of('/admin')
    this.setupAdminSocket(admin)

    const guest = io.of('/guest')
    this.setupGuestSocket(guest)

    this.ee.onAny((event, payload, from) => {
      if (from === 'client') {
        return // This is coming from the client, we don't send this event back to them
      }

      const connection = this.isEventTargeted(event) ? guest : admin

      if (payload && (payload.__socketId || payload.__room)) {
        // Send only to this socketId or room
        return connection.to(payload.__socketId || payload.__room).emit('event', {
          name: event,
          data: payload
        })
      }

      // broadcast event to the front-end clients
      connection.emit('event', { name: event, data: payload })
    })
  }

  setupAdminSocket(admin: socketio.Namespace): void {
    // @ts-ignore Typing issue in socketIoJwt
    admin.use(socketioJwt.authorize({ secret: process.APP_SECRET, handshake: true }))
    admin.on('connection', (socket: Socket) => {
      const visitorId = socket.handshake.query.visitorId

      socket.on('event', event => {
        try {
          if (!event || !event.name) {
            return
          }

          this.ee.emit(event.name, event.data, 'client', {
            visitorId,
            socketId: socket.id,
            guest: false,
            admin: true
          })
        } catch (err) {
          this.logger.attachError(err).error('Error processing incoming admin event')
        }
      })
    })
  }

  setupGuestSocket(guest: socketio.Namespace): void {
    guest.on('connection', async (socket: Socket) => {
      const visitorId = socket.handshake.query.visitorId

      if (visitorId?.length > 0) {
        if (this.useRedis) {
          const adapter = (guest.adapter as any) as RedisAdapter

          try {
            await adapter.remoteJoin(socket.id, `visitor:${visitorId}`)
          } catch (err) {
            return this.logger
              .attachError(err)
              .error(`socket "${socket.id}" for visitor "${visitorId}" can't join the socket.io redis room`)
          }
        } else {
          await socket.join(`visitor:${visitorId}`)
        }
      }

      socket.on('event', event => {
        try {
          if (!event || !event.name) {
            return
          }

          this.ee.emit(event.name, event.data, 'client', {
            socketId: socket.id,
            visitorId,
            guest: true,
            admin: false
          })
        } catch (err) {
          this.logger.attachError(err).error('Error processing incoming guest event')
        }
      })
    })
  }
}
