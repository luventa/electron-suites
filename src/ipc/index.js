import { registerEventHandlers } from './handlers'

export const initializeIpc = events => {
  registerEventHandlers(events)
}
