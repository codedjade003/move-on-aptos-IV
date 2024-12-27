// TODO# 1: Define Module and Marketplace Address
address 0xd173e7ef18739a76f04923d76e641ca1b5f1ea64bbd9147dda8a4b62f87910ae {

    module NFTMarketplace {
        use 0x1::signer;
        use 0x1::vector;
        use 0x1::coin;
        use 0x1::aptos_coin;

        // TODO# 2: Define NFT Structure
        struct NFT has store, key, drop {
            id: u64,
            owner: address,
            name: vector<u8>,
            description: vector<u8>,
            uri: vector<u8>,
            price: u64,
            for_sale: bool,
            rarity: u8,  // 1 for common, 2 for rare, 3 for epic, etc.
            creator: address,  // Creator's address to send royalties
        }


        // TODO# 3: Define Marketplace Structure
            struct Marketplace has key {
            nfts: vector<NFT>
            }
        

        
        // TODO# 4: Define ListedNFT Structure
           struct ListedNFT has copy, drop {
                id: u64,
                price: u64,
                rarity: u8
            }


        // TODO# 5: Set Marketplace Fee and Royalty Fee
        const MARKETPLACE_FEE_PERCENT: u64 = 2; // 2% fee
        const ROYALTY_PERCENT: u64 = 5; // 5% royalty fee for the creator



        // TODO# 6: Initialize Marketplace       
           public entry fun initialize(account: &signer) {
                let marketplace = Marketplace {
                    nfts: vector::empty<NFT>(),
                };
                move_to(account, marketplace);
           } 


        // TODO# 7: Check Marketplace Initialization
           #[view]
           public fun is_marketplace_initialized(marketplace_addr: address): bool {
                exists<Marketplace>(marketplace_addr)
           } 


        // TODO# 8: Mint New NFT
        public entry fun mint_nft(account: &signer, marketplace_addr: address, name: vector<u8>, description: vector<u8>, uri: vector<u8>, rarity: u8) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_id = vector::length(&marketplace.nfts);

            let new_nft = NFT {
                id: nft_id,
                owner: signer::address_of(account),
                name,
                description,
                uri,
                price: 0,
                for_sale: false,
                rarity,
                creator: signer::address_of(account), // Set the creator to the minter
            };

            vector::push_back(&mut marketplace.nfts, new_nft);
        }

        // TODO# 9: View NFT Details
            #[view]
        public fun get_nft_details(marketplace_addr: address, nft_id: u64): (u64, address, vector<u8>, vector<u8>, vector<u8>, u64, bool, u8, address) acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);

            // Ensure the NFT has not been burned
            assert!(nft.owner != @0x0, 404); // NFT is burned or doesn't exist

            (nft.id, nft.owner, nft.name, nft.description, nft.uri, nft.price, nft.for_sale, nft.rarity, nft.creator)
        }

        
        // TODO# 10: List NFT for Sale
            public entry fun list_for_sale(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
                let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
                let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

                assert!(nft_ref.owner == signer::address_of(account), 100); // Caller is not the owner
                assert!(!nft_ref.for_sale, 101); // NFT is already listed
                assert!(price > 0, 102); // Invalid price

                nft_ref.for_sale = true;
                nft_ref.price = price;
            }


        // TODO# 11: Update NFT Price
            public entry fun set_price(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
                let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
                let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

                assert!(nft_ref.owner == signer::address_of(account), 200); // Caller is not the owner
                assert!(price > 0, 201); // Invalid price

                nft_ref.price = price;
            }


        // TODO# 12: Purchase NFT with Royalty
        public entry fun purchase_nft(account: &signer, marketplace_addr: address, nft_id: u64, payment: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.for_sale, 400); // NFT is not for sale
            assert!(payment >= nft_ref.price, 401); // Insufficient payment

            // Calculate marketplace fee and royalty fee
            let marketplace_fee = (nft_ref.price * MARKETPLACE_FEE_PERCENT) / 100;
            let royalty_fee = (nft_ref.price * ROYALTY_PERCENT) / 100;
            let seller_revenue = payment - marketplace_fee - royalty_fee;

            // Transfer the marketplace fee to the marketplace
            coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, marketplace_fee);

            // Transfer the royalty fee to the creator
            coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.creator, royalty_fee);

            // Transfer the remaining payment to the seller
            coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.owner, seller_revenue);

            // Transfer ownership of the NFT
            nft_ref.owner = signer::address_of(account);
            nft_ref.for_sale = false;
            nft_ref.price = 0;
        }




        // TODO# 13: Check if NFT is for Sale
            #[view]
            public fun is_nft_for_sale(marketplace_addr: address, nft_id: u64): bool acquires Marketplace {
                let marketplace = borrow_global<Marketplace>(marketplace_addr);
                let nft = vector::borrow(&marketplace.nfts, nft_id);
                nft.for_sale
            }


        // TODO# 14: Get NFT Price
            #[view]
            public fun get_nft_price(marketplace_addr: address, nft_id: u64): u64 acquires Marketplace {
                let marketplace = borrow_global<Marketplace>(marketplace_addr);
                let nft = vector::borrow(&marketplace.nfts, nft_id);
                nft.price
            }


        // TODO# 15: Transfer Ownership
            public entry fun transfer_ownership(account: &signer, marketplace_addr: address, nft_id: u64, new_owner: address) acquires Marketplace {
                let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
                let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

                assert!(nft_ref.owner == signer::address_of(account), 300); // Caller is not the owner
                assert!(nft_ref.owner != new_owner, 301); // Prevent transfer to the same owner

                // Update NFT ownership and reset its for_sale status and price
                nft_ref.owner = new_owner;
                nft_ref.for_sale = false;
                nft_ref.price = 0;
            }



        // TODO# 16: Retrieve NFT Owner
            #[view]
            public fun get_owner(marketplace_addr: address, nft_id: u64): address acquires Marketplace {
                let marketplace = borrow_global<Marketplace>(marketplace_addr);
                let nft = vector::borrow(&marketplace.nfts, nft_id);
                nft.owner
            }


        // TODO# 17: Retrieve NFTs for Owner
            #[view]
        public fun get_all_nfts_for_owner(marketplace_addr: address, owner_addr: address, limit: u64, offset: u64): vector<u64> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft_ids = vector::empty<u64>();

            let nfts_len = vector::length(&marketplace.nfts);
            let end = min(offset + limit, nfts_len);
            let mut_i = offset;
            while (mut_i < end) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.owner == owner_addr) {
                    vector::push_back(&mut nft_ids, nft.id);
                };
                mut_i = mut_i + 1;
            };

            nft_ids
        }

 

        // TODO# 18: Retrieve NFTs for Sale
            #[view]
            public fun get_all_nfts_for_sale(marketplace_addr: address, limit: u64, offset: u64): vector<ListedNFT> acquires Marketplace {
                let marketplace = borrow_global<Marketplace>(marketplace_addr);
                let nfts_for_sale = vector::empty<ListedNFT>();

                let nfts_len = vector::length(&marketplace.nfts);
                let end = min(offset + limit, nfts_len);
                let mut_i = offset;
                while (mut_i < end) {
                    let nft = vector::borrow(&marketplace.nfts, mut_i);
                    if (nft.for_sale) {
                        let listed_nft = ListedNFT { id: nft.id, price: nft.price, rarity: nft.rarity };
                        vector::push_back(&mut nfts_for_sale, listed_nft);
                    };
                    mut_i = mut_i + 1;
                };

                nfts_for_sale
            }
        


        // TODO# 19: Define Helper Function for Minimum Value
        // Helper function to find the minimum of two u64 numbers
            public fun min(a: u64, b: u64): u64 {
                if (a < b) { a } else { b }
            }


        // TODO# 20: Retrieve NFTs by Rarity
        // New function to retrieve NFTs by rarity
            #[view]
            public fun get_nfts_by_rarity(marketplace_addr: address, rarity: u8): vector<u64> acquires Marketplace {
                let marketplace = borrow_global<Marketplace>(marketplace_addr);
                let nft_ids = vector::empty<u64>();

                let nfts_len = vector::length(&marketplace.nfts);
                let mut_i = 0;
                while (mut_i < nfts_len) {
                    let nft = vector::borrow(&marketplace.nfts, mut_i);
                    if (nft.rarity == rarity) {
                        vector::push_back(&mut nft_ids, nft.id);
                    };
                    mut_i = mut_i + 1;
                };

                nft_ids
            }

        // TODO# 21: Add NFT Transfer Function
            public entry fun transfer_nft(
                account: &signer,
                marketplace_addr: address,
                nft_id: u64,
                recipient: address
            ) acquires Marketplace {
                let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
                let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

                // Ensure the sender is the owner of the NFT
                assert!(nft_ref.owner == signer::address_of(account), 500); // Caller is not the owner
                assert!(nft_ref.owner != recipient, 501); // Cannot transfer to self

                // Transfer ownership
                nft_ref.owner = recipient;

                // Reset the sale status and price
                nft_ref.for_sale = false;
                nft_ref.price = 0;
            }

        // TODO# 22: Retrieve NFTs by Filters (rarity, price range)
        // Retrieve NFTs by Filters (rarity, price range) - Without pagination
        #[view]
        public fun get_filtered_nfts(
            marketplace_addr: address, 
            rarity: u8,          // Filter by rarity (0 for no filter)
            min_price: u64,      // Minimum price (0 for no minimum)
            max_price: u64       // Maximum price (u64::MAX for no maximum)
        ): vector<u64> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let filtered_nfts = vector::empty<u64>();

            let nfts_len = vector::length(&marketplace.nfts);
            let mut_i = 0;

            while (mut_i < nfts_len) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);

                if (
                    nft.for_sale && 
                    (rarity == 0 || nft.rarity == rarity) &&  // Check rarity
                    nft.price >= min_price &&                 // Check min price
                    nft.price <= max_price                    // Check max price
                ) {
                    vector::push_back(&mut filtered_nfts, nft.id);
                };
                mut_i = mut_i + 1;
            };

            filtered_nfts
        }


        // TODO# 23: Burn NFT from the collection
        public entry fun burn_nft(account: &signer, marketplace_addr: address, nft_id: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            // Ensure the caller is the owner of the NFT
            assert!(nft_ref.owner == signer::address_of(account), 400); // Caller is not the owner

            // Remove the NFT using swap_remove to maintain efficiency
            vector::swap_remove(&mut marketplace.nfts, nft_id);
        }

        // TODO# 23.5: Burn all NFTs from the collection
        public entry fun burn_all_nfts(account: &signer, marketplace_addr: address) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let caller_addr = signer::address_of(account);

            // Iterate through all NFTs and remove those owned by the caller
            let i = 0;
            while (i < vector::length(&marketplace.nfts)) {
                let nft_ref = vector::borrow(&marketplace.nfts, i);

                if (nft_ref.owner == caller_addr) {
                    // Remove the NFT using swap_remove for efficiency
                    vector::swap_remove(&mut marketplace.nfts, i);
                } else {
                    i = i + 1; // Increment index only if no removal occurred
                }
            }
        }




        // TODO# 24: Tip or Donate to Creator
        public entry fun tip_creator(account: &signer, marketplace_addr: address, nft_id: u64, tip_amount: u64) acquires Marketplace {
            // Use borrow_global_mut to get a mutable reference to the Marketplace
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);

            // Now you can safely borrow a mutable reference to the NFT within the marketplace
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            // Ensure that the tipper is not trying to tip themselves
            assert!(nft_ref.creator != signer::address_of(account), 600); // Can't tip yourself

            // Ensure the tip amount is positive
            assert!(tip_amount > 0, 601); // Tip amount must be positive

            // Transfer the tip to the creator
            coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.creator, tip_amount);
        }


    }
}
