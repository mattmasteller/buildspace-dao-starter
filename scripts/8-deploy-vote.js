import sdk from './1-initialize-sdk.js'

// This is the address to our 3rdweb Project contract.
const appModule = sdk.getAppModule(process.env.THIRD_WEB_PROJECT_ADDRESS)

;(async () => {
  try {
    const voteModule = await appModule.deployVoteModule({
      // Give your governance contract a name.
      name: "JimDAO's Epic Proposals",

      // This is the location of our governance token, our ERC-20 contract!
      votingTokenAddress: process.env.ERC20_TOKEN_ADDRESS,

      // After a proposal is created, when can members start voting?
      // For now, we set this to immediately.
      proposalStartWaitTimeInSeconds: 0,

      // How long do members have to vote on a proposal when it's created?
      // Here, we set it to 24 hours (86400 seconds)
      proposalVotingTimeInSeconds: 24 * 60 * 60,

      // A quorum which says “In order for a proposal to pass, a minimum x % of token 
      // must be used in the vote”
      votingQuorumFraction: 0,

      // What's the minimum # of tokens a user needs to be allowed to create a proposal?
      // I set it to 0. Meaning no tokens are required for a user to be allowed to
      // create a proposal.
      minimumNumberOfTokensNeededToPropose: '0', // For testing, set to '0'
    })

    console.log(
      '✅ Successfully deployed vote module, address:',
      voteModule.address
    )
  } catch (error) {
    console.error('Failed to deploy vote module', error)
  }
})()
