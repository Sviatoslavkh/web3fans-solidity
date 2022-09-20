//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./Creators.sol";
import "./Subscriptions.sol";
import "./Signature.sol";

error Content__notOwner();
error Content__creatorNotFound();
error Content__subscriptionIsNotActive();
error Content__notFound();
error Content__notExist();
error Content__contentTypeNotExist();
error Content__notMainContract();

contract Content {


    struct ContentSt {
        string name;
        string description;
        uint256 contentType;
        string link;
        address creatorAddress;
    }

    ContentSt[] private content;
    
    Creators private creators_ref;
    Subscriptions private subscriptions_ref;

    address immutable owner;
    uint256 immutable version;
    address private mainContract;

    constructor(Creators _creatorsContract, Subscriptions _subscriptionsContract, uint256 _version) {
        creators_ref = _creatorsContract;
        subscriptions_ref = _subscriptionsContract;
        owner = msg.sender; 
        version = _version;
    }

    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != owner) revert Content__notOwner();
        _;
    }

    modifier checkMainContract() {
        // require(msg.sender == i_owner);
        if (msg.sender != mainContract) revert Content__notMainContract();
        _;
    }

    function setMainContract(address _mainContractAddress) public payable onlyOwner{
        mainContract = _mainContractAddress;
    }

    function getContentLength() public view checkMainContract returns(uint256){
        return content.length;
    }

    function getSubscriptionContent(address _followerAddress, address _creatorAddress) public view returns(uint256[] memory) {
        if (!creators_ref.checkCreatorExistance(_creatorAddress)) revert Content__creatorNotFound();
        ( , , , address creatorAddress, , uint256[] memory contentIDs) = creators_ref.findCreatorDataByAdress(_creatorAddress);
        (, bool active) = subscriptions_ref.getSubscriptionInfo(_creatorAddress, _followerAddress); 
        if(active && creatorAddress ==_creatorAddress){
            return(contentIDs);
        }else{
            revert Content__subscriptionIsNotActive();
        }
    }

    function getContent(uint256 _contentID, bytes memory _signature, bytes32 _message) public view returns (string memory,
        string memory,
        uint256,
        string memory) {
        if (content.length == 0) revert Content__notExist();
        if (content.length <= _contentID) revert Content__notFound();
        address signer = Signature.getSignature(_message, _signature);
        address creatorAddress = content[_contentID].creatorAddress;
        bool active = false; 
        if(signer == creatorAddress){
            active=true;
        }else{
            (, active) = subscriptions_ref.getSubscriptionInfo(creatorAddress, signer); 
        }

        if(active){
                    ContentSt memory contentData = content[_contentID];
                    return(
                        contentData.name,
                        contentData.description,
                        contentData.contentType,
                        contentData.link
                    );
        }else{
            revert Content__subscriptionIsNotActive();
        }
    }

    function addContent(string memory _name, string memory _description, uint256 _contentType, string memory _link, address _creatorAddress) public payable checkMainContract{
        
       if (!creators_ref.checkCreatorExistance(_creatorAddress)) revert Content__creatorNotFound();
        
        if(_contentType != 0 && _contentType != 1){
            revert Content__contentTypeNotExist();
        }
        
        content.push(ContentSt(_name,
        _description,
        _contentType,
        _link,
        _creatorAddress
        ));
        
        uint256 contentID;
        contentID = content.length - 1;

        creators_ref.addContentToCreator(_creatorAddress, contentID);

    }

    function removeContent(uint256 _contentID, address _creatorAddress) public payable checkMainContract{

        if (content.length <= _contentID) revert Content__notFound();

        if (!creators_ref.checkCreatorExistance(_creatorAddress)) revert Content__creatorNotFound();
        
        if (content[_contentID].creatorAddress != _creatorAddress) revert Content__creatorNotFound();

        creators_ref.removeContentFromCreator(_creatorAddress, _contentID);

    }

    function updateContent(uint256 _contentID, string memory _name, string memory _description, uint256 _contentType, string memory _link, address _creatorAddress) public payable checkMainContract{

        if (content.length <= _contentID) revert Content__notFound();

        if (!creators_ref.checkCreatorExistance(_creatorAddress)) revert Content__creatorNotFound();

        if (content[_contentID].creatorAddress != _creatorAddress) revert Content__creatorNotFound();

        content[_contentID] = ContentSt(_name,
        _description,
        _contentType,
        _link,
        _creatorAddress
        );

    }





}