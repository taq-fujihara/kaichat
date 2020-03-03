type ChatMessage = {
  id: string
  text: string
  userId: string
  createdAt: Date
  meta?: {
    isNextMyMessage: boolean
  }
}

export default ChatMessage
