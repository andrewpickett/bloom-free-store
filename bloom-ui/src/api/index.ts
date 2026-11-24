import type { Api } from './types'
import { realApi } from './real'
import { mockApi } from './mock'

// `npm run dev:mock` sets VITE_USE_MOCK=true (see .env.mock).
export const api: Api = import.meta.env.VITE_USE_MOCK === 'true' ? mockApi : realApi
