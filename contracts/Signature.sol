// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


library Signature {


    function getSignature(bytes32  _phrase, bytes memory _signature) 
    internal 
    pure 
    returns (address){

        require(_signature.length == 65, "invalid signature length");
            bytes32 r;
            bytes32 s;
            uint8 v;
            assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
            }
            address signer = ecrecover(_phrase, v, r, s);
            return signer;

    }


}