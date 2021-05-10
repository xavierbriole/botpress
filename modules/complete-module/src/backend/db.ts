import * as sdk from 'botpress/sdk'

const TABLE_NAME = 'complete_mod_users'

export default class CompleteModuleDB {
  knex: sdk.KnexExtended

  constructor(bp: typeof sdk) {
    this.knex = bp.database
  }

  initialize() {
    return this.knex.createTableIfNotExists(TABLE_NAME, table => {
      table.increments('id').primary()
      table.string('name')
      table.string('role')
    })
  }

  async addUser(name: string, role: string) {
    await this.knex(TABLE_NAME).insert({ name, role })
  }

  async getUsers() {
    return await this.knex(TABLE_NAME).select('id', 'name', 'role')
  }
}
