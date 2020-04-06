import { User } from '@/models/User'

type ChatMessage = {
  id: string
  type: 'text' | 'image'
  text?: string
  imagePath?: string
  imageThumbnailPath?: string
  userId: string
  createdAt: Date
  meta?: {
    isNextMyMessage: boolean
    usersReadThisMessage: User[]
  }
}

export default ChatMessage
