import type ModuleInstance from './main.js'

export type ActionsSchema = {
	set_relay: {
		options: {
			command: 'Open' | 'Close' | 'Toggle'
			channel: number
		}
	}
	pulse_relay: {
		options: {
			channel: number
			duration: number
		}
	}
	reset_latch: {
		options: {
			channel: number
			latchTime: number
		}
	}
	reset_counter: {
		options: {
			channel: number
		}
	}
	reset_usage: {
		options: {
			channel: number
		}
	}
	console_send: {
		options: {
			command: string
			lineEnding: '\r' | '\n' | '\r\n'
		}
	}
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		set_relay: {
			name: 'Control: Set Relay Output',
			sortName: '101 Control: Set Relay Output',
			description: 'Set a relay output state to Closed or Open.',
			options: [
				{
					id: 'channel',
					type: 'number',
					label: 'Relay Channel',
					default: 1,
					min: 1,
					max: 20,
					step: 1,
				},
				{
					id: 'command',
					type: 'dropdown',
					label: 'Command',
					choices: [
						{ id: 'Close', label: 'Closed' },
						{ id: 'Open', label: 'Open' },
						{ id: 'Toggle', label: 'Toggle' },
					],
					default: 'Toggle',
				},
			],
			callback: async (event) => {
				self.sendControl(event.options.command, event.options.channel)
			},
		},

		pulse_relay: {
			name: 'Control: Pulse Relay Output',
			sortName: '102 Control: Pulse Relay Output',
			description: 'Close relay output for the selected duration, then return it to its previous state.',
			options: [
				{
					id: 'channel',
					type: 'number',
					label: 'Relay Channel',
					default: 1,
					min: 1,
					max: 20,
					step: 1,
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (ms)',
					default: 1000,
					min: 1,
					max: 2147483647,
					step: 1,
				},
			],
			callback: async (event) => {
				self.sendControl('Close', event.options.channel, event.options.duration)
			},
		},

		reset_latch: {
			name: 'Control: Reset Latch',
			sortName: '103 Control: Reset Latch',
			description: 'Resets the input state indicating the capture of an event',
			options: [
				{
					id: 'channel',
					type: 'number',
					label: 'Input Channel',
					default: 1,
					min: 1,
					max: 12,
					step: 1,
				},
				{
					id: 'latchTime',
					type: 'number',
					label: 'Duration (ms)',
					default: 1000,
					min: 1,
					max: 2147483647,
					step: 1,
				},
			],
			callback: async (event) => {
				self.sendControl('Reset Latch', event.options.channel, event.options.latchTime)
			},
		},

		reset_counter: {
			name: 'Control: Reset Counter',
			sortName: '104 Control: Reset Counter',
			description: 'Resets the count of pulses received on the selected input',
			options: [
				{
					id: 'channel',
					type: 'number',
					label: 'Input Channel',
					default: 1,
					min: 1,
					max: 12,
					step: 1,
				},
			],
			callback: async (event) => {
				self.sendControl('Reset Counter', event.options.channel)
			},
		},

		reset_usage: {
			name: 'Control: Reset Usage',
			sortName: '105 Control: Reset Usage',
			description:
				'Resets the Usage Meter for the selected I/O port. The mix of Inputs and Outputs will vary for each model; the channels here are numbered beginning with Inputs, and then Outputs.',
			options: [
				{
					id: 'channel',
					type: 'number',
					label: 'I/O Channel',
					default: 1,
					min: 1,
					max: 24,
					step: 1,
				},
			],
			callback: async (event) => {
				self.sendControl('Reset Usage', event.options.channel)
			},
		},

		console_send: {
			name: 'Console: Send Command',
			sortName: '401 Console: Send Command',
			description: 'Open a JMP console session, send a command, then close it.',
			options: [
				{
					id: 'command',
					type: 'textinput',
					label: 'Command',
					default: 'Hello World',
				},
				{
					id: 'lineEnding',
					type: 'dropdown',
					label: 'Line Ending',
					choices: [
						{ id: '\r', label: 'CR' },
						{ id: '\n', label: 'LF' },
						{ id: '\r\n', label: 'CR+LF' },
					],
					default: '\r\n',
				},
			],
			callback: async (event) => {
				const cmd = event.options.command ?? ''
				const eol = event.options.lineEnding ?? '\r'
				self.sendConsoleCommand(cmd, eol)
			},
		},
	})
}
