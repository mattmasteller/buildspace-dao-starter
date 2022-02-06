import { useEffect, useMemo, useState } from 'react'

import { useWeb3 } from '@3rdweb/hooks'
import { ThirdwebSDK } from '@3rdweb/sdk'

// Instantiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK('rinkeby')

// Grab reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule(
  '0xf0beF6fF427B94F6591767C06D23584f301418d8'
)

const App = () => {
  // Use the connectWallet hook thirdweb gives us.
  const { connectWallet, address, error, provider } = useWeb3()
  console.log('👋 Address: ', address)

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false) // does user have our NFT
  const [isClaiming, setIsClaiming] = useState(false) // loading state while NFT is minting

  // The signer is required to sign txns on the blockchain.
  // Without it, we can only read data, not write.
  const signer = provider ? provider.getSigner() : undefined

  useEffect(() => {
    // Pass signer to sdk, enables us to interact with deployed contract.
    sdk.setProviderOrSigner(signer)
  }, [signer])

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

  // If a nft holder, render DAO member page.
  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>🎸 JimiDAO Member Dashboard</h1>
        <p>Congratulations on being a member</p>
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
