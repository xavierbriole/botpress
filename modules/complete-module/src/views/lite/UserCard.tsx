import React, { FC } from 'react'

export const UserCard: FC<any> = ({ bp, id, name, role }) => {
  return (
    <div>
      {id} {name} {role}
    </div>
  )
}
