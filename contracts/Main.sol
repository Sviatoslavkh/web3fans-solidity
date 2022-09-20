//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";
import "./PriceConverter.sol";
import "./Creators.sol";
import "./Subscriptions.sol";
import "./Content.sol";
import "./Signature.sol";

error Main__NotOwner();
error Main__creatorNotFound();
error Main__NotEnoughtRights();

contract Main {

uint256 private balance; 
uint256 public immutable contractFee;
address private immutable owner;
uint256 immutable version;

AggregatorV3Interface private s_priceFeed;
Creators private creators_ref;
Subscriptions private subscriptions_ref;
Content private content_ref;

mapping(address  => uint256) private creatorBalance;


event creatorRegistration(address indexed creatorAddress);
event creatorUpdate(string _name, string _description, string _avatar, uint256 _subscriptionPrice, address indexed creatorAddress);
event creatorDetetion(address indexed creatorAddress);
event creatorRetrieve(address indexed creatorAddress);
event contentAdded(uint256 indexed contentID);
event contentDeleted();
event contentUpdated(uint256 indexed contentID);
event subscriptionBought(address indexed followerAddress, address indexed creatorAddress);
event contractWithdrawEvent();
event creatorWithdrawEvent(address indexed creatorAddress);

constructor(address _priceFeed, Creators _creatorsContract, Subscriptions _subscriptionsContract, Content _contentContract, uint256 _version) {
        creators_ref = _creatorsContract;
        s_priceFeed = AggregatorV3Interface(_priceFeed);
        subscriptions_ref = _subscriptionsContract;
        content_ref = _contentContract;
        owner = msg.sender;
        contractFee = 20;
        balance = 0;
        version = _version;
    }

modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != owner) revert Main__NotOwner();
        _;
    }

function registerAsCreator(string memory _name, string memory _description, string memory _avatar, uint256 _subscriptionPrice) public payable {
            creators_ref.registerAsCreator(_name, _description, _avatar, _subscriptionPrice, msg.sender);
            creatorBalance[msg.sender] = 0;
            emit creatorRegistration(msg.sender);
        
    }

function updateCreator(string memory _name, string memory _description, string memory _avatar, uint256 _subscriptionPrice) public payable {
            if (!creators_ref.checkCreatorExistance(msg.sender)) revert Main__creatorNotFound();
            creators_ref.updateCreator(_name, _description, _avatar, _subscriptionPrice, msg.sender);
            emit creatorUpdate(_name, _description, _avatar, _subscriptionPrice, msg.sender);
    }

function deleteCreator() public payable {
            if (!creators_ref.checkCreatorExistance(msg.sender)) revert Main__creatorNotFound();
            creators_ref.changeCreatorVisibility(false, msg.sender);  
            emit creatorDetetion(msg.sender);
    }

function retrieveCreator() public payable {
            if (!creators_ref.checkCreatorExistance(msg.sender)) revert Main__creatorNotFound();
            creators_ref.changeCreatorVisibility(true, msg.sender);  
            emit creatorRetrieve(msg.sender);
    }

function findCreatorDataByAdress(address _creatorAddress) public view returns 
        (string memory,
        string memory,
        string memory,
        address,
        uint256,
        uint256[] memory){
        if (!creators_ref.checkCreatorExistance(_creatorAddress)) revert Main__creatorNotFound();
        (string memory name, string memory description, string memory avatar, address creatorAddress, uint256 subscriptionPrice, uint256[] memory contentIDs) = creators_ref.findCreatorDataByAdress(_creatorAddress);
        return(name, 
                description, 
                avatar, 
                creatorAddress, 
                subscriptionPrice, 
                contentIDs);
    }

function getCreatorsIDs(uint256 _startIndex, uint256 _limit) public view returns 
        (address[] memory, uint256, uint256){
        (address[] memory indexes, uint256 count, uint256 nextIndex) = creators_ref.getCreatorsIDs(_startIndex, _limit);
        return(indexes, count, nextIndex);

    }


