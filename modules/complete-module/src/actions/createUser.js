const axios = require('axios')
/**
 * Creates a user
 * @title Create User
 * @category Complete Module
 * @author Botpress, Inc.
 * @param name The name of the user
 * @param role The role of the user
 */
const createUser = async (name, role) => {
  const axiosConfig = await this.bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  const {
    data: { id }
  } = await axios.post('/mod/complete-module/users', { name, role }, axiosConfig)
  event.state.temp.createdUser = { id, name, role }
  bp.logger.info(`[createUser] ${id} ${name} ${role}`)
}

return createUser(args.name, args.role)
