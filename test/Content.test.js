const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")



!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Content contract Unit Tests", function () {

       
        let accounts, message, deployer, creatorsContract, creatorsConnection, deployersCreatorsConnection, subscriptionsContract, subscriptionsContractConnection, creatorAddress, subscriptionsContractConnection2, subscriberAddress, contentContract, deployersContentConnection, mainContentConnection, contentName, contentDescription, contentType, link


        async function sign(message){
        
          var messageBytes = ethers.utils.toUtf8Bytes(message);
          var messageBuffer = Buffer.from(messageBytes);
          var preamble = '\x19Ethereum Signed Message:\n' + messageBytes.length;
          var preambleBuffer = Buffer.from(preamble);
          var ethMessage = Buffer.concat([preambleBuffer, messageBuffer]);
          return ethers.utils.keccak256(ethMessage);
      }
        
        async function setUpCreators(deployersCreatorsConnection, deployer, creatorAddress){

            const creatorName = 'Test Name'
            const creatorDescription = 'Test Description'
            const avatar = 'https://1234'
            const subscriptionPrice = 10
        
            await deployersCreatorsConnection.setMainContract(deployer.address)
            await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, creatorAddress)
            await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[6].address)

        }

        async function setUpSubscriptions(subscriptionsContractConnection, subscriptionsContractConnection2, subscriberAddress, creatorAddress){
        
            await subscriptionsContractConnection.setMainContract(accounts[1].address)
            await subscriptionsContractConnection2.buySubscription(creatorAddress, subscriberAddress, ethers.utils.parseEther((10/2000.0).toString()))

        }

        beforeEach(async () => {

            message = 'hello'
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
            subscriberAddress = accounts[2].address
            await setUpSubscriptions(subscriptionsContractConnection, subscriptionsContractConnection2, subscriberAddress, creatorAddress)

            contentContract = await ethers.getContract("Content", deployer)
            deployersContentConnection = contentContract.connect(deployer)
            mainContentConnection = contentContract.connect(accounts[1])

            contentName = 'Test content Name'
            contentDescription = 'Test content Description'
            contentType = 0
            link = 'https://1234'

            
        })

        describe("Set up", function () {
            it("Set main contract", async () => {
                
                await expect( mainContentConnection.setMainContract(
                    accounts[3].address
                )).to.be.revertedWith(
                    'Content__notOwner()'
                  )

                  await deployersContentConnection.setMainContract(accounts[1].address)
                  await deployersContentConnection.setMainContract(accounts[2].address)
                  await deployersContentConnection.setMainContract(accounts[3].address)
                
            })

        })


        describe("Add content", function () {
            it("Add content", async () => {

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)

                await expect( 
                    deployersContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)
                ).to.be.revertedWith(
                    'Content__notMainContract()'
                  )

                await expect( 
                    mainContentConnection.addContent(contentName, contentDescription, contentType, link, accounts[1].address)
                ).to.be.revertedWith(
                    'Content__creatorNotFound()'
                  )

                  await expect( 
                     mainContentConnection.addContent(contentName, contentDescription, 2, link, creatorAddress)
                ).to.be.revertedWith(
                    'Content__contentTypeNotExist()'
                  )

                  await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)
                

            })


            it("Check content connection", async () => {

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)

                let creatorData = await deployersCreatorsConnection.findCreatorDataByAdress(creatorAddress)
                assert.equal(creatorData[5].length, 0)

                await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)

                creatorData = await deployersCreatorsConnection.findCreatorDataByAdress(creatorAddress)
                assert.equal(creatorData[5].length, 1)
                assert.equal(creatorData[5][0], 0)
                

            })

        })

        describe("Get content", function () {
            it("Get subscription content", async () => {

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)

                await mainContentConnection.addContent('Name1', contentDescription, contentType, link, creatorAddress)
                await mainContentConnection.addContent('Name2', contentDescription, contentType, link, creatorAddress)
                await mainContentConnection.addContent('Name3', contentDescription, contentType, link, creatorAddress)

                let contentIDs = await mainContentConnection.getSubscriptionContent(subscriberAddress, creatorAddress)
                assert.equal(contentIDs.length, 3)
                

            })

            it("Get by id and signature", async () => {

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)

                await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)

                let contentIDs = await mainContentConnection.getSubscriptionContent(subscriberAddress, creatorAddress)
                assert.equal(contentIDs.length, 1)


                  let signature = await accounts[2].signMessage(message)

                  let contentData = await mainContentConnection.getContent(contentIDs[0], signature, sign(message)) 

                    assert.equal(contentData[0], contentName)
                    assert.equal(contentData[1], contentDescription)
                    assert.equal(contentData[2], contentType.toString())
                    assert.equal(contentData[3], link)
                

            })

            it("Get by id as a creator", async () => {

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)

                await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)

                let contentIDs = await mainContentConnection.getSubscriptionContent(subscriberAddress, creatorAddress)
                assert.equal(contentIDs.length, 1)


                  let signature = await accounts[3].signMessage(message)

                  let contentData = await mainContentConnection.getContent(contentIDs[0], signature, sign(message)) 

                    assert.equal(contentData[0], contentName)
                    assert.equal(contentData[1], contentDescription)
                    assert.equal(contentData[2], contentType.toString())
                    assert.equal(contentData[3], link)
                

            })

            it("Get by with wrong signature", async () => {

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)

                await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)

                let contentIDs = await mainContentConnection.getSubscriptionContent(subscriberAddress, creatorAddress)

                  let signature = await accounts[1].signMessage('123abc')

                  await expect( 
                    mainContentConnection.getContent(contentIDs[0], signature, sign(message)) 
                ).to.be.reverted

                  signature = await accounts[1].signMessage(message)

                  await expect( 
                    mainContentConnection.getContent(contentIDs[0], signature, sign(message)) 
                ).to.be.reverted

            })

            it("Get by with wrong id", async () => {

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)

                  let signature = await accounts[2].signMessage(message)

                  await expect( 
                    mainContentConnection.getContent(123, signature, sign(message)) 
                ).to.be.revertedWith(
                    'Content__notExist()'
                  )
                

                  await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)

                  await expect( 
                    mainContentConnection.getContent(123, signature, sign(message)) 
                ).to.be.revertedWith(
                    'Content__notFound()'
                  )
                

            })


        })

        describe("Update and delete contract", function () {
            it("Update content", async () => {

                let contentName1 = 'test1'
                let contentDescription1 = 'testdesc1'
                let contentType1 = 0
                let link1 = 'testdesc12'

                let contentName2 = 'test12'
                let contentDescription2 = 'testdesc12'
                let contentType2 = 0
                let link2 = 'testdesc123'

                let contentName3 = 'test123'
                let contentDescription3 = 'testdesc123'
                let contentType3 = 1
                let link3 = 'testdesc1234'
                
                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)
                await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)
                await mainContentConnection.addContent(contentName1, contentDescription1, contentType1, link1, creatorAddress)
                await mainContentConnection.addContent(contentName2, contentDescription2, contentType2, link2, creatorAddress)

                let contentIDs = await mainContentConnection.getSubscriptionContent(subscriberAddress, creatorAddress)
                assert.equal(contentIDs.length, 3)

                  let signature = await accounts[3].signMessage(message)

                  await mainContentConnection.updateContent(contentIDs[0], contentName3, contentDescription3, contentType3, link3, creatorAddress )
                  let contentData = await mainContentConnection.getContent(contentIDs[0], signature, sign(message)) 

                  assert.equal(contentData[0], contentName3)
                  assert.equal(contentData[1], contentDescription3)
                  assert.equal(contentData[2], contentType3.toString())
                  assert.equal(contentData[3], link3)

                  await expect( 
                    mainContentConnection.updateContent(123, contentName3, contentDescription3, contentType3, link3, creatorAddress)
                ).to.be.revertedWith(
                    'Content__notFound()'
                  )

                  await expect( 
                    mainContentConnection.updateContent(1, contentName3, contentDescription3, contentType3, link3, accounts[5].address)
                ).to.be.revertedWith(
                    'Content__creatorNotFound()'
                  )
                  
                  await expect( 
                    mainContentConnection.updateContent(1, contentName3, contentDescription3, contentType3, link3, accounts[6].address)
                ).to.be.revertedWith(
                    'Content__creatorNotFound()'
                  )
                
            })

            it("Remove content", async () => {

                let contentName1 = 'test1'
                let contentDescription1 = 'testdesc1'
                let contentType1 = 0
                let link1 = 'testdesc12'

                let contentName2 = 'test12'
                let contentDescription2 = 'testdesc12'
                let contentType2 = 0
                let link2 = 'testdesc123'

                await deployersContentConnection.setMainContract(accounts[1].address)
                await deployersCreatorsConnection.setContentContract(contentContract.address)
                await mainContentConnection.addContent(contentName, contentDescription, contentType, link, creatorAddress)
                await mainContentConnection.addContent(contentName1, contentDescription1, contentType1, link1, creatorAddress)
                await mainContentConnection.addContent(contentName2, contentDescription2, contentType2, link2, creatorAddress)

                let contentIDs = await mainContentConnection.getSubscriptionContent(subscriberAddress, creatorAddress)
                assert.equal(contentIDs.length, 3)

                await mainContentConnection.removeContent(contentIDs[0],  creatorAddress)

                contentIDs = await mainContentConnection.getSubscriptionContent(subscriberAddress, creatorAddress)
                assert.equal(contentIDs.length, 2)

                await expect( 
                    mainContentConnection.removeContent(123,  creatorAddress)
                ).to.be.revertedWith(
                    'Content__notFound()'
                  )

                  await expect( 
                    mainContentConnection.removeContent(1,  accounts[5].address)
                ).to.be.revertedWith(
                    'Content__creatorNotFound()'
                  )
                  
                  await expect( 
                    mainContentConnection.removeContent(1, accounts[6].address)
                ).to.be.revertedWith(
                    'Content__creatorNotFound()'
                  )
                
            })

        })
        

    })