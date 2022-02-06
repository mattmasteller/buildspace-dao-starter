import sdk from './1-initialize-sdk.js'

// This is the address to our ERC-1155 membership NFT contract.
const bundleDrop = sdk.getBundleDropModule(process.env.ERC1155_NFT_ADDRESS)

;(async () => {
  try {
    const claimConditionFactory = bundleDrop.getClaimConditionFactory()
    // Specify conditions.
    claimConditionFactory.newClaimPhase({
      startTime: new Date(),
      maxQuantity: 50_000,
      maxQuantityPerTransaction: 1,
    })

    await bundleDrop.setClaimCondition(0, claimConditionFactory)
    console.log(
      '✅ Successfully set claim condition on bundle drop:',
      bundleDrop.address
    )
  } catch (error) {
    console.error('Failed to set claim condition', error)
  }
})()
