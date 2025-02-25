import { ethers } from 'ethers'
import sdk from './1-initialize-sdk.js'

// This is the address to our governance contract.
const voteModule = sdk.getVoteModule(process.env.VOTING_GOVERNANCE_ADDRESS)

// This is the address to our ERC-20 token contract.
const tokenModule = sdk.getTokenModule(process.env.ERC20_TOKEN_ADDRESS)

;(async () => {
  try {
    // Give our treasury the power to mint additional token if needed.
    await tokenModule.grantRole('minter', voteModule.address)

    console.log(
      'Successfully gave vote module permissions to act on token module'
    )
  } catch (error) {
    console.error(
      'failed to grant vote module permissions on token module',
      error
    )
    process.exit(1)
  }

  try {
    // Grab our wallet's token balance, remember -- we hold basically the entire supply right now!
    const ownedTokenBalance = await tokenModule.balanceOf(
      // The wallet address stored in your env file or Secrets section of Repl
      process.env.WALLET_ADDRESS
    )

    // Grab 90% of the supply that we hold.
    const ownedAmount = ethers.BigNumber.from(ownedTokenBalance.value)
    const percent90 = ownedAmount.div(100).mul(90)

    // Transfer 90% of the supply to our voting contract.
    await tokenModule.transfer(voteModule.address, percent90)

    console.log('✅ Successfully transferred tokens to vote module')
  } catch (err) {
    console.error('failed to transfer tokens to vote module', err)
  }
})()
