import * as sdk from 'botpress/sdk'

export default class CompleteModuleDB {
  knex: sdk.KnexExtended

  constructor(bp: typeof sdk) {
    this.knex = bp.database
  }

  initialize() {
    return this.knex.createTableIfNotExists('complete_mod_requests', table => {
      table.increments('id').primary()
      table.timestamp('created_on')
    })
  }
}
