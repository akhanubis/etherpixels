var Etherpixels = artifacts.require("./Etherpixels.sol");

module.exports = function(deployer) {
  deployer.deploy(Etherpixels);
};
