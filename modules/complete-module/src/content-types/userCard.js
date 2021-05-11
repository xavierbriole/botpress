const base = require('./_base')

function renderElement(data, channel) {
  const events = []

  if (data.typing) {
    events.push({
      type: 'typing',
      value: data.typing
    })
  }

  return [
    ...events,
    {
      type: 'custom',
      module: 'complete-module',
      component: 'UserCard',
      id: data.id,
      name: data.name,
      role: data.role
    }
  ]
}

module.exports = {
  id: 'complte-module_user-card',
  group: 'Complete Module',
  title: 'User Card',

  jsonSchema: {
    description: 'module.complete-module.types.userCard.description',
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: {
        type: 'string',
        title: 'module.complete-module.types.userCard.id'
      },
      name: {
        type: 'string',
        title: 'module.complete-module.types.userCard.name'
      },
      role: {
        type: 'string',
        title: 'module.complete-module.types.userCard.role'
      },
      ...base.typingIndicators
    }
  },

  uiSchema: {},
  computePreviewText: formData => `${formData.id} ${formData.name} ${formData.role}`,

  renderElement: renderElement
}
