const networkConfig = {
    default: {
        name: "hardhat",
        keepersUpdateInterval: "30",
    },
    31337: {
        name: "localhost",
        subscriptionId: "588",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        raffleEntranceFee: "100000000000000000", // 0.1 ETH
        callbackGasLimit: "500000", // 500,000 gas
    },
    4: {
        name: "rinkeby",
        subscriptionId: "6926",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        raffleEntranceFee: "100000000000000000", // 0.1 ETH
        callbackGasLimit: "500000", // 500,000 gas
        priceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e"
    },
    1: {
        name: "mainnet",
        keepersUpdateInterval: "30",
        priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    },
    137: {
        name: "Matic mainnet",
        keepersUpdateInterval: "30",
        priceFeed: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"
    },
    80001: {
        name: "Mumbai Testnet",
        keepersUpdateInterval: "30",
        priceFeed: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada"
    },

}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
const frontEndContractsFile = "./contractAddresses.json"
const frontEndAbiFile = "./abi.json"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiFile,
}