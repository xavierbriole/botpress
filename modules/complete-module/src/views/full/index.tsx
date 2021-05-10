import React, { FC } from 'react'

import UsersList from './UsersList'

/**
 * This file is the full view of your module. It automatically includes heavy dependencies, like react-bootstrap
 * If you want to display an interface for your module, export your principal view as "default"
 */
const MyMainView: FC<any> = ({ bp }) => {
  return (
    <div>
      <h1>Users List</h1>
      <UsersList bp={bp} />
    </div>
  )
}

export default MyMainView
