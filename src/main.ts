import { createHash } from 'node:crypto'
import { Socket } from 'node:net'
import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, type ModuleSecrets } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: ModuleSecrets
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()
	secrets!: ModuleSecrets
	private socket: Socket | undefined
	private receiveBuffer = Buffer.alloc(0)
	private authenticated = false

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets

		this.updateActions()
		this.updateFeedbacks() // export feedbacks
		this.updatePresets() // export Presets
		this.updateVariableDefinitions() // export variable definitions
		this.initConnection()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.destroyConnection()
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		this.updateActions()
		this.initConnection()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	public sendControl(
		command: 'Close' | 'Open' | 'Toggle' | 'Reset Latch' | 'Reset Counter' | 'Reset Usage',
		channel: number,
		duration?: number,
		latchTime?: number,
	): void {
		if (!this.authenticated) {
			this.log('warn', 'Cannot control relay before JMP authentication completes')
			return
		}
		this.sendMessage({
			Message: 'Control',
			Command: command,
			Channel: channel,
			...(duration === undefined ? {} : { Duration: duration }),
			...(latchTime === undefined ? {} : { 'Latch Time': latchTime }),
		})
	}

	public sendConsoleCommand(command: string, lineEnding: '\r' | '\n' | '\r\n'): void {
		if (!this.authenticated) {
			this.log('warn', 'Cannot send console command before JMP authentication completes')
			return
		}

		const payload = `${command}${lineEnding}`
		this.sendMessage({ Message: 'Console Open' })
		this.sendMessage({
			Message: 'Console Stdin',
			Data: payload,
		})
		this.sendMessage({ Message: 'Console Close' })
	}

	private initConnection(): void {
		this.destroyConnection()
		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'Target IP is required')
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		this.socket = new Socket()
		this.socket.on('connect', () => {
			this.authenticated = false
			this.receiveBuffer = Buffer.alloc(0)
			this.updateStatus(InstanceStatus.Connecting, 'Connected; authenticating')
			this.sendMessage({ Message: '' })
		})
		this.socket.on('data', (data) => this.handleData(data))
		this.socket.on('error', (error) => {
			this.log('error', `Connection error: ${error.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
		})
		this.socket.on('close', () => {
			this.authenticated = false
			this.updateStatus(InstanceStatus.Disconnected, 'Connection closed')
		})
		this.socket.connect(this.config.port, this.config.host)
	}

	private destroyConnection(): void {
		this.socket?.destroy()
		this.socket = undefined
		this.authenticated = false
		this.receiveBuffer = Buffer.alloc(0)
	}

	private sendMessage(message: Record<string, unknown>): void {
		if (!this.socket || !this.socket.writable) {
			this.log('warn', 'Cannot send JMP message while disconnected')
			return
		}

		const json = JSON.stringify(message)
		const frame = `[${Buffer.byteLength(json, 'utf8')},${json}]`
		this.socket.write(frame)
	}

	private handleData(data: Buffer): void {
		this.receiveBuffer = Buffer.concat([this.receiveBuffer, data])
		while (true) {
			const message = this.extractMessage()
			if (!message) return
			this.handleMessage(message)
		}
	}

	private extractMessage(): Record<string, unknown> | undefined {
		const start = this.receiveBuffer.indexOf(0x5b)
		if (start < 0) {
			this.receiveBuffer = Buffer.alloc(0)
			return undefined
		}
		if (start > 0) this.receiveBuffer = this.receiveBuffer.subarray(start)

		let index = 1
		while (index < this.receiveBuffer.length && /\s/.test(String.fromCharCode(this.receiveBuffer[index]))) index++
		const lengthStart = index
		while (
			index < this.receiveBuffer.length &&
			this.receiveBuffer[index] >= 0x30 &&
			this.receiveBuffer[index] <= 0x39
		) {
			index++
		}
		if (index === lengthStart) return undefined
		if (index >= this.receiveBuffer.length) return undefined
		const length = Number(this.receiveBuffer.subarray(lengthStart, index).toString('ascii'))
		while (index < this.receiveBuffer.length && /\s/.test(String.fromCharCode(this.receiveBuffer[index]))) index++
		if (index >= this.receiveBuffer.length) return undefined
		if (this.receiveBuffer[index] !== 0x2c || length < 2) {
			this.receiveBuffer = this.receiveBuffer.subarray(1)
			return {}
		}
		index++
		while (index < this.receiveBuffer.length && /\s/.test(String.fromCharCode(this.receiveBuffer[index]))) index++
		if (this.receiveBuffer.length < index + length + 1) return undefined
		const jsonBuffer = this.receiveBuffer.subarray(index, index + length)
		const closingIndex = index + length
		let end = closingIndex + 1
		while (end < this.receiveBuffer.length && /\s/.test(String.fromCharCode(this.receiveBuffer[end]))) end++
		if (jsonBuffer[0] !== 0x7b || jsonBuffer[length - 1] !== 0x7d || this.receiveBuffer[closingIndex] !== 0x5d) {
			this.receiveBuffer = this.receiveBuffer.subarray(1)
			return {}
		}
		this.receiveBuffer = this.receiveBuffer.subarray(end)
		try {
			return JSON.parse(jsonBuffer.toString('utf8')) as Record<string, unknown>
		} catch {
			return {}
		}
	}

	private handleMessage(message: Record<string, unknown>): void {
		const type = message.Message
		if (type === 'Error' && message.Nonce) {
			const innerDigest = createHash('md5')
				.update(`${this.config.username}:${this.toVariableString(message.Nonce)}:${this.secrets.password}`)
				.digest('hex')
			this.sendMessage({ 'Auth-Digest': `${this.config.username}:${innerDigest}` })
			return
		}
		if (type === 'Authenticated') {
			this.authenticated = true
			this.updateStatus(InstanceStatus.Ok)
			return
		}
		if (type === 'Monitor') this.updateMonitor(message)
	}

	private updateMonitor(message: Record<string, unknown>): void {
		const values: Record<string, string> = {
			model: this.toVariableString(message.Model),
			version: this.toVariableString(message.Version),
			serialNumber: this.toVariableString(message['Serial Number']),
			timestamp: this.toVariableString(message.Timestamp),
		}
		const inputs = Array.isArray(message.Inputs) ? message.Inputs : []
		for (let index = 0; index < 8; index++) {
			const input = inputs[index] as Record<string, unknown> | undefined
			values[`input${index + 1}State`] = this.toVariableString(input?.State)
			values[`input${index + 1}Count`] = this.toVariableString(input?.Count)
		}
		const outputs = Array.isArray(message.Outputs) ? message.Outputs : []
		for (let index = 0; index < 8; index++) {
			const output = outputs[index] as Record<string, unknown> | undefined
			values[`output${index + 1}State`] = this.toVariableString(output?.State)
		}
		this.setVariableValues(values)
	}

	private toVariableString(value: unknown): string {
		if (value === undefined || value === null) return ''
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
		return JSON.stringify(value)
	}
}
