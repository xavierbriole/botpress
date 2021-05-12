import * as sdk from 'botpress/sdk'

const TABLE_NAME = 'complete_mod_users'

interface User {
  id: number
  name: string
  role: string
}
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
    const { id } = await this.knex.insertAndRetrieve<User>(TABLE_NAME, { name, role }, ['id'])
    return id
  }

  async getUsers() {
    return await this.knex(TABLE_NAME).select('id', 'name', 'role')
  }
}
