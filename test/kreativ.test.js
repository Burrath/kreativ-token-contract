const BetaKreativ = artifacts.require("BetaKreativ");

contract("BetaKreativ", (accounts) => {
  printAccounts = {};
  accounts.forEach((a) => {
    printAccounts[accounts.indexOf(a)] = a;
  });
  console.log(printAccounts);

  const tokenName = "Beta Kreativ";
  const tokenSymbol = "KREATIV";
  const tokenDecimals = 18;

  beforeEach(async () => {
    token = await BetaKreativ.new({
      from: accounts[0],
    });
  });

  it("creation: should create an initial balance of 100000000 for the creator", async () => {
    const balance = await token.balanceOf.call(accounts[0]);
    assert.equal(
      balance.toString(),
      (100000000 * 10 ** 18).toLocaleString("fullwide", { useGrouping: false })
    );
  });

  it("can mint, can burn", async () => {
    const amount = (1 * 10 ** 18).toLocaleString("fullwide", {
      useGrouping: false,
    });

    await token.mint(accounts[5], amount, {
      from: accounts[0],
    });

    const balance = await token.balanceOf.call(accounts[5]);
    assert.equal(balance.toString(), amount);

    await token.burn(amount, { from: accounts[5] });
    const balance2 = await token.balanceOf.call(accounts[5]);
    assert.equal(balance2.toString(), 0);
  });

  it("can't mint over limit", async () => {
    const amount = (1000000001 * 10 ** 18).toLocaleString("fullwide", {
      useGrouping: false,
    });

    const totalsuppl = (await token.totalSupply()).toString()

    try {
      await token.mint(accounts[5], amount, {
        from: accounts[0],
      });
    } catch (error) {
    }

    const totalsuppl2 = (await token.totalSupply()).toString()

    assert.equal(totalsuppl, totalsuppl2);
  });

  it("creation: test correct setting of vanity information", async () => {
    const name = await token.name.call();
    assert.strictEqual(name, tokenName);

    const decimals = await token.decimals.call();
    assert.strictEqual(decimals.toNumber(), tokenDecimals);

    const symbol = await token.symbol.call();
    assert.strictEqual(symbol, tokenSymbol);
  });

  // it("creation: should succeed in creating over 2^256 - 1 (max) tokens", async () => {
  //   // 2^256 - 1
  //   const token2 = await BetaKreativ.new(
  //     "115792089237316195423570985008687907853269984665640564039457584007913129639935",
  //     "Simon Bucks",
  //     1,
  //     "SBX",
  //     { from: accounts[0] }
  //   );
  //   const totalSupply = await token2.totalSupply();
  //   assert.strictEqual(
  //     totalSupply.toString(),
  //     "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  //   );
  // });

  // TRANSERS
  // normal transfers without approvals
  it("transfers: ether transfer should be reversed.", async () => {
    const balanceBefore = await token.balanceOf.call(accounts[0]);
    assert.equal(
      balanceBefore.toString(),
      (100000000 * 10 ** 18).toLocaleString("fullwide", { useGrouping: false })
    );

    let threw = false;
    try {
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: token.address,
        value: web3.utils.toWei("10", "Ether"),
      });
    } catch (e) {
      threw = true;
    }
    assert.equal(threw, true);

    const balanceAfter = await token.balanceOf.call(accounts[0]);
    assert.equal(
      balanceAfter.toString(),
      (100000000 * 10 ** 18).toLocaleString("fullwide", { useGrouping: false })
    );
  });

  it("transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000", async () => {
    await token.transfer(accounts[1], 10000, { from: accounts[0] });
    const balance = await token.balanceOf.call(accounts[1]);
    assert.equal(balance.toString(), 10000);
  });

  it("transfers: should fail when trying to transfer 100000001 to accounts[1] with accounts[0] having 100000000", async () => {
    let threw = false;
    try {
      await token.transfer.call(
        accounts[1],
        (100000001 * 10 ** 18).toString(),
        { from: accounts[0] }
      );
    } catch (e) {
      threw = true;
    }
    assert.equal(threw, true);
  });

  it("transfers: should handle zero-transfers normally", async () => {
    assert(
      await token.transfer.call(accounts[1], 0, { from: accounts[0] }),
      "zero-transfer has failed"
    );
  });

  // NOTE: testing uint256 wrapping is impossible since you can't supply > 2^256 -1
  // todo: transfer max amounts

  // APPROVALS
  it("approvals: msg.sender should approve 100 to accounts[1]", async () => {
    await token.approve(accounts[1], 100, { from: accounts[0] });
    const allowance = await token.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance.toNumber(), 100);
  });

  // bit overkill. But is for testing a bug
  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.", async () => {
    await token.transfer(accounts[9], 10000, { from: accounts[0] });

    const balance0 = await token.balanceOf.call(accounts[9]);
    assert.strictEqual(balance0.toNumber(), 10000);

    await token.approve(accounts[1], 100, { from: accounts[9] }); // 100
    const balance2 = await token.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 0, "balance2 not correct");

    await token.transferFrom.call(accounts[9], accounts[2], 20, {
      from: accounts[1],
    });
    await token.allowance.call(accounts[9], accounts[1]);
    await token.transferFrom(accounts[9], accounts[2], 20, {
      from: accounts[1],
    }); // -20
    const allowance01 = await token.allowance.call(accounts[9], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 80); // =80

    const balance22 = await token.balanceOf.call(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 20);

    const balance02 = await token.balanceOf.call(accounts[9]);
    assert.strictEqual(balance02.toNumber(), 9980);
  });

  // should approve 100 of msg.sender & withdraw 50, twice. (should succeed)
  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.", async () => {
    await token.transfer(accounts[8], 10000, { from: accounts[0] });

    await token.approve(accounts[1], 100, { from: accounts[8] });
    const allowance01 = await token.allowance.call(accounts[8], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 100);

    await token.transferFrom(accounts[8], accounts[2], 20, {
      from: accounts[1],
    });
    const allowance012 = await token.allowance.call(accounts[8], accounts[1]);
    assert.strictEqual(allowance012.toNumber(), 80);

    const balance2 = await token.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 20);

    const balance0 = await token.balanceOf.call(accounts[8]);
    assert.strictEqual(balance0.toNumber(), 9980);

    // FIRST tx done.
    // onto next.
    await token.transferFrom(accounts[8], accounts[2], 20, {
      from: accounts[1],
    });
    const allowance013 = await token.allowance.call(accounts[8], accounts[1]);
    assert.strictEqual(allowance013.toNumber(), 60);

    const balance22 = await token.balanceOf.call(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 40);

    const balance02 = await token.balanceOf.call(accounts[8]);
    assert.strictEqual(balance02.toNumber(), 9960);
  });

  // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)", async () => {
    await token.transfer(accounts[7], 10000, { from: accounts[0] });

    await token.approve(accounts[1], 100, { from: accounts[7] });
    const allowance01 = await token.allowance.call(accounts[7], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 100);

    await token.transferFrom(accounts[7], accounts[2], 50, {
      from: accounts[1],
    });
    const allowance012 = await token.allowance.call(accounts[7], accounts[1]);
    assert.strictEqual(allowance012.toNumber(), 50);

    const balance2 = await token.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 50);

    const balance0 = await token.balanceOf.call(accounts[7]);
    assert.strictEqual(balance0.toNumber(), 9950);

    // FIRST tx done.
    // onto next.
    let threw = false;
    try {
      await token.transferFrom.call(accounts[7], accounts[2], 60, {
        from: accounts[1],
      });
    } catch (e) {
      threw = true;
    }
    assert.equal(threw, true);
  });

  it("approvals: attempt withdrawal from account with no allowance (should fail)", async () => {
    let threw = false;
    try {
      await token.transferFrom.call(accounts[0], accounts[2], 60, {
        from: accounts[1],
      });
    } catch (e) {
      threw = true;
    }
    assert.equal(threw, true);
  });

  it("approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.", async () => {
    await token.approve(accounts[1], 100, { from: accounts[0] });
    await token.transferFrom(accounts[0], accounts[2], 60, {
      from: accounts[1],
    });
    await token.approve(accounts[1], 0, { from: accounts[0] });
    let threw = false;
    try {
      await token.transferFrom.call(accounts[0], accounts[2], 10, {
        from: accounts[1],
      });
    } catch (e) {
      threw = true;
    }
    assert.equal(threw, true);
  });

  it("approvals: approve max (2^256 - 1)", async () => {
    await token.approve(
      accounts[1],
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      { from: accounts[0] }
    );
    const allowance = await token.allowance(accounts[0], accounts[1]);
    assert.strictEqual(
      allowance.toString(),
      "115792089237316195423570985008687907853269984665640564039457584007913129639935"
    );
  });

  // should approve max of msg.sender & withdraw 20 without changing allowance (should succeed).
  it("approvals: msg.sender approves accounts[1] of max (2^256 - 1) & withdraws 20", async () => {
    await token.transfer(accounts[7], 10000, { from: accounts[0] });

    const balance0 = await token.balanceOf.call(accounts[7]);
    assert.strictEqual(balance0.toNumber(), 10000);

    const max =
      "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    await token.approve(accounts[1], max, { from: accounts[7] });
    const balance2 = await token.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 0, "balance2 not correct");

    await token.transferFrom(accounts[7], accounts[2], 20, {
      from: accounts[1],
    });
    const allowance01 = await token.allowance.call(accounts[7], accounts[1]);
    assert.strictEqual(allowance01.toString(), max);

    const balance22 = await token.balanceOf.call(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 20);

    const balance02 = await token.balanceOf.call(accounts[7]);
    assert.strictEqual(balance02.toNumber(), 9980);
  });

  /* eslint-disable no-underscore-dangle */
  it("events: should fire Transfer event properly", async () => {
    const res = await token.transfer(accounts[1], "2666", {
      from: accounts[0],
    });
    const transferLog = res.logs.find(
      (element) =>
        element.event.match("Transfer") && element.address.match(token.address)
    );
    assert.strictEqual(transferLog.args.from, accounts[0]);
    // L2 ETH transfer also emits a transfer event
    assert.strictEqual(transferLog.args.to, accounts[1]);
    assert.strictEqual(transferLog.args.value.toString(), "2666");
  });

  it("events: should fire Transfer event normally on a zero transfer", async () => {
    const res = await token.transfer(accounts[1], "0", { from: accounts[0] });
    const transferLog = res.logs.find(
      (element) =>
        element.event.match("Transfer") && element.address.match(token.address)
    );
    assert.strictEqual(transferLog.args.from, accounts[0]);
    assert.strictEqual(transferLog.args.to, accounts[1]);
    assert.strictEqual(transferLog.args.value.toString(), "0");
  });

  it("events: should fire Approval event properly", async () => {
    const res = await token.approve(accounts[1], "2666", { from: accounts[0] });
    const approvalLog = res.logs.find((element) =>
      element.event.match("Approval")
    );
    assert.strictEqual(approvalLog.args.owner, accounts[0]);
    assert.strictEqual(approvalLog.args.spender, accounts[1]);
    assert.strictEqual(approvalLog.args.value.toString(), "2666");
  });
});
