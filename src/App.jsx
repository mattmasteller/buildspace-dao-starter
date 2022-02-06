import { useEffect, useMemo, useState } from 'react'

import { useWeb3 } from '@3rdweb/hooks'
import { ThirdwebSDK } from '@3rdweb/sdk'

import { ethers } from 'ethers'

// Instantiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK('rinkeby')

// Grab reference to our ERC-1155 NFT contract.
const bundleDropModule = sdk.getBundleDropModule(
  process.env.REACT_APP_ERC1155_NFT_ADDRESS
)

// Grab reference to our ERC-20 Token contract.
const tokenModule = sdk.getTokenModule(
  process.env.REACT_APP_ERC20_TOKEN_ADDRESS
)

const App = () => {
  // Use the connectWallet hook thirdweb gives us.
  const { connectWallet, address, error, provider } = useWeb3()
  console.log('👋 Address: ', address)

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false) // does user have our NFT
  const [isClaiming, setIsClaiming] = useState(false) // loading state while NFT is minting
  const [memberTokenAmounts, setMemberTokenAmounts] = useState({}) // amount of token each member has
  const [memberAddresses, setMemberAddresses] = useState([]) // member addresses

  // Function to shorten a wallet address
  const shortenAddress = (str) =>
    `${str.substring(0, 6)}...${str.substring(str.length - 4)}`

  // The signer is required to sign txns on the blockchain.
  // Without it, we can only read data, not write.
  const signer = provider ? provider.getSigner() : undefined

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
