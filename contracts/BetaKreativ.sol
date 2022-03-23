// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract BetaKreativ is ERC20PresetMinterPauser {

    uint256 maximumTokenAmount = 200000000 ether;
    uint256 startingTokenAmount = 100000000 ether;

    constructor() ERC20PresetMinterPauser("Beta Kreativ", "KREATIV") {
        _mint(msg.sender, startingTokenAmount);
    }

    /**
     * @dev See {ERC20-_mint}.
     */
    function _mint(address account, uint256 amount) internal virtual override {
        require(ERC20.totalSupply() + amount <= maximumTokenAmount, "ERC20Capped: cap exceeded");
        super._mint(account, amount);
    }
}