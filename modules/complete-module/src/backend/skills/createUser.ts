import * as sdk from 'botpress/sdk'

export interface CreateUserData {
  nameContentId: string
  roleContentId: string
}

export const generateFlow = async (
  data: CreateUserData,
  metadata: sdk.FlowGeneratorMetadata
): Promise<sdk.FlowGenerationResult> => {
  return {
    transitions: createTransitions(),
    flow: {
      nodes: createNodes(data),
      catchAll: {
        next: []
      }
    }
  }
}

const createNodes = (data: CreateUserData) => {
  const nodes: sdk.SkillFlowNode[] = [
    {
      name: 'entry',
      onEnter: [
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.nameContentId}`
        }
      ],
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"name","value":"{{event.preview}}"}'
        }
      ],
      next: [{ condition: 'true', node: 'promptRole' }]
    },
    {
      name: 'promptRole',
      onEnter: [
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.roleContentId}`
        }
      ],
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"role","value":"{{event.preview}}"}'
        }
      ],
      next: [{ condition: 'true', node: 'createUser' }]
    },
    {
      name: 'createUser',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'complete-module/createUser',
          args: { name: '{{event.state.temp.name}}', role: '{{event.state.temp.role}}' }
        },
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"success","value":"true"}'
        }
      ],
      next: [{ condition: 'true', node: '#' }]
    }
  ]
  return nodes
}

const createTransitions = (): sdk.NodeTransition[] => {
  return [
    { caption: 'On success', condition: 'temp.success', node: '' },
    { caption: 'On failure', condition: '!temp.success', node: '' }
  ]
}

export default { generateFlow }
