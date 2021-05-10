import React, { FC, useEffect, useState } from 'react'

const UsersList: FC<any> = ({ bp }) => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      const {
        data: { users }
      } = await bp.axios.get('mod/complete-module/users')
      setUsers(users)
    }

    console.log('fetching users')
    fetchUsers()
  }, [])

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          ({user.id}) {user.name}, {user.role}
        </div>
      ))}
    </div>
  )
}

export default UsersList
