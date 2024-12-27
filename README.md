# NFTMarketplace

NFTMarketplace is a blockchain-based platform designed for minting, buying, and selling NFTs (Non-Fungible Tokens). Built on the Aptos blockchain, it leverages the power of decentralized systems for secure and efficient trading of digital assets.

---

## Package Information

*Name:* NFTMarketplace  
*Version:* 0.1.0

---

## Blockchain Addresses

The project defines the following addresses:

- *NFTMarketplace:* 0xd173e7ef18739a76f04923d76e641ca1b5f1ea64bbd9147dda8a4b62f87910ae
- *Aptos Framework:* 0x1
- *Primitives:* 0xCAFE

---

## Dependencies

The project uses the following dependencies:

1. *AptosFramework*  
   Repository: [Aptos Core](https://github.com/aptos-labs/aptos-core)  
   Path: aptos-move/framework/aptos-framework  
   Revision: main

2. *AptosStdlib*  
   Repository: [Aptos Core](https://github.com/aptos-labs/aptos-core)  
   Path: aptos-move/framework/aptos-stdlib  
   Revision: main

3. *MoveStdlib*  
   Repository: [Aptos Core](https://github.com/aptos-labs/aptos-core)  
   Path: aptos-move/framework/move-stdlib  
   Revision: main

---

## Setup

Follow these steps to set up the NFTMarketplace project:

1. *Clone the Repository*  
   bash
   git clone https://github.com/codedjade003/move-on-aptos-IV
   

2. *Navigate to the Project Directory*  
   bash
   cd move-on-aptos-IV
   

3. *Ensure Move and Aptos CLI Tools Are Installed*  
   Install Move CLI and Aptos CLI to manage dependencies and deploy modules.
   
   bash
   cd move-on-aptos-IV

5. *Initialize a profile on the Project*
    cd NFTMarketplace
    cd contracts
    aptos init
   *Input your privat key*
    aptos move publish
   

7. *Run Tests on the frontend*  
   Open a new terminal
   bash
   cd Frontend
   npm install
   npm start
   
## New Features

Developer mode:
- *Bulk Mint NFTs*: Mint Multiple NFTs at once.
- *Bulk Transfer NFTs*: Transfer ownership of multiple nfts at once.
- *Burn all NFTs*: Burn all unwanted NFTs at once
- *Advanced Filtering*: search for NFTs by Rarity and Price Range
- *Tip Creator and Donate to Market place*: Users can now tip Creators or Donate to the marketplace via the tip jar
- *Minting access to all users*: No restrictions on minting, any user can mint
---

## Contribution

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a feature branch: git checkout -b feature-name.
3. Commit your changes: git commit -m 'Add feature'.
4. Push the branch: git push origin feature-name.
5. Open a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

Special thanks to the Stackup and Aptos community for providing an open-source framework for blockchain development.
