import { useEffect, useMemo, useState } from 'react'

import { useWeb3 } from '@3rdweb/hooks'
import { ThirdwebSDK } from '@3rdweb/sdk'

import { UnsupportedChainIdError } from '@web3-react/core'

import { ethers } from 'ethers'

// Instantiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK('rinkeby')

// Reference to our ERC-1155 NFT contract.
const bundleDropModule = sdk.getBundleDropModule(
  process.env.REACT_APP_ERC1155_NFT_ADDRESS
)

// Reference to our ERC-20 Token contract.
const tokenModule = sdk.getTokenModule(
  process.env.REACT_APP_ERC20_TOKEN_ADDRESS
)

// Reference to our Governance Voting contract.
const voteModule = sdk.getVoteModule(
  process.env.REACT_APP_VOTING_GOVERNANCE_ADDRESS
)

const App = () => {
  // Use the connectWallet hook thirdweb gives us.
  const { connectWallet, address, error, provider } = useWeb3()
  console.log('👋 Address: ', address)

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false) // does user have our NFT
  const [isClaiming, setIsClaiming] = useState(false) // loading state while NFT is minting
  const [memberTokenAmounts, setMemberTokenAmounts] = useState({}) // amount of token each member has
  const [memberAddresses, setMemberAddresses] = useState([]) // member addresses
  const [proposals, setProposals] = useState([])
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  // The signer is required to sign txns on the blockchain.
  // Without it, we can only read data, not write.
  const signer = provider ? provider.getSigner() : undefined

  // Combine memberAddresses and memberTokenAmounts into a single array
  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      return {
        address,
        tokenAmount: ethers.utils.formatUnits(
          // If the address isn't in memberTokenAmounts, it means they don't
          // hold any of our token.
          memberTokenAmounts[address] || 0,
          18
        ),
      }
    })
  }, [memberAddresses, memberTokenAmounts])

  // Function to shorten a wallet address.
  const shortenAddress = (str) =>
    `${str.substring(0, 6)}...${str.substring(str.length - 4)}`

  // Function to mint NFT.
  const mintNft = () => {
    setIsClaiming(true)
    // Call bundleDropModule.claim("0", 1) to mint nft to user's wallet.
    bundleDropModule
      .claim('0', 1)
      .then(() => {
        // Set claim state.
        setHasClaimedNFT(true)
        // Show user their fancy new NFT!
        console.log(
          `🌊 Successfully Minted! Check it our on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address.toLowerCase()}/0`
        )
      })
      .catch((err) => {
        console.error('failed to claim', err)
      })
      .finally(() => {
        // Stop loading state.
        setIsClaiming(false)
      })
  }

  // Grab all addresses of members holding NFT.
  useEffect(() => {
    if (!hasClaimedNFT) return

    // Fetch users with tokenId 0
    bundleDropModule
      .getAllClaimerAddresses('0')
      .then((addresses) => {
        console.log('🚀 Members addresses', addresses)
        setMemberAddresses(addresses)
      })
      .catch((err) => console.error('failed to get member list', err))
  }, [hasClaimedNFT])

  // Fetch # of tokens each member holds
  useEffect(() => {
    if (!hasClaimedNFT) return

    // Grab all the balances
    tokenModule
      .getAllHolderBalances()
      .then((amounts) => {
        console.log('👜 Amounts', amounts)
        setMemberTokenAmounts(amounts)
      })
      .catch((err) => console.error('failed to get token amounts', err))
  }, [hasClaimedNFT])

  useEffect(() => {
    // Pass signer to sdk, enables us to interact with deployed contract.
    sdk.setProviderOrSigner(signer)
  }, [signer])

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) return

    // A simple call to voteModule.getAll() to grab the proposals.
    voteModule
      .getAll()
      .then((proposals) => {
        // Set state!
        setProposals(proposals)
        console.log('🌈 Proposals:', proposals)
      })
      .catch((err) => {
        console.error('failed to get proposals', err)
      })
  }, [hasClaimedNFT])

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT) return

    // If we haven't finished retrieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) return

    // Check if the user has already voted on the first proposal.
    voteModule
      .hasVoted(proposals[0].proposalId, address)
      .then((hasVoted) => {
        setHasVoted(hasVoted)
        if (hasVoted) {
          console.log('🥵 User has already voted')
        } else {
          console.log('🙂 User has not voted yet')
        }
      })
      .catch((err) => {
        console.error('failed to check if wallet has voted', err)
      })
  }, [hasClaimedNFT, proposals, address])

  useEffect(() => {
    // If user doesn't have a connected wallet, exit.
    if (!address) return

    // Check if user has the NFT by using bundleDropModule.balanceOf
    return bundleDropModule
      .balanceOf(address, '0')
      .then((balance) => {
        // If balance is greater than 0, they have our NFT.
        if (balance.gt(0)) {
          setHasClaimedNFT(true)
          console.log('🌟 this user has a membership NFT!')
        } else {
          setHasClaimedNFT(false)
          console.log(`😭 this user doesn't have a membership NFT.`)
        }
      })
      .catch((error) => {
        setHasClaimedNFT(false)
        console.error('Failed to nft balance', error)
      })
  }, [address])

  // Case where user is connected to the wrong network.
  if (error instanceof UnsupportedChainIdError) {
    return (
      <div className="unsupported-network">
        <h2>Please connect to Rinkeby</h2>
        <p>
          This dapp only works on the Rinkeby network, please switch networks in
          your connected wallet.
        </p>
      </div>
    )
  }

  // Case where user hasn't connected wallet.
  if (!address) {
    return (
      <div className="landing">
        <h1>Welcome to JimiDAO</h1>
        <button className="btn-hero" onClick={() => connectWallet('injected')}>
          Connect your wallet
        </button>
      </div>
    )
  }

  // If the user has already claimed their NFT we want to display the interal DAO page to them
  // only DAO members will see this. Render all the members + token amounts.
  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>🎸 JimiDAO Member Dashboard</h1>
        <p>Congratulations on being a member</p>
        <div>
          <div>
            <h2>Member List</h2>
            <table className="card">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Token Amount</th>
                </tr>
              </thead>
              <tbody>
                {memberList.map((member) => {
                  return (
                    <tr key={member.address}>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div>
            <h2>Active Proposals</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                e.stopPropagation()

                //before we do async things, we want to disable the button to prevent double clicks
                setIsVoting(true)

                // lets get the votes from the form for the values
                const votes = proposals.map((proposal) => {
                  let voteResult = {
                    proposalId: proposal.proposalId,
                    //abstain by default
                    vote: 2,
                  }
                  proposal.votes.forEach((vote) => {
                    const elem = document.getElementById(
                      proposal.proposalId + '-' + vote.type
                    )

                    if (elem.checked) {
                      voteResult.vote = vote.type
                      return
                    }
                  })
                  return voteResult
                })

                // first we need to make sure the user delegates their token to vote
                try {
                  //we'll check if the wallet still needs to delegate their tokens before they can vote
                  const delegation = await tokenModule.getDelegationOf(address)
                  // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                  if (delegation === ethers.constants.AddressZero) {
                    //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                    await tokenModule.delegateTo(address)
                  }
                  // then we need to vote on the proposals
                  try {
                    await Promise.all(
                      votes.map(async (vote) => {
                        // before voting we first need to check whether the proposal is open for voting
                        // we first need to get the latest state of the proposal
                        const proposal = await voteModule.get(vote.proposalId)
                        // then we check if the proposal is open for voting (state === 1 means it is open)
                        if (proposal.state === 1) {
                          // if it is open for voting, we'll vote on it
                          return voteModule.vote(vote.proposalId, vote.vote)
                        }
                        // if the proposal is not open for voting we just return nothing, letting us continue
                        return
                      })
                    )
                    try {
                      // if any of the propsals are ready to be executed we'll need to execute them
                      // a proposal is ready to be executed if it is in state 4
                      await Promise.all(
                        votes.map(async (vote) => {
                          // we'll first get the latest state of the proposal again, since we may have just voted before
                          const proposal = await voteModule.get(vote.proposalId)

                          //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                          if (proposal.state === 4) {
                            return voteModule.execute(vote.proposalId)
                          }
                        })
                      )
                      // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                      setHasVoted(true)
                      // and log out a success message
                      console.log('successfully voted')
                    } catch (err) {
                      console.error('failed to execute votes', err)
                    }
                  } catch (err) {
                    console.error('failed to vote', err)
                  }
                } catch (err) {
                  console.error('failed to delegate tokens')
                } finally {
                  // in *either* case we need to set the isVoting state to false to enable the button again
                  setIsVoting(false)
                }
              }}
            >
              {proposals.map((proposal, index) => (
                <div key={proposal.proposalId} className="card">
                  <h5>{proposal.description}</h5>
                  <div>
                    {proposal.votes.map((vote) => (
                      <div key={vote.type}>
                        <input
                          type="radio"
                          id={proposal.proposalId + '-' + vote.type}
                          name={proposal.proposalId}
                          value={vote.type}
                          //default the "abstain" vote to chedked
                          defaultChecked={vote.type === 2}
                        />
                        <label htmlFor={proposal.proposalId + '-' + vote.type}>
                          {vote.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button disabled={isVoting || hasVoted} type="submit">
                {isVoting
                  ? 'Voting...'
                  : hasVoted
                  ? 'You Already Voted'
                  : 'Submit Votes'}
              </button>
              <small>
                This will trigger multiple transactions that you will need to
                sign.
              </small>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Render mint nft screen.
  return (
    <div className="mint-nft">
      <h1>Mint your free JimiDAO Membership NFT</h1>
      <button disabled={isClaiming} onClick={() => mintNft()}>
        {isClaiming ? 'Minting...' : 'Mint your nft (FREE)'}
      </button>
    </div>
  )
}

export default App
