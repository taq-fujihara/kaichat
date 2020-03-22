import { User } from '@/models/User'

type ChatMessage = {
  id: string
  text: string
  userId: string
  createdAt: Date
  meta?: {
    isNextMyMessage: boolean
    usersReadThisMessage: User[]
  }
}

export default ChatMessage
