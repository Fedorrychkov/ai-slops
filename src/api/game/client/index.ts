import { Request } from '@lib/request'
import { AxiosInstance } from 'axios'

import { PaginationMeta } from '~/types'

import { GameAuditResponse, GameModel, GamePlayResponse, GameVoteResponse } from '../model'
import { GameFilter, GameModerateDto, GameSubmitDto, GameUpdateOwnDto } from '../types'

export * from './publicGameList'

export class ClientGameApi {
  private readonly client: AxiosInstance

  constructor(origin?: string, options?: { headers?: Record<string, string> }) {
    const config = origin ? { baseURL: origin, ...(options?.headers && { headers: options.headers }) } : undefined
    this.client = new Request(config).apiClient
  }

  /** Admin/editor moderation list (any status). */
  async getGames(params: GameFilter): Promise<PaginationMeta<GameModel>> {
    const response = await this.client.get('/api/v1/game/list', { params })

    return response.data
  }

  async getGame(id: string): Promise<GameModel> {
    const response = await this.client.get(`/api/v1/game/get/${id}`)

    return response.data
  }

  /** Authenticated user's own submissions. */
  async getMyGames(params: GameFilter): Promise<PaginationMeta<GameModel>> {
    const response = await this.client.get('/api/v1/game/my', { params })

    return response.data
  }

  async submit(body: GameSubmitDto): Promise<GameModel> {
    const response = await this.client.post('/api/v1/game/submit', body)

    return response.data
  }

  /** Author edits their own submission. */
  async updateOwn(id: string, body: GameUpdateOwnDto): Promise<GameModel> {
    const response = await this.client.post(`/api/v1/game/update-own/${id}`, body)

    return response.data
  }

  async moderate(id: string, body: GameModerateDto): Promise<GameModel> {
    const response = await this.client.post(`/api/v1/game/moderate/${id}`, body)

    return response.data
  }

  async vote(id: string): Promise<GameVoteResponse> {
    const response = await this.client.post(`/api/v1/game/vote/${id}`)

    return response.data
  }

  async recordPlay(id: string): Promise<GamePlayResponse> {
    const response = await this.client.post(`/api/v1/public/game/play/${id}`)

    return response.data
  }

  /** Generate / regenerate the AI editorial review (admin/editor). */
  async generateReview(id: string): Promise<{ aiReviewText: string }> {
    const response = await this.client.post(`/api/v1/game/review/${id}`)

    return response.data
  }

  /** Run the AI security audit over the game HTML (admin/editor). */
  async auditGame(id: string): Promise<GameAuditResponse> {
    const response = await this.client.post(`/api/v1/game/audit/${id}`)

    return response.data
  }
}
