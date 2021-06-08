import Axios from 'axios'

export class MessagingClient {
  private baseUser = 'http://localhost:3100/api'
  private axios = Axios.create({ headers: { token: 'test-token-123' } })

  async createConversation(userId: string): Promise<Conversation> {
    const res = await this.axios.post(`${this.baseUser}/conversations`, { userId })
    return res.data
  }

  async getConversationById(id: uuid): Promise<Conversation> {
    const res = await this.axios.get(`${this.baseUser}/conversations/${id}`)
    return res.data
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const res = await this.axios.get(`${this.baseUser}/conversations`, { params: { userId } })
    return res.data
  }

  async getMostRecentConversationForUser(userId: string): Promise<Conversation> {
    const res = await this.axios.get(`${this.baseUser}/conversations/${userId}/recent`)
    return res.data
  }

  async createMessage(conversationId: uuid, authorId: string, payload: any): Promise<Message> {
    const res = await this.axios.post(`${this.baseUser}/messages`, { conversationId, authorId, payload })
    return res.data
  }

  async listMessages(conversationId: uuid, limit: number): Promise<Message[]> {
    const res = await this.axios.get(`${this.baseUser}/messages`, { params: { conversationId, limit } })
    return res.data
  }

  async deleteMessages(conversationId: uuid): Promise<void> {
    const res = await this.axios.delete(`${this.baseUser}/messages`, { params: { conversationId } })
    return res.data
  }
}

export type uuid = string

export interface Conversation {
  id: uuid
  clientId: uuid
  userId: string
  createdOn: Date
}

export interface Message {
  id: uuid
  conversationId: uuid
  authorId: string | undefined
  sentOn: Date
  payload: any
}

export interface RecentConversation extends Conversation {
  lastMessage?: Message
}
