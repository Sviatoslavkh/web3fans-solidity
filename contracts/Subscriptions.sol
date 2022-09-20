//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./Creators.sol";
import "./PriceConverter.sol";

error Subscriptions__noSubscriptions();
error Subscriptions__notFound();
error Subscriptions__notOwner();
error Subscriptions__notMainContract();
error Subscriptions__notEnoughMoneySent();
error Subscriptions__creatorNotFound();

contract Subscriptions {

    struct SubscriptionsStruct {
            uint256 subscriptionEnd;
            address creator;
            address follower;
        }

    SubscriptionsStruct[] private subscriptions;

    AggregatorV3Interface private s_priceFeed;
    Creators private creators_ref;
    address immutable owner;
    uint256 immutable version;
    address private mainContract;

    mapping(address  => mapping(address  => uint256)) private subscriptionID;
    mapping(address  => address[]) private followerSubscriptions;



    constructor(address _priceFeed, Creators _creatorsContract, uint256 _version) {
        creators_ref = _creatorsContract;
        s_priceFeed = AggregatorV3Interface(_priceFeed);
        owner = msg.sender;
        version = _version;
    }


    modifier subscriptionsExist() {
        // require(msg.sender == i_owner);
        if (subscriptions.length == 0) revert Subscriptions__noSubscriptions();
        _;
    }

    modifier checkMainContract() {
        // require(msg.sender == i_owner);
        if (msg.sender != mainContract) revert Subscriptions__notMainContract();
        _;
    }

    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != owner) revert Subscriptions__notOwner();
        _;
    }

    function setMainContract(address _mainContractAddress) public payable onlyOwner{
        mainContract = _mainContractAddress;
    }

    function getSubscriptionInfo(address _creatorAddress, address _followerAddress) public view subscriptionsExist returns(uint256, bool){
        uint256 subscriptionid = subscriptionID[_creatorAddress][_followerAddress];
        if(subscriptionid == 0 && (subscriptions[subscriptionid].creator != _creatorAddress || subscriptions[subscriptionid].follower != _followerAddress)){
            revert Subscriptions__notFound();
        }
        bool active = false;
        if(subscriptions[subscriptionid].subscriptionEnd > block.timestamp) active = true;
        return( subscriptions[subscriptionid].subscriptionEnd,  active);
    }

    function buySubscription(address _creatorAddress, address _followerAddress, uint256 valueSent) public payable checkMainContract {
        if (!creators_ref.checkCreatorExistance(_creatorAddress)) revert Subscriptions__creatorNotFound();
        ( , , , ,uint256 creatorSubscriptioPrice, )= creators_ref.findCreatorDataByAdress(_creatorAddress);
        uint256 priceInCoins = PriceConverter.getUSDPriceInCoins(s_priceFeed, creatorSubscriptioPrice);
        if (valueSent < priceInCoins) revert Subscriptions__notEnoughMoneySent();
        uint256 subscriptionTime = 30*24*60*60;
        if(valueSent > priceInCoins){
            subscriptionTime = (subscriptionTime*valueSent)/(priceInCoins);
        }
        uint256 subscriptionEndTime = block.timestamp + subscriptionTime;

        uint256 subscriptionid = subscriptionID[_creatorAddress][_followerAddress];

        bool pushSubscription = false;

        if(subscriptions.length > 0){
            if(subscriptions[subscriptionid].creator == _creatorAddress && subscriptions[subscriptionid].follower == _followerAddress){
                if(subscriptions[subscriptionid].subscriptionEnd > block.timestamp){
                    subscriptionEndTime = subscriptions[subscriptionid].subscriptionEnd + subscriptionTime;
                }
                subscriptions[subscriptionid].subscriptionEnd = subscriptionEndTime;
            }else{
                pushSubscription = true;
            }
        }else{
            pushSubscription = true;
        }

        if(pushSubscription = true){
            subscriptions.push(SubscriptionsStruct(subscriptionEndTime,
            _creatorAddress,
            _followerAddress
            ));

            subscriptionID[_creatorAddress][_followerAddress] = subscriptions.length - 1;
            followerSubscriptions[_followerAddress].push(_creatorAddress); 
        }
        
    }

    function getFollowerSubscriptions(address _follower) public view returns(address[] memory){
    address[] memory _followerSubscriptions = followerSubscriptions[_follower]; 
    return _followerSubscriptions;
    }

}