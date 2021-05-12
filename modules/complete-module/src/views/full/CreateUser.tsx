import React, { FC, useState, useEffect } from 'react'
// @ts-ignore
import ContentPickerWidget from 'botpress/content-picker'

export const CreateUser: FC<any> = props => {
  const [nameContentId, setNameContentId] = useState(props.nameContentId || '')
  const [roleContentId, setRoleContentId] = useState(props.roleContentId || '')
  const { bp } = props

  const onNameContentChanged = (element, force) => {
    if (element && (force || element.id !== nameContentId)) {
      setNameContentId(element.id)
    }
  }
  const onRoleContentChanged = (element, force) => {
    if (element && (force || element.id !== roleContentId)) {
      setRoleContentId(element.id)
    }
  }

  const refreshNameContent = async () => {
    const id = nameContentId

    if (id && id.length) {
      const res = await bp.axios.get(`/content/element/${id}`)
      return onNameContentChanged(res.data, true)
    }
  }

  const refreshRoleContent = async () => {
    const id = roleContentId

    if (id && id.length) {
      const res = await bp.axios.get(`/content/element/${id}`)
      return onRoleContentChanged(res.data, true)
    }
  }

  const updateParent = () => {
    props.onDataChanged({
      nameContentId,
      roleContentId
    })
    if (nameContentId && roleContentId) {
      props.onValidChanged(true)
    }
  }

  useEffect(() => {
    updateParent()
  }, [nameContentId, roleContentId])

  return (
    <div>
      <h2>Create User</h2>
      <ContentPickerWidget
        categoryId="builtin_text"
        contentType="builtin_text"
        refresh={() => refreshNameContent()}
        itemId={nameContentId}
        onChange={onNameContentChanged}
        placeholder="Pick Name content"
      />
      <ContentPickerWidget
        categoryId="builtin_text"
        contentType="builtin_text"
        refresh={() => refreshRoleContent}
        itemId={roleContentId}
        onChange={onRoleContentChanged}
        placeholder="Pick Role content"
      />
    </div>
  )
}
