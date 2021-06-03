import { TYPES } from 'core/types'
import { injectable, postConstruct } from 'inversify'

@injectable()
export class MessagingService {
  @postConstruct()
  async init() {}
}
