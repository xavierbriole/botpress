import axios from 'axios'
import { IO } from 'botpress/sdk'
import { EventEngine, Event } from 'core/events'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'

@injectable()
export class MessagingService {
  constructor(@inject(TYPES.EventEngine) private eventEngine: EventEngine) {}

  @postConstruct()
  async init() {
    this.eventEngine.register({
      name: 'messaging.sendOut',
      description: 'Sends outgoing messages to external messaging',
      order: 20000,
      direction: 'outgoing',
      handler: async (event: IO.Event, next) => {
        await this.send(event.channel, event.threadId!, event.payload)
        return next(undefined, true, false)
      }
    })
  }

  async receive(channel: string, userId: string, conversationId: string, message) {
    return this.eventEngine.sendEvent(
      Event({
        direction: 'incoming',
        type: message.payload.type,
        payload: message.payload,
        channel,
        threadId: conversationId,
        target: userId,
        // TODO: get bot id from client id
        botId: 'gggg'
      })
    )
  }

  async send(channel: string, conversationId: string, payload) {
    await axios.post('http://localhost:3100/api/send', {
      channel,
      conversationId,
      payload
    })
  }
}
