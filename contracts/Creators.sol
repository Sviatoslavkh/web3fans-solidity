// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

error Creators__creatorAlreadyExists();
error Creators__noCreators();
error Creators__creatoreNotFound();
error Creators__notMainContract();
error Creators__notOwner();
error Creators__contentIDalreadyConnected();
error Creators__contentIDnotFound();
error Creators__creatorsEnded();

contract Creators {

struct CreatorsStruct {
        string name;
        string description;
        string avatar;
        address creatorAddress;
        uint256 subscriptionPrice;
        uint256[] contentIDs;
        bool visible;
    }

CreatorsStruct[] private creators;


mapping(address  => uint256) private creatorID;
mapping(uint256  => address) private contentToCreatorAddress;


address private mainContract; 
address private contentContract; 
address immutable owner;
uint256 immutable version;

constructor(uint256 _version){
    owner = msg.sender;
    version = _version;
}


    modifier checkMainContract() {
        // require(msg.sender == i_owner);
        if (msg.sender != mainContract) revert Creators__notMainContract();
        _;
    }

    modifier checkMainOrCreatorContract() {
        // require(msg.sender == i_owner);
        if(msg.sender == mainContract || msg.sender == contentContract){

        }else{
            revert Creators__notMainContract();
        }
        _;
    }

    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != owner) revert Creators__notOwner();
        _;
    }

    function setMainContract(address _mainContractAddress) public payable onlyOwner{
        mainContract = _mainContractAddress;
    }
    function setContentContract(address _contentContract) public payable onlyOwner{
        contentContract = _contentContract;
    }

    function checkCreatorExistance(address _creatorAddress) public view returns(bool){
            uint256 creatorid = creatorID[_creatorAddress];
            if(creators.length > 0){
                if(creatorid == 0){
                    if(_creatorAddress == creators[creatorid].creatorAddress){
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return true;
                }
            }else{
                  return false;
            }
            
    }


    function registerAsCreator(string memory _name, string memory _description, string memory _avatar, uint256 _subscriptionPrice, address _creatorAddress) public payable checkMainContract {
            if(creators.length > 0){
                if(creators[creatorID[_creatorAddress]].creatorAddress == _creatorAddress){
                    revert Creators__creatorAlreadyExists();
                }
            }
            uint256[] memory contentIDs;
                creatorID[_creatorAddress] = creators.length;
                creators.push(CreatorsStruct(_name,
                _description,
                _avatar,
                _creatorAddress,
                _subscriptionPrice,
                contentIDs,
                true
                ));
    }

    function updateCreator(string memory _name, string memory _description, string memory _avatar, uint256 _subscriptionPrice, address _creatorAddress) public payable checkMainContract {
            if(checkCreatorExistance(_creatorAddress)){

            uint256 creatorid = creatorID[_creatorAddress];
            uint256[] memory contentIDs = creators[creatorid].contentIDs;
            bool visible = creators[creatorid].visible;

            creators[creatorid] = CreatorsStruct(
                _name,
                _description,
                _avatar,
                _creatorAddress,
                _subscriptionPrice,
                contentIDs,
                visible
            );

            }else{
                revert Creators__creatoreNotFound();
            }
            
    }

    function changeCreatorVisibility(bool _visible, address _creatorAddress) public payable checkMainContract {
            if(checkCreatorExistance(_creatorAddress)){
                uint256 creatorid = creatorID[_creatorAddress];
                creators[creatorid].visible = _visible;
            }else{
                revert Creators__creatoreNotFound();
            }
            
    }

    function findCreatorIDByAdress(address _creatorAddress) public view returns (uint256){
        if(checkCreatorExistance(_creatorAddress)){

        uint256 creatorid = creatorID[_creatorAddress];
        return creatorid;
          }else{
            revert Creators__creatoreNotFound();
        }

        
    }

    function findCreatorDataByAdress(address _creatorAddress) public view returns 
        (string memory,
        string memory,
        string memory,
        address,
        uint256,
        uint256[] memory){
        if(checkCreatorExistance(_creatorAddress)){
        uint256 creatorid = creatorID[_creatorAddress];
        if(creators[creatorid].visible){
            return (creators[creatorid].name, 
                    creators[creatorid].description, 
                    creators[creatorid].avatar, 
                    creators[creatorid].creatorAddress, 
                    creators[creatorid].subscriptionPrice, 
                    creators[creatorid].contentIDs);
            }
        }
        revert Creators__creatoreNotFound();
    }


    function getCreatorsIDs(uint256 _startIndex, uint256 _limit) public view returns 
        (address[] memory, uint256, uint256){
        if(_startIndex >= creators.length) revert Creators__creatorsEnded();
        uint256 count = creators.length - _startIndex;
        if(_limit > count && count > 20){
            _limit = 20;
        }else if(_limit > count && count < 20){
            _limit = count;
        }else if (_limit > 20){
             _limit = 20;
        } 
        address[] memory _indexes  = new address[](_limit);
        uint256 n = 0;
        uint256 nextIndex;
        for(uint256 i=_startIndex; i<(_startIndex+_limit); i++){
            if(i<creators.length){
                if(creators[i].visible && n<_indexes.length){
                    _indexes[n] = creators[i].creatorAddress;
                    n ++;
                }else if(n==_indexes.length){
                    break;
                }else{
                    _limit++;
                }
            }
            if(i == _startIndex+_limit-1){
                nextIndex = i+1;
                if(i+1 >= creators.length){
                    count = 0;
                }else{
                    count = creators.length-i-1;
                }
            }
        }

        return(_indexes, count, nextIndex);

    }

    function addContentToCreator (address _creatorAddress, uint256 _contentID) public payable checkMainOrCreatorContract {
        if(checkCreatorExistance(_creatorAddress)){
            if(contentToCreatorAddress[_contentID] == 0x0000000000000000000000000000000000000000){
            uint256 creatorid = creatorID[_creatorAddress];
            creators[creatorid].contentIDs.push(_contentID);
            contentToCreatorAddress[_contentID] = _creatorAddress;
            }else{
                revert Creators__contentIDalreadyConnected();
            }
        }else{
            revert Creators__creatoreNotFound();
        }

    }

    function removeContentFromCreator (address _creatorAddress, uint256 _contentID) public payable checkMainOrCreatorContract {
        if(checkCreatorExistance(_creatorAddress)){
            if(contentToCreatorAddress[_contentID] != 0x0000000000000000000000000000000000000000){
                uint256 creatorid = creatorID[_creatorAddress];
                uint256[] memory contentIDs = creators[creatorid].contentIDs;
                uint256 contentIDinArray=contentIDs.length;
                for(uint256 i=0; i<contentIDs.length; i++){
                    if(contentIDs[i] == _contentID){
                        contentIDinArray = i; 
                    }
                    if (i >= contentIDinArray && i != (contentIDs.length-1)){
                        contentIDs[i] = contentIDs[i+1];
                    }
                }
                creators[creatorid].contentIDs = contentIDs;
                creators[creatorid].contentIDs.pop();

            }else{
                revert Creators__contentIDnotFound();
            }
        }else{
            revert Creators__creatoreNotFound();
        }

    }


}