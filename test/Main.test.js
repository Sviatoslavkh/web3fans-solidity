const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Main subscriptions Unit Tests", function () {

        let accounts, message, deployer, creatorsContract, creatorsConnection, deployersCreatorsConnection, subscriptionsContract, subscriptionsContractConnection, creatorAddress, subscriptionsContractConnection2, subscriberAddress, contentContract, deployersContentConnection, mainContract, mainContractAddress, mainDeployerConnection, mainCreatorConnection, mainCreatorConnection2, mainSubscriberConnection, mainSubscriberConnection2, creatorName, creatorDescription, avatar, subscriptionPrice, contentName, contentDescription, contentType, link, subscriptionTime, subscriber


        async function sign(message){
        
            var messageBytes = ethers.utils.toUtf8Bytes(message);
            var messageBuffer = Buffer.from(messageBytes);
            var preamble = '\x19Ethereum Signed Message:\n' + messageBytes.length;
            var preambleBuffer = Buffer.from(preamble);
            var ethMessage = Buffer.concat([preambleBuffer, messageBuffer]);
            return ethers.utils.keccak256(ethMessage);
        }
        
        async function setUpCreators(deployersCreatorsConnection, deployer, creatorAddress){
        
            await deployersCreatorsConnection.setMainContract(deployer.address)
            await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, creatorAddress)

        }

        async function setUpSubscriptions(subscriptionsContractConnection, subscriptionsContractConnection2, subscriberAddress, creatorAddress){
        
            await subscriptionsContractConnection.setMainContract(accounts[1].address)
            await subscriptionsContractConnection2.buySubscription(creatorAddress, subscriberAddress, ethers.utils.parseEther((10/2000.0).toString()))

        }

        async function setUpContent(deployersContentConnection, mainContentConnection, creatorAddress){

            
        
            await deployersContentConnection.setMainContract(accounts[1].address)
            await deployersCreatorsConnection.setContentContract(contentContract.address)
            await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)

        }

        beforeEach(async () => {
            
            message = 'hello'
            creatorName = 'Test Name'
            creatorDescription = 'Test Description'
            avatar = 'https://1234'
            subscriptionPrice = 10
            contentName = 'Test content Name'
            contentDescription = 'Test content Description'
            contentType = 0
            link = 'https://1234'
            subscriptionTime = 30*24*60*60

            accounts = await ethers.getSigners() // could also do with getNamedAccounts
            deployer = accounts[0]
            
            await deployments.fixture(["all"])
            creatorsContract = await ethers.getContract("Creators", deployer)
            deployersCreatorsConnection = creatorsContract.connect(deployer)
            
            creatorAddress = accounts[1].address
            //await setUpCreators(deployersCreatorsConnection, deployer, creatorAddress)

            subscriptionsContract = await ethers.getContract("Subscriptions", deployer)
            subscriptionsContractConnection = subscriptionsContract.connect(deployer)
            //subscriptionsContractConnection2 = subscriptionsContract.connect(accounts[1])
            subscriber = accounts[2]
            subscriberAddress = accounts[2].address
            //await setUpSubscriptions(subscriptionsContractConnection, subscriptionsContractConnection2, subscriberAddress, creatorAddress)

            contentContract = await ethers.getContract("Content", deployer)
            deployersContentConnection = contentContract.connect(deployer)
            //mainContentConnection = contentContract.connect(accounts[1])

            //await setUpContent(deployersContentConnection, mainContentConnection, creatorAddress)
            
            mainContract = await ethers.getContract("Main", deployer)
            mainContractAddress = mainContract.address
            mainDeployerConnection = mainContract.connect(deployer)
            mainCreatorConnection = mainContract.connect(accounts[1])
            mainCreatorConnection2 = mainContract.connect(accounts[3])
            mainSubscriberConnection = mainContract.connect(accounts[2])
            mainSubscriberConnection2 = mainContract.connect(accounts[4])


            await deployersCreatorsConnection.setMainContract(mainContractAddress)
            await deployersCreatorsConnection.setContentContract(contentContract.address)
            await subscriptionsContractConnection.setMainContract(mainContractAddress)
            await deployersContentConnection.setMainContract(mainContractAddress)

        })

        describe("Price test", function () {
            it("Get current exchange rate", async () => {
                let price = await mainCreatorConnection.getPriceLevel();
                assert.equal(ethers.utils.formatEther( price ), 2000)
                
            })
    
            it("Get usd price in ETH", async () => {
                let price = await mainCreatorConnection.getUSDPriceInCoins(1);
    
                assert.equal(ethers.utils.formatEther( price ), 0.0005)
    
                price = await mainCreatorConnection.getUSDPriceInCoins(2000);
                assert.equal(ethers.utils.formatEther( price ), 1)
    
            })
    
         })


         describe("Creators", function () {
            it("Registration", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)

                await expect( 
                    mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                ).to.be.revertedWith(
                    'Creators__creatorAlreadyExists()'
                  )
                
                
            })
    
            it("Find creator data", async () => {

                await expect( 
                    mainCreatorConnection.findCreatorDataByAdress(accounts[1].address)
                ).to.be.reverted.revertedWith(
                    'Main__creatorNotFound()'
                  )

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)

 
                let creatorData = await mainCreatorConnection.findCreatorDataByAdress(accounts[1].address)

                assert.equal(creatorData[0], creatorName)
                assert.equal(creatorData[1], creatorDescription)
                assert.equal(creatorData[2], avatar)
                assert.equal(creatorData[3], accounts[1].address)
                assert.equal(creatorData[4], subscriptionPrice)
                assert.equal(creatorData[5].length, 0)

            })

            it("Update", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.updateCreator('abcde', 'abcd', 'abc', 5)
                
            })

            it("Delete", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.deleteCreator()
                
            })

            it("Retrieve", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.deleteCreator()
                await mainCreatorConnection.retrieveCreator()
                
            })

            it("Get creators ID", async () => {
                for(let i = 6; i < 16; i++){
                    let connectionTmp = mainContract.connect(accounts[i])
                    await connectionTmp.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                  }

                  let creatorsAddresses = await mainCreatorConnection.getCreatorsIDs(0, 5);

                    assert.equal(creatorsAddresses[0].length, 5)
                    assert.equal(creatorsAddresses[0][0], accounts[6].address)
                    assert.equal(creatorsAddresses[1], '5')
                    assert.equal(creatorsAddresses[2].toNumber(), 5)
            
                
            })
    
         })

         describe("Content", function () {
            it("Add content", async () => {

                await expect( 
                    mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                ).to.be.reverted.revertedWith(
                    'Main__creatorNotFound()'
                  )

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)

                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                
                
            })


            it("Update content", async () => {

                await expect( 
                    mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                ).to.be.reverted.revertedWith(
                    'Main__creatorNotFound()'
                  )

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)

                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)

                await mainCreatorConnection.updateContent(0, contentName, contentDescription, contentType, link)
                
                
            })

            it("Delete content", async () => {

                await expect( 
                    mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                ).to.be.reverted.revertedWith(
                    'Main__creatorNotFound()'
                  )

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)

                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)

                await mainCreatorConnection.deleteContent(0)
                
                
            })
    
            it("Check content existance", async () => {



                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                
                let creatorData = await mainCreatorConnection.findCreatorDataByAdress(accounts[1].address)

                assert.equal(creatorData[5].length, 2)
                assert.equal(creatorData[5][0], 0)
                assert.equal(creatorData[5][1], 1)

            })
    
         })


         describe("Subscription", function () {
            it("Buy subscription", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                await expect( 
                    mainSubscriberConnection.buySubscription(accounts[3].address)
                ).to.be.reverted.revertedWith(
                    'Main__creatorNotFound()'
                  )
                  
                  await expect( 
                    mainSubscriberConnection.buySubscription(accounts[1].address)
                ).to.be.reverted.revertedWith(
                    'Subscriptions__notEnoughMoneySent()'
                  )

                  await expect( 
                    mainSubscriberConnection.getSubscriptionByCreatorAddress(accounts[1].address, accounts[2].address)
                ).to.be.reverted

                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)

                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                //console.log(ethers.utils.formatEther(options.value))

                await mainSubscriberConnection.buySubscription(accounts[1].address, options)

                let subsInfo = await mainSubscriberConnection.getSubscriptionByCreatorAddress(accounts[1].address, accounts[2].address)
                
                assert.equal(subsInfo[0], accounts[1].address)
                assert.equal(subsInfo[1], accounts[2].address)
                assert.isAbove(subsInfo[2], Math.floor(Date.now() / 1000) + subscriptionTime - 30)
                assert.equal(subsInfo[3], true)
                
            })

            it("Get subscription content ids", async () => {
                
                await expect( 
                    mainSubscriberConnection.getSubscriptionContent(accounts[1].address, accounts[2].address)
                ).to.be.reverted
                
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)

                await expect( 
                    mainSubscriberConnection.getSubscriptionContent(accounts[1].address, accounts[2].address)
                ).to.be.reverted

                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                


                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)

                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}

                await mainSubscriberConnection.buySubscription(accounts[1].address, options)

                let subsContent = await mainSubscriberConnection.getSubscriptionContent(accounts[1].address, accounts[2].address)

                assert.equal(subsContent.length, 1)
                assert.equal(subsContent[0], 0)
            })

            it("Get subscription content", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)

                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                //console.log(ethers.utils.formatEther(options.value))

                await mainSubscriberConnection.buySubscription(accounts[1].address, options)

                let subsContentIDs = await mainSubscriberConnection.getSubscriptionContent(accounts[1].address, accounts[2].address)


                let signature = await subscriber.signMessage(message)

                let subsContent = await mainSubscriberConnection.getContent(subsContentIDs[0], signature, sign(message))

                assert.equal(subsContent[0], contentName)
                assert.equal(subsContent[1], contentDescription)
                assert.equal(subsContent[2], contentType.toString())
                assert.equal(subsContent[3], link)

            })

            it("Get content as a creator", async () => {

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)


                  let signature = await accounts[1].signMessage(message)

                  let creatorData = await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)

                let subsContent = await mainSubscriberConnection.getContent(creatorData[5][0], signature, sign(message))

                assert.equal(subsContent[0], contentName)
                assert.equal(subsContent[1], contentDescription)
                assert.equal(subsContent[2], contentType.toString())
                assert.equal(subsContent[3], link)
                

            })

            it("Get subscription content without active subscription", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)

                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                //console.log(ethers.utils.formatEther(options.value))

                await mainSubscriberConnection.buySubscription(accounts[1].address, options)

                let subsContentIDs = await mainSubscriberConnection.getSubscriptionContent(accounts[1].address, accounts[2].address)

                  let signature = await accounts[3].signMessage(message)

                await expect( 
                    mainSubscriberConnection.getContent(subsContentIDs[0], signature, sign(message))
                ).to.be.reverted

                signature = await accounts[2].signMessage(message)
                await ethers.provider.send("evm_increaseTime", [subscriptionTime])
                await ethers.provider.send("evm_mine", [])

                await expect( 
                    mainSubscriberConnection.getContent(subsContentIDs[0], signature, sign(message))
                ).to.be.reverted

            })

            it("Get follower subscriptions", async () => {
                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)

                let followerSubscriptions = await mainSubscriberConnection.getFollowerSubscriptions(accounts[2].address)

                assert.equal(followerSubscriptions.length, 0)

                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)

                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                //console.log(ethers.utils.formatEther(options.value))

                await mainSubscriberConnection.buySubscription(accounts[1].address, options)

                followerSubscriptions = await mainSubscriberConnection.getFollowerSubscriptions(accounts[2].address)

                assert.equal(followerSubscriptions.length, 1)
                assert.equal(followerSubscriptions[0], accounts[1].address)


            })


         })

         describe("Contract balance", function () {
            it("Get contract balance", async () => {


                let signature = await deployer.signMessage(message)

                let balance = await mainDeployerConnection.getContractBalance(signature, sign(message))
                assert.equal(ethers.utils.formatEther( balance ), 0)

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)
                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                await mainSubscriberConnection.buySubscription(accounts[1].address, options)
                
                balance = await mainDeployerConnection.getContractBalance(signature, sign(message))
                assert.equal(ethers.utils.formatEther( balance ), (subscriptionPrice/20/2000))

                signature = await accounts[2].signMessage(message)
                
                await expect( 
                    mainDeployerConnection.getContractBalance(signature, sign(message))
                ).to.be.reverted.revertedWith(
                    'Main__NotOwner()'
                )
                
            })

            it("Withdraw contract balance", async () => {

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)
                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                await mainSubscriberConnection.buySubscription(accounts[1].address, options)

                let signature = await deployer.signMessage(message)

                let balance = await mainDeployerConnection.getContractBalance(signature, sign(message))

                let deployerbalanceBefore = await deployer.getBalance();
                let transactionResponse = await mainDeployerConnection.contractWithdraw();
                let deployerbalanceAfter = await deployer.getBalance();
                const transactionReceipt = await transactionResponse.wait()
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const withdrawGasCost = gasUsed.mul(effectiveGasPrice)

                assert.equal(deployerbalanceAfter.toString().substring(0, 4), deployerbalanceBefore.add(balance).add(withdrawGasCost).toString().substring(0, 4))
            

                
                
            })



         })

         describe("Creator balance", function () {
            it("Get creator balance", async () => {

                let signature = await accounts[1].signMessage(message)

                await expect( 
                    mainCreatorConnection.getContractBalance(signature, sign(message))
                ).to.be.reverted

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)

                let balance = await mainCreatorConnection.getCreatorBalance(signature, sign(message))
                assert.equal(ethers.utils.formatEther( balance ), 0)

                
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)
                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                await mainSubscriberConnection.buySubscription(accounts[1].address, options)

                balance = await mainCreatorConnection.getCreatorBalance(signature, sign(message))
                assert.equal(ethers.utils.formatEther( balance ), (creatorData[4]/2000*0.95))

                signature = await accounts[2].signMessage(message)
                
                await expect( 
                    mainCreatorConnection.getContractBalance(signature, sign(message))
                ).to.be.reverted
                
            })


            it("Withdraw creator balance", async () => {

                let signature = await accounts[1].signMessage(message)

                await mainCreatorConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice)
                await mainCreatorConnection.addContent(contentName, contentDescription, contentType, link)
                let creatorData =  await mainSubscriberConnection.findCreatorDataByAdress(accounts[1].address)
                let options = {value: ethers.utils.parseEther((creatorData[4]/2000.0).toString())}
                await mainSubscriberConnection.buySubscription(accounts[1].address, options)
                
                let balance = await mainCreatorConnection.getCreatorBalance(signature, sign(message))

                let creatorbalanceBefore = await accounts[1].getBalance();

                let transactionResponse = await mainCreatorConnection.creatorWithdraw();

                const transactionReceipt = await transactionResponse.wait()
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const withdrawGasCost = gasUsed.mul(effectiveGasPrice)

                let creatorbalanceAfter = await accounts[1].getBalance();

                assert.equal(creatorbalanceAfter.toString().substring(0, 6), creatorbalanceBefore.add(balance).add(withdrawGasCost).toString().substring(0, 6))
                        
                
            })

         })


    })