const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")



!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Subscriptions Unit Tests", function () {

       
        let accounts, deployer, creatorsContract, creatorsConnection, deployersCreatorsConnection, subscriptionsContract, subscriptionsContractConnection, creatorAddress, subscriptionsContractConnection2, subscriptionTime

        
        async function setUpCreators(deployersCreatorsConnection, deployer, creatorAddress){

            const creatorName = 'Test Name'
            const creatorDescription = 'Test Description'
            const avatar = 'https://1234'
            const subscriptionPrice = 10
        
            await deployersCreatorsConnection.setMainContract(deployer.address)
            await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, creatorAddress)
            await deployersCreatorsConnection.addContentToCreator(creatorAddress, 0)
        }

        beforeEach(async () => {
            accounts = await ethers.getSigners() // could also do with getNamedAccounts
            deployer = accounts[0]
            await deployments.fixture(["all"])
            creatorsContract = await ethers.getContract("Creators", deployer)
            deployersCreatorsConnection = creatorsContract.connect(deployer)
            
            creatorAddress = accounts[3].address
            await setUpCreators(deployersCreatorsConnection, deployer, creatorAddress)

            subscriptionsContract = await ethers.getContract("Subscriptions", deployer)
            subscriptionsContractConnection = subscriptionsContract.connect(deployer)
            subscriptionsContractConnection2 = subscriptionsContract.connect(accounts[1])

            subscriptionTime = 30*24*60*60
            
        })

        describe("Set up", function () {
            it("Set main contract", async () => {
                
                await expect( subscriptionsContractConnection2.setMainContract(
                    accounts[3].address
                )).to.be.revertedWith(
                    'Subscriptions__notOwner()'
                  )

                  await subscriptionsContractConnection.setMainContract(accounts[3].address)
                  await subscriptionsContractConnection.setMainContract(deployer.address)
                
            })

        })

        describe("Subscription purchase", function () {

            it("Buy subscription", async () => {


                  await subscriptionsContractConnection.setMainContract(accounts[1].address)

                  await expect( subscriptionsContractConnection.buySubscription(
                    creatorAddress, accounts[2].address, 10
                    )).to.be.revertedWith(
                    'Subscriptions__notMainContract()'
                  )

                  await expect( subscriptionsContractConnection2.buySubscription(
                    accounts[4].address, accounts[4].address, 10
                    )).to.be.revertedWith(
                    'Subscriptions__creatorNotFound()'
                  )

                  await expect( subscriptionsContractConnection2.buySubscription(
                    creatorAddress, accounts[3].address, 0
                    )).to.be.revertedWith(
                    'Subscriptions__notEnoughMoneySent()'
                  )

                  await expect( subscriptionsContractConnection2.buySubscription(
                    creatorAddress, accounts[3].address, ethers.utils.parseEther((5/2000.0).toString())
                    )).to.be.revertedWith(
                    'Subscriptions__notEnoughMoneySent()'
                  )
                        
                  await subscriptionsContractConnection2.buySubscription(creatorAddress, accounts[2].address, ethers.utils.parseEther((10/2000.0).toString()))
                
            })
    
         })

         describe("Get subscription info", function () {

            it("Get basic info", async () => {

                await subscriptionsContractConnection.setMainContract(accounts[1].address)

                await expect( subscriptionsContractConnection2.getSubscriptionInfo(
                    creatorAddress, accounts[2].address
                    )).to.be.revertedWith(
                    'Subscriptions__noSubscriptions()'
                  )
                
                  await subscriptionsContractConnection2.buySubscription(creatorAddress, accounts[2].address, ethers.utils.parseEther((10/2000.0).toString()))

                
                  await expect( subscriptionsContractConnection2.getSubscriptionInfo(
                    creatorAddress, accounts[3].address
                    )).to.be.revertedWith(
                    'Subscriptions__notFound()'
                  )

                  await expect( subscriptionsContractConnection2.getSubscriptionInfo(
                    accounts[5].address, accounts[3].address
                    )).to.be.revertedWith(
                    'Subscriptions__notFound()'
                  )

                let subsInfo = await subscriptionsContractConnection2.getSubscriptionInfo(creatorAddress, accounts[2].address)


                assert.isAbove(subsInfo[0], Math.floor(Date.now() / 1000) + subscriptionTime - 30)
                assert.equal(subsInfo[1], true)

                await subscriptionsContractConnection2.buySubscription(creatorAddress, accounts[2].address, ethers.utils.parseEther((10*2/2000.0).toString()))
                        
                subsInfo = await subscriptionsContractConnection2.getSubscriptionInfo(creatorAddress, accounts[2].address)

                assert.isAbove(subsInfo[0], Math.floor(Date.now() / 1000) + subscriptionTime*2 - 30)
                assert.equal(subsInfo[1], true)
                
            })

            it("Prolongue", async () => {

                await subscriptionsContractConnection.setMainContract(accounts[1].address)
                
                await subscriptionsContractConnection2.buySubscription(creatorAddress, accounts[2].address, ethers.utils.parseEther((10/2000.0).toString()))
                await subscriptionsContractConnection2.buySubscription(creatorAddress, accounts[2].address, ethers.utils.parseEther((10/2000.0).toString()))

                let subsInfo = await subscriptionsContractConnection2.getSubscriptionInfo(creatorAddress, accounts[2].address)
                
                assert.isAbove(subsInfo[0], Math.floor(Date.now() / 1000) + subscriptionTime*2 - 30)
                assert.equal(subsInfo[1], true)

                await ethers.provider.send("evm_increaseTime", [subscriptionTime*2])
                await ethers.provider.send("evm_mine", [])

                subsInfo = await subscriptionsContractConnection2.getSubscriptionInfo(creatorAddress, accounts[2].address)
                assert.equal(subsInfo[1], false)

                await subscriptionsContractConnection2.buySubscription(creatorAddress, accounts[2].address, ethers.utils.parseEther((10/2000.0).toString()))
                subsInfo = await subscriptionsContractConnection2.getSubscriptionInfo(creatorAddress, accounts[2].address)
                assert.isAbove(subsInfo[0], Math.floor(Date.now() / 1000) + subscriptionTime - 30)
                assert.equal(subsInfo[1], true)
                        
                
            })
    
         })

        

    })