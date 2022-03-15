const BetaKreativ = artifacts.require("BetaKreativ");

contract("BetaKreativ", (accounts) => {
  printAccounts = {};
  accounts.forEach((a) => {
    printAccounts[accounts.indexOf(a)] = a;
  });
  console.log(printAccounts);

  /**
   * Test Placeholder
   */
  it("test", async () => {});
});
