import * as sdk from 'botpress/sdk'
import DB from './db'

export default async (bp: typeof sdk, db: DB) => {
  /**
   * This is an example route to get you started.
   * Your API will be available at `http://localhost:3000/api/v1/bots/BOT_NAME/mod/complete-module`
   * Just replace BOT_NAME by your bot ID
   */
  const router = bp.http.createRouterForBot('complete-module')

  // Link to access this route: http://localhost:3000/api/v1/bots/BOT_NAME/mod/complete-module/users
  router.post('/users', async (req, res) => {
    const { name, role } = req.body
    const id = await db.addUser(name, role)
    res.send({ id, name, role })
  })

  router.get('/users', async (req, res) => {
    const users = await db.getUsers()
    res.send({ users })
  })
}
