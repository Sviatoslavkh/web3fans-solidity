const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Creators Unit Tests", function () {
       
        let accounts, deployer, creatorsContract, creatorsConnection, deployersCreatorsConnection, creatorName, creatorDescription, avatar, subscriptionPrice

        beforeEach(async () => {
            accounts = await ethers.getSigners() // could also do with getNamedAccounts
            deployer = accounts[0]
            await deployments.fixture(["all"])
            creatorsContract = await ethers.getContract("Creators", deployer)
            creatorsConnection = creatorsContract.connect(accounts[1])
            deployersCreatorsConnection = creatorsContract.connect(deployer)
            creatorName = 'Test Name'
            creatorDescription = 'Test Description'
            avatar = 'https://1234'
            subscriptionPrice = 10
        })

        describe("Set up", function () {
            it("Set main contract", async () => {
                
                await expect( creatorsConnection.setMainContract(
                    accounts[3].address
                )).to.be.revertedWith(
                    'Creators__notOwner()'
                  )

                  await deployersCreatorsConnection.setMainContract(accounts[3].address)
                  await deployersCreatorsConnection.setMainContract(deployer.address)
                
            })
    
    
         })

         describe("Creator registration", function () {
            it("New creator registration", async () => {
                
                await deployersCreatorsConnection.setMainContract(deployer.address)
                  await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[3].address)
                  


                  await expect(
                    deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[3].address)
                  ).to.be.revertedWith(
                    'Creators__creatorAlreadyExists()'
                  )
                
            })

            it("Get creator info", async () => {
                
                await deployersCreatorsConnection.setMainContract(deployer.address)
                await expect(
                    deployersCreatorsConnection.findCreatorIDByAdress(accounts[3].address)
                  ).to.be.revertedWith(
                    'Creators__creatoreNotFound()'
                  )

                  await expect(
                    deployersCreatorsConnection.findCreatorDataByAdress(accounts[3].address)
                  ).to.be.revertedWith(
                    'Creators__creatoreNotFound()'
                  )

                await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[1].address)
                await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[2].address)
                await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[3].address)
                
                let creatorid = await deployersCreatorsConnection.findCreatorIDByAdress(accounts[1].address)
                assert.equal(creatorid, 0)
                creatorid = await deployersCreatorsConnection.findCreatorIDByAdress(accounts[2].address)
                assert.equal(creatorid, 1)
                creatorid = await deployersCreatorsConnection.findCreatorIDByAdress(accounts[3].address)
                assert.equal(creatorid, 2)

                let creatorData = await deployersCreatorsConnection.findCreatorDataByAdress(accounts[3].address)
                
                assert.equal(creatorData[0], creatorName)
                assert.equal(creatorData[1], creatorDescription)
                assert.equal(creatorData[2], avatar)
                assert.equal(creatorData[3], accounts[3].address)
                assert.equal(creatorData[4], subscriptionPrice.toString())
                assert.equal(creatorData[5].length, 0)

              
          })


          it("Get creators addresses", async () => {
                
            await deployersCreatorsConnection.setMainContract(deployer.address)

            await expect(
              deployersCreatorsConnection.getCreatorsIDs(0, 20)
            ).to.be.revertedWith(
              'Creators__creatorsEnded()'
            )

            await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[1].address)

            let creatorsAddresses = await deployersCreatorsConnection.getCreatorsIDs(0, 20)

              assert.equal(creatorsAddresses[0].length, 1)
              assert.equal(creatorsAddresses[0][0], accounts[1].address)
              assert.equal(creatorsAddresses[1], '0')
            
              await deployersCreatorsConnection.changeCreatorVisibility(false, accounts[1].address)
            
            for(let i = 2; i < 10; i++){
              await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[i].address)
              await deployersCreatorsConnection.changeCreatorVisibility(false, accounts[i].address)
            }

            for(let i = 0; i < 200; i++){
              wallet = ethers.Wallet.createRandom();
              wallet =  wallet.connect(ethers.provider);
              await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, wallet.address)
            }

            let creatorsLeft = true
            let creators = []


            let nextIndex = 0;

            let n = 0

            while(creatorsLeft){
              creatorsAddresses = await deployersCreatorsConnection.getCreatorsIDs(nextIndex, 20)
              creators.push.apply(creators, creatorsAddresses[0])
              nextIndex = creatorsAddresses[2].toNumber()
              n++

              if(creatorsAddresses[1].toNumber() == 0){
                break
              }
            }

            assert.equal(creators.length, 200)
            assert.equal(creatorsAddresses[1], '0')

            creatorsAddresses = await deployersCreatorsConnection.getCreatorsIDs(0, 5)
            assert.equal(creatorsAddresses[0].length, 5)
            assert.equal(creatorsAddresses[1], '195')

            creatorsAddresses = await deployersCreatorsConnection.getCreatorsIDs(50, 15)
            assert.equal(creatorsAddresses[0].length, 15)
            assert.equal(creatorsAddresses[1], '144')

            creatorsAddresses = await deployersCreatorsConnection.getCreatorsIDs(195, 20)
            assert.equal(creatorsAddresses[0].length, 14)
            assert.equal(creatorsAddresses[1], '0')

            creatorsAddresses = await deployersCreatorsConnection.getCreatorsIDs(0, 200)
            assert.equal(creatorsAddresses[0].length, 20)
            assert.equal(creatorsAddresses[1], '180')


          })

          it("Content creator update", async () => {
                
            await deployersCreatorsConnection.setMainContract(deployer.address)
            await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[3].address)
            await deployersCreatorsConnection.updateCreator('abcde', 'abcd', 'abc', 5, accounts[3].address)
              
            let creatorData = await deployersCreatorsConnection.findCreatorDataByAdress(accounts[3].address)
                
                assert.equal(creatorData[0], 'abcde')
                assert.equal(creatorData[1], 'abcd')
                assert.equal(creatorData[2], 'abc')
                assert.equal(creatorData[3], accounts[3].address)
                assert.equal(creatorData[4], (5).toString())
                assert.equal(creatorData[5].length, 0)
            
          
              await expect(
                deployersCreatorsConnection.updateCreator('abcde', 'abcd', 'abc', 5, accounts[5].address)
                ).to.be.revertedWith(
                'Creators__creatoreNotFound()'
              )
            
        })

        it("Content creator change visibility", async () => {
                
          await deployersCreatorsConnection.setMainContract(deployer.address)
          await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[3].address)

          await deployersCreatorsConnection.changeCreatorVisibility(false, accounts[3].address)

          await expect(
            deployersCreatorsConnection.findCreatorDataByAdress(accounts[3].address)
            ).to.be.revertedWith(
            'Creators__creatoreNotFound()'
          )

          await deployersCreatorsConnection.changeCreatorVisibility(true, accounts[3].address)

          let creatorData = await deployersCreatorsConnection.findCreatorDataByAdress(accounts[3].address)
                
          assert.equal(creatorData[0], creatorName)
          assert.equal(creatorData[1], creatorDescription)
          assert.equal(creatorData[2], avatar)
          assert.equal(creatorData[3], accounts[3].address)
          assert.equal(creatorData[4], subscriptionPrice.toString())
          assert.equal(creatorData[5].length, 0)

      })
    
    
         })

         describe("Add content to creator", function () {
            it("Contend id connection", async () => {
                
                await deployersCreatorsConnection.setMainContract(deployer.address)
                await deployersCreatorsConnection.registerAsCreator(creatorName, creatorDescription, avatar, subscriptionPrice, accounts[3].address)

                await deployersCreatorsConnection.addContentToCreator(accounts[3].address, 0)
                await deployersCreatorsConnection.addContentToCreator(accounts[3].address, 1)
                await deployersCreatorsConnection.addContentToCreator(accounts[3].address, 2)

                let creatorData = await deployersCreatorsConnection.findCreatorDataByAdress(accounts[3].address)
                assert.equal(creatorData[5].length, 3)
                assert.equal(creatorData[5][0], 0)
                assert.equal(creatorData[5][1], 1)
                assert.equal(creatorData[5][2], 2)

                await expect(
                    deployersCreatorsConnection.addContentToCreator(accounts[1].address, 0)
                  ).to.be.revertedWith(
                    'Creators__creatoreNotFound()'
                  )

                  await expect(
                    deployersCreatorsConnection.addContentToCreator(accounts[3].address, 0)
                  ).to.be.revertedWith(
                    'Creators__contentIDalreadyConnected()'
                  )
                
            })

         })

         


    })