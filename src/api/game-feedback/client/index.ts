import { Request } from '@lib/request'
import { AxiosInstance } from 'axios'

import { PaginationMeta } from '~/types'

import { GameFeedbackModel, PublicGameFeedbackItem } from '../model'
import { GameFeedbackFilter, GameFeedbackModerateDto, GameFeedbackSubmitDto } from '../types'

export class ClientGameFeedbackApi {
  private readonly client: AxiosInstance

  constructor(origin?: string, options?: { headers?: Record<string, string> }) {
    const config = origin ? { baseURL: origin, ...(options?.headers && { headers: options.headers }) } : undefined
    this.client = new Request(config).apiClient
  }

  /** Create or replace the authenticated user's feedback for a game (goes back to moderation). */
  async submit(body: GameFeedbackSubmitDto): Promise<GameFeedbackModel> {
    const response = await this.client.post('/api/v1/game/feedback', body)

    return response.data
  }

  /** Admin/editor moderation list (any status). */
  async getList(params: GameFeedbackFilter): Promise<PaginationMeta<GameFeedbackModel>> {
    const response = await this.client.get('/api/v1/game/feedback/list', { params })

    return response.data
  }

  async moderate(id: string, body: GameFeedbackModerateDto): Promise<GameFeedbackModel> {
    const response = await this.client.post(`/api/v1/game/feedback/moderate/${id}`, body)

    return response.data
  }

  /** Approved feedback for the public game page. */
  async getPublicList(gameId: string, params?: Pick<GameFeedbackFilter, 'limit' | 'offset'>): Promise<PaginationMeta<PublicGameFeedbackItem>> {
    const response = await this.client.get(`/api/v1/public/game/feedback/${gameId}`, { params })

    return response.data
  }
}
