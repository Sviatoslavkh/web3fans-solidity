const { getNamedAccounts, deployments, network, run } = require("hardhat")
const fs = require("fs")
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")

const { verify } = require("../utils/verify")

const frontEndContractsFile = "../contractaddresses.json"
const frontEndAbiFile = "../abi.json"

const FUND_AMOUNT = "1000000000000000000000"

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let priceFeed
    const version = 2

    if (chainId == 31337) {
        priceFeed = await ethers.getContract("MockV3Aggregator")
        priceFeed = priceFeed.address
    } else {
        priceFeed = networkConfig[chainId].priceFeed
    }

    const waitBlockConfirmations = developmentChains.includes(network.name)        
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS


        log("----------------------------------------------------")

        const creators = await deploy("Creators", {
            from: deployer,
            args: [version],
            log: true,
            waitConfirmations: waitBlockConfirmations,
        })
        let creatorsContractAdress = await ethers.getContract("Creators")
        creatorsContractAdress = creatorsContractAdress.address

        const subscriptions = await deploy("Subscriptions", {
            from: deployer,
            args: [priceFeed, creatorsContractAdress, version],
            log: true,
            waitConfirmations: waitBlockConfirmations,
        })
        let subscriptionsContractAddress = await ethers.getContract("Subscriptions")
        subscriptionsContractAddress = subscriptionsContractAddress.address

        const content = await deploy("Content", {
            from: deployer,
            args: [creatorsContractAdress, subscriptionsContractAddress, version],
            log: true,
            waitConfirmations: waitBlockConfirmations,
        })
        let contentContractAddress = await ethers.getContract("Content")
        contentContractAddress = contentContractAddress.address
        const main = await deploy("Main", {
            from: deployer,
            args: [priceFeed, creatorsContractAdress, subscriptionsContractAddress, contentContractAddress, version],
            log: true,
            waitConfirmations: waitBlockConfirmations,
        })

        let mainContract = await ethers.getContract("Main", deployer)
        let mainContractAddress = mainContract.address
    
        // Verify the deployment
        /*if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
            log("Verifying...")
            await verify(creators.address, [])
            await verify(subscriptions.address, [priceFeed, creatorsContractAdress])
            await verify(content.address, [creatorsContractAdress, subscriptionsContractAddress])
            await verify(main.address, [priceFeed, creatorsContractAdress, subscriptionsContractAddress, contentContractAddress])
        }*/
    

        log("----------------------------------------------------")
        if(chainId != 31337){

            let provider = new ethers.providers.JsonRpcProvider(network.config.url)
            let wallet = new ethers.Wallet(network.config.accounts[0], provider)
            console.log('got deployer wallet')
            let creatorsContract1 = await ethers.getContract("Creators", wallet)
            let walletCreatorsConnection = creatorsContract1.connect(wallet)
            let subscriptionsContract1 = await ethers.getContract("Subscriptions", wallet)
            let walletSubscriptionsConnection = subscriptionsContract1.connect(wallet)
            let contentContract1 = await ethers.getContract("Content", wallet)
            let walletContentConnection1 = contentContract1.connect(wallet)
            let mainContract = await ethers.getContract("Main", deployer)
            let mainContractAddress = mainContract.address
            let tx = await walletCreatorsConnection.setMainContract(mainContractAddress)
            await tx.wait(2)
            console.log('main contract added to creators contract')
            tx =await walletCreatorsConnection.setContentContract(contentContract1.address)
            await tx.wait(2)
            console.log('content contract added to creators contract')
            tx =await walletSubscriptionsConnection.setMainContract(mainContractAddress)
            await tx.wait(2)
            console.log('main contract added to subscriptions contract')
            tx =await walletContentConnection1.setMainContract(mainContractAddress)
            await tx.wait(2)
            console.log('main contract added to content contract')
            await fs.writeFileSync(frontEndAbiFile, mainContract.interface.format(ethers.utils.FormatTypes.json))
            

        }

        if (chainId == 4 || chainId == 80001) {
            log("Verifying...")
            await verify(mainContractAddress, [priceFeed, creatorsContractAdress, subscriptionsContractAddress, contentContractAddress, version])
            await verify(contentContractAddress, [creatorsContractAdress, subscriptionsContractAddress, version])
            await verify(subscriptionsContractAddress, [priceFeed, creatorsContractAdress, version])
            await verify(creatorsContractAdress, [version])
        }

        



        log("----------------------------------------------------")

}

module.exports.tags = ["all", "subscription"]