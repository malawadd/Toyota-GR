export const formatBytes = (bytes, decimals = 2) => {
	if (!+bytes) return "0 Byte"

	const dm = decimals < 0 ? 0 : decimals
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]

	const i = Math.floor(Math.log(bytes) / Math.log(1024))

	return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(dm))} ${sizes[i]}`
}

export const getExplorerURL = (network) => {
	const explorers = {
		mainnet: "https://etherscan.io",
		base: "https://basescan.org",
		swell: "https://explorer.swellnetwork.io",
		sonic: "https://sonicscan.org",
		bob: "https://explorer.gobob.xyz",
		berachain: "https://berascan.com",
		avalanche: "https://snowtrace.io",
		arbitrum: "https://arbiscan.io",
		unichain: "https://unichain.blockscout.com",
		ink: "https://explorer.inkonchain.com",
		bsc: "https://bscscan.com",
		hyperevm: "https://purrsec.com",
		optimism: "https://optimistic.etherscan.io",
		gnosis: "https://gnosisscan.io",
		worldchain: "https://worldscan.org",
		tacturin: "https://tac-turin.blockscout.com"
	}
	
	return explorers[network] || explorers.mainnet
}

export const getCeleniumURL = (network) => {
	switch (network) {
		case "mainnet":
			return "https://celenium.io"

		case "mocha":
			return "https://mocha.celenium.io"

		case "arabica":
			return "https://arabica.celenium.io"
	}
}