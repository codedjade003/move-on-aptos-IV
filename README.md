
# NFT Marketplace Web App - README

## Overview

Welcome to the NFT Marketplace Web App! This platform allows users to explore, mint, buy, sell, and burn NFTs. Built on the Aptos blockchain, it provides a seamless experience for creators, collectors, and developers. The app is designed with several features that enhance the user experience, including a simple interface for minting and transferring NFTs, as well as a Developer Mode for more advanced functionality.

### Key Features
- **Mint NFTs**: Easily mint new NFTs to the marketplace with your own metadata.
- **Buy and Sell NFTs**: Browse listings, make purchases, and sell your NFTs.
- **Burn NFTs**: Burn NFTs directly from your wallet or via batch operations (bulk burn).
- **Developer Mode**: A toggleable feature allowing admin users or select users to mint, burn, and transfer multiple NFTs at once. It also provides access to additional tools like the Burn by ID function and Bulk Transfer feature.
- **Tip Jar**: Users can send tips to creators via a tip jar feature, available both globally and for individual NFTs.
  
**Note**: The app does not have a search function but includes advanced filtering capabilities to help users find what they are looking for efficiently.

---

## How to Run the NFT Marketplace Web App

To run the app locally, follow these steps:

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed. You can download it [here](https://nodejs.org/).
2. **Aptos SDK**: Ensure you have the Aptos blockchain setup and configured in your development environment.

### Running the App

1. Clone the repository:

   ```bash
   git clone https://github.com/codedjade003/move-on-aptos-IV.git
   cd aptos4-q2
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   This will run the web app locally, and it should be accessible at `http://localhost:3000`.

   Make sure the marketplace is initialized on the [aptos explorer](https://explorer.aptoslabs.com/account/0x587c3baf114387ef77bdca8b51cf17ff6f05bc3b899fecbf42eaa3aac391ebc9/modules/run/NFTMarketplace/initialize?network=devnet) before proceeding

---

## Detailed Features

### 1. **Mint NFTs**
   - All Users can mint new NFTs by filling out a simple form with metadata such as name, description, and image. Once minted, these NFTs are listed on the marketplace for sale. no Restrictions

### 2. **Buying and Selling NFTs**
   - Browse NFTs listed on the marketplace.
   - Each NFT can be purchased by making a simple transaction with your Aptos wallet.

### 3. **Developer Mode**
   - A special feature only available to select users with the correct password.
   - In Developer Mode, users can:
     - Mint multiple NFTs at once
     - Transfer multiple NFTs at once
     - Access Burn by ID function
   - This mode is designed for advanced users and admins who need to perform batch operations or test features.

### 4. **Tip Jar**
   - Users can leave tips to support the marketplace from the global tip jar located in the Navbar.
   - This feature allows for continuous improvement of the marketplace functions by the dev(s) from receiving small tokens of appreciation directly from their supporters.
     
### 5. **Tip Creator**
   - Users can leave tips for creators directly from the NFT page.
   - This feature allows for creators to receive small tokens of appreciation directly from their supporters.

### 6. **Royalties**
   - Creators receive 5% royalties on every sale of the NFT they minted

### 7. **Improved Filtering System and new Legendary Rarity level**
   - The new filter system includes a price range filter and a new Legendary Rarity Level

---

## Notes

- **Advanced Filtering**: Although the app doesn't feature a search function, you can filter NFTs using various criteria such as name, category, price range, and more. This enables users to easily find NFTs that meet their needs without the need for full-text search.

- **Faulty Burn Function**: The burn function in the developer mode did not work as intended and may cause inaccurate display of NFTs and their information

- **Hardcoded Developer mode passcode**: The passcode to toggle developer mode is "admin123"

---

## Contributing

Feel free to fork the repository and submit issues and pull requests for improvements, bug fixes, or new features.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
