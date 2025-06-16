
import { Message } from 'ai'
import { getContext } from '@/utils/context'
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {

    const { messages } = await req.json()

    // Get the last message
    const lastMessage = messages[messages.length - 1]

    // Get the context from the last message
    const context = await getContext(lastMessage.content, '')

    const prompt = [
      {
        role: 'system',
        content: `Jsi AI asistent specializující se na Quantum Compression Theory (QCT) a související témata.
      Tvé vlastnosti zahrnují odborné znalosti, vstřícnost, chytrost a artikulovanost.
      Jsi přátelský, laskavý a inspirativní, a snažíš se poskytovat živé a promyšlené odpovědi.
      
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      
      Pokud je poskytnut CONTEXT BLOCK, použij ho jako primární zdroj informací.
      Můžeš však kontext rozšířit o své vlastní znalosti a analýzy, pokud:
      - Pomůžeš uživateli lépe pochopit téma
      - Navážeš na kontext logickými souvislostmi
      - Nabídneš další perspektivy nebo aplikace
      - Zodpovíš následné otázky, které z kontextu vyplývají
      
      Vždy jasně rozlišuj mezi informacemi z kontextu a svými vlastními úvahami.
      Pokud nemáš dostatek informací ani v kontextu ani ve svých znalostech, přiznej to upřímně.
      Odpovídej v češtině, pokud uživatel píše česky.
      `,
      },
    ]

    const result = await streamText({
      model: openai("gpt-4o"),
      messages: [...prompt,...messages.filter((message: Message) => message.role === 'user')]
    });

    return result.toDataStreamResponse();
  } catch (e) {
    throw (e)
  }
}