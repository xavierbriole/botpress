import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import Database from './db'
import { MessagingClient } from './messaging'

export const CHANNEL_NAME = 'web'

export default async (bp: typeof sdk, db: Database, messaging: MessagingClient) => {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = webchat.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'web.sendMessages',
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== CHANNEL_NAME) {
      return next()
    }

    if (event.type === 'data') {
      const payload = bp.RealTimePayload.forVisitor(event.target, 'webchat.data', event.payload)
      bp.realtime.sendPayload(payload)
    }

    next(undefined, false)
  }
}
