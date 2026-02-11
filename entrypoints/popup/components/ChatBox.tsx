import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// TODO: add hook to send query
const ChatBox = () => {
  return (
    <div>
      <Textarea placeholder="Ask me a question" />
      <Button variant="outline">Submit</Button>
    </div>
  )
}

export default ChatBox
