import * as sdk from 'botpress/sdk'

const TABLE_NAME = 'complete_mod_requests'

export default class CompleteModuleDB {
  knex: sdk.KnexExtended

  constructor(bp: typeof sdk) {
    this.knex = bp.database
  }

  initialize() {
    return this.knex.createTableIfNotExists(TABLE_NAME, table => {
      table.increments('id').primary()
      table.timestamp('created_on')
    })
  }

  async addRequest() {
    await this.knex(TABLE_NAME).insert({ created_on: new Date() })
  }

  async getRequests() {
    return await this.knex(TABLE_NAME).select('id', 'created_on')
  }
}
