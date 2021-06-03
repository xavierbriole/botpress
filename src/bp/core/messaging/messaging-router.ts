import * as sdk from 'botpress/sdk'
import { CustomRouter } from 'core/routers/customRouter'
import { TYPES } from 'core/types'
import { Router } from 'express'
import { inject } from 'inversify'
import { MessagingService } from './messaging-service'

export class MessagingRouter extends CustomRouter {
  constructor(private logger: sdk.Logger, @inject(TYPES.MessagingService) private messaging: MessagingService) {
    super('Messaging', logger, Router({ mergeParams: true }))
  }

  public setupRoutes(): void {
    this.router.post('/receive', (req, res) => {
      const msg = req.body
      console.log(`Received from ${msg.channel.name}`, msg.message)
    })
  }
}
