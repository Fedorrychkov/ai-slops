import { Request } from '@lib/request'
import { AxiosInstance } from 'axios'

import { PaginationMeta } from '~/types'

import type { GameModel } from '../model'
import type { PublicGameListItem } from '../publicListQuery'
import type { GameFilter } from '../types'

export class ClientPublicGameListApi {
  private readonly client: AxiosInstance

  constructor(origin?: string, options?: { headers?: Record<string, string> }) {
    const config = origin ? { baseURL: origin, ...(options?.headers && { headers: options.headers }) } : undefined
    this.client = new Request(config).apiClient
  }

  async getList(params: GameFilter): Promise<PaginationMeta<PublicGameListItem>> {
    const entries = Object.entries(params).filter(([, v]) => v != null && v !== '')

    const response = await this.client.get('/api/v1/public/game/list', {
      params: Object.fromEntries(entries) as GameFilter,
    })

    return response.data
  }

  async getBySlug(slug: string): Promise<GameModel> {
    const response = await this.client.get(`/api/v1/public/game/get-by-slug/${slug}`)

    return response.data
  }
}
