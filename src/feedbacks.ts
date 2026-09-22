import type ModuleInstance from './main.js'

export type FeedbacksSchema = Record<never, never>

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({})
}
