import sdk from './1-initialize-sdk.js'

// This is the address to our 3rdweb Project contract.
const app = sdk.getAppModule(process.env.THIRD_WEB_PROJECT_ADDRESS)

;(async () => {
  try {
    // Deploy a standard ERC-20 contract.
    const tokenModule = await app.deployTokenModule({
      // Token Name Ex. "Ethereum"
      name: 'JimiDAO Goverance Token',
      // Token Symbol Ex. "ETH"
      symbol: 'STRAT',
    })
    console.log(
      '✅ Successfully deployed token module, address:',
      tokenModule.address
    )
  } catch (error) {
    console.error('failed to deploy token module', error)
  }
})()
