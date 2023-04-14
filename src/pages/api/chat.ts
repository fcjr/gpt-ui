import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
} from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

interface ChatNextApiRequest extends NextApiRequest {
  body: ChatCompletionRequestMessage[];
}

export default async function handler(
  req: ChatNextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const messages = req.body;

  const newMessages: ChatCompletionRequestMessage[] = [];

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    for (let i = 0; i < response.data.choices.length; i++) {
      let message = response.data.choices[i].message;
      if (message != undefined) {
        newMessages.push(message);
      }
    }
  } catch (e: unknown) {
    const message = {
      role: ChatCompletionRequestMessageRoleEnum.System,
      name: userId,
      content: 'An error has occurred.',
    };

    if (typeof e === 'string') {
      message.content = e;
    } else if (e instanceof Error) {
      message.content = e.message;
    }

    newMessages.push(message);
  }
  return res.status(200).json(newMessages);
}
