type ChatMessage = {
  id: string;
  text: string;
  userId: string;
  nextUserId: string | undefined;
  userPic: string | undefined;
  createdAt: Date;
  isLast: boolean;
};

export default ChatMessage;