function addContent(string memory _name, string memory _description, uint256 _contentType, string memory _link) public payable {
        if (!creators_ref.checkCreatorExistance(msg.sender)) revert Main__creatorNotFound();
        content_ref.addContent(_name, _description, _contentType, _link, msg.sender);
        uint256 contentID = content_ref.getContentLength();
        contentID --;
        emit contentAdded(contentID);
    }

function deleteContent(uint256 _contentID) public payable {
        if (!creators_ref.checkCreatorExistance(msg.sender)) revert Main__creatorNotFound();
        content_ref.removeContent(_contentID, msg.sender);
        emit contentDeleted();
    }

function updateContent(uint256 _contentID, string memory _name, string memory _description, uint256 _contentType, string memory _link) public payable {
        if (!creators_ref.checkCreatorExistance(msg.sender)) revert Main__creatorNotFound();
        content_ref.updateContent(_contentID, _name, _description, _contentType, _link, msg.sender);
        emit contentUpdated(_contentID);
    }

function buySubscription(address _creatorAddress) public payable{
    if (!creators_ref.checkCreatorExistance(_creatorAddress)) revert Main__creatorNotFound();
    subscriptions_ref.buySubscription( _creatorAddress,  msg.sender,  msg.value);
    uint256 balanceIncrease = msg.value / contractFee;
    uint256 creatorBalanceIncrease = msg.value - balanceIncrease;
    creatorBalance[_creatorAddress] += creatorBalanceIncrease;
    balance += balanceIncrease;
    emit subscriptionBought(msg.sender, _creatorAddress);
}

function getFollowerSubscriptions(address _follower) public view returns(address[] memory){
    address[] memory _followerSubscriptions = subscriptions_ref.getFollowerSubscriptions(_follower); 
    return _followerSubscriptions;
    
}


function getSubscriptionByCreatorAddress(address _creator, address _follower) public view  returns(address, address, uint, bool){
        (uint256 subscriptionEnd, bool active) = subscriptions_ref.getSubscriptionInfo(_creator, _follower);

                return (_creator, 
                    _follower, 
                    subscriptionEnd, 
                    active);

    }

    function getContent(uint256 _contentID, bytes memory _signature, bytes32 _message) public view returns (string memory,
        string memory,
        uint256,
        string memory) {

        (string memory name, string memory description, uint256 contentType, string memory link) = content_ref.getContent(_contentID, _signature, _message);
        return(
                        name,
                        description,
                        contentType,
                        link
                    );


    }

    function getSubscriptionContent(address _creatorAddress, address _followerAddress) public view returns(uint256[] memory) {
       uint256[] memory contentIDs = content_ref.getSubscriptionContent( _followerAddress, _creatorAddress);
        return(contentIDs);

    }

    function getContractBalance(bytes memory _signature, bytes32 _message) public view returns(uint256){

        require(_signature.length == 65, "invalid signature length");
            bytes32 r;
            bytes32 s;
            uint8 v;
            assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
            }
            address signer = ecrecover(_message, v, r, s);
        if(signer == owner){
            return balance;
        }else{
            revert Main__NotOwner();
        }

    }

    function getCreatorBalance(bytes memory _signature, bytes32 _message) public view returns(uint256){

        address signer = Signature.getSignature(_message, _signature);
        ( , , , address creatorAddress, ,) = creators_ref.findCreatorDataByAdress(signer);
        if(creatorAddress == signer){
            return creatorBalance[signer];
        }else{
            revert Main__NotEnoughtRights();
        }

    }

    function contractWithdraw() public payable onlyOwner{

        (bool success, ) = owner.call{value: balance}("");
        require(success);
        emit contractWithdrawEvent();
    }

    function creatorWithdraw() public payable {

        address creatorAddress = msg.sender;
        (bool success, ) = creatorAddress.call{value: creatorBalance[creatorAddress]}("");
        require(success);
        creatorBalance[creatorAddress] = 0;
        emit creatorWithdrawEvent(msg.sender);

    }

    function getPriceLevel() public view returns (uint256){

        return PriceConverter.getPrice(s_priceFeed);
    }

    function getUSDPriceInCoins(uint256 usd) public view returns (uint256){

        return PriceConverter.getUSDPriceInCoins(s_priceFeed, usd);
    }

}
