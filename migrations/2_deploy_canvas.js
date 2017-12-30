var Canvas = artifacts.require("./Canvas.sol");
var UsingMortal = artifacts.require("./UsingMortal.sol");
var UsingCanvasBoundaries = artifacts.require("./UsingCanvasBoundaries.sol");

module.exports = function(deployer) {
  deployer.deploy(UsingMortal);
  deployer.deploy(UsingCanvasBoundaries);
  deployer.deploy(Canvas);
};
