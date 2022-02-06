import sdk from './1-initialize-sdk.js'
import { readFileSync } from 'fs'

// This is the address to our ERC-1155 membership NFT contract.
const bundleDrop = sdk.getBundleDropModule(process.env.ERC1155_NFT_ADDRESS)

;(async () => {
  try {
    await bundleDrop.createBatch([
      {
        name: 'Jimi Guitar Pick',
        description: 'This NFT will give you access to JimiDAO!',
        image: readFileSync('scripts/assets/pick.jpg'),
      },
    ])
    console.log('✅ Successfully created a new NFT in the drop!')
  } catch (error) {
    console.error('failed to create the new NFT', error)
  }
})()
