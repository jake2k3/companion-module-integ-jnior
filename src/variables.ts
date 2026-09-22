import type ModuleInstance from './main.js'

export type VariablesSchema = {
	model: string
	version: string
	serialNumber: string
	timestamp: string
	input1State: string
	input1Count: string
	input2State: string
	input2Count: string
	input3State: string
	input3Count: string
	input4State: string
	input4Count: string
	input5State: string
	input5Count: string
	input6State: string
	input6Count: string
	input7State: string
	input7Count: string
	input8State: string
	input8Count: string
	output1State: string
	output2State: string
	output3State: string
	output4State: string
	output5State: string
	output6State: string
	output7State: string
	output8State: string
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions({
		model: { name: 'Model' },
		version: { name: 'JANOS Version' },
		serialNumber: { name: 'Serial Number' },
		timestamp: { name: 'Monitor Timestamp' },
		input1State: { name: 'Input 1 State' },
		input1Count: { name: 'Input 1 Count' },
		input2State: { name: 'Input 2 State' },
		input2Count: { name: 'Input 2 Count' },
		input3State: { name: 'Input 3 State' },
		input3Count: { name: 'Input 3 Count' },
		input4State: { name: 'Input 4 State' },
		input4Count: { name: 'Input 4 Count' },
		input5State: { name: 'Input 5 State' },
		input5Count: { name: 'Input 5 Count' },
		input6State: { name: 'Input 6 State' },
		input6Count: { name: 'Input 6 Count' },
		input7State: { name: 'Input 7 State' },
		input7Count: { name: 'Input 7 Count' },
		input8State: { name: 'Input 8 State' },
		input8Count: { name: 'Input 8 Count' },
		output1State: { name: 'Relay 1 State' },
		output2State: { name: 'Relay 2 State' },
		output3State: { name: 'Relay 3 State' },
		output4State: { name: 'Relay 4 State' },
		output5State: { name: 'Relay 5 State' },
		output6State: { name: 'Relay 6 State' },
		output7State: { name: 'Relay 7 State' },
		output8State: { name: 'Relay 8 State' },
	})
}
