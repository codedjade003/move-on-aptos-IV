import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Row, Col, Pagination, message, Button, Input, Modal, Select, Checkbox, Form, Space } from "antd";
import { AptosClient } from "aptos";
import BulkMintNFTs from "../components/BulkMintNFTs";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const { Title } = Typography;
const { Meta } = Card;
const yourBackgroundImage = "/images/aptos_wallpaper.jpg";


const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

type NFT = {
  id: number;
  name: string;
  description: string;
  uri: string;
  rarity: number;
  price: number;
  for_sale: boolean;
};

const DeveloperPage: React.FC = () => {
  const pageSize = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const { account, signAndSubmitTransaction } = useWallet();
  const marketplaceAddr = "0x587c3baf114387ef77bdca8b51cf17ff6f05bc3b899fecbf42eaa3aac391ebc9";

  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedRarity, setSelectedRarity] = useState<string | undefined>(undefined);
  const [onlyForSale, setOnlyForSale] = useState(false);
  const [nftIds, setNftIds] = useState<number[]>([]); // Initialize nftIds state


  const fetchUserNFTs = useCallback(async () => {
    if (!account) return;
  
    try {
      const filters: any = {};
      if (selectedRarity) filters.rarity = selectedRarity;
      if (onlyForSale) filters.onlyForSale = 1;
      if (minPrice !== undefined) filters.minPrice = minPrice;
      if (maxPrice !== undefined) filters.maxPrice = maxPrice;
  
      const nftIdsResponse = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_all_nfts_for_owner`,
        arguments: [marketplaceAddr, account.address, "100", "0"],
        type_arguments: [],
      });
  
      const nftIds = Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse;
      console.log("Fetched NFT IDs:", nftIds); // Debugging log
      setTotalNFTs(nftIds.length);
  
      const userNFTs = (await Promise.all(
        nftIds.map(async (id) => {
          try {
            if (!id) {
              console.warn(`Skipping invalid NFT ID: ${id}`);
              return null;
            }
      
            const nftDetails = await client.view({
              function: `${marketplaceAddr}::NFTMarketplace::get_nft_details`,
              arguments: [marketplaceAddr, id],
              type_arguments: [],
            });
      
            const [nftId, , name, description, uri, price, forSale, rarity] = nftDetails as [
              number,
              string,
              string,
              string,
              string,
              number,
              boolean,
              number
            ];
      
            const hexToUtf8 = (hexString: string): string => {
              const hexWithoutPrefix = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
              const bytes = new Uint8Array(hexWithoutPrefix.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
              return new TextDecoder().decode(bytes);
            };
      
            return {
              id: nftId,
              name: hexToUtf8(name),
              description: hexToUtf8(description),
              uri: hexToUtf8(uri),
              rarity,
              price: price / 100000000,
              for_sale: forSale,
            };
          } catch (error) {
            console.error(`Error fetching details for NFT ID ${id}:`, error);
            return null;
          }
        })
      )).filter((nft): nft is NFT => nft !== null);
      
  
      console.log("Filtered NFTs:", userNFTs); // Debugging log
  
      const filteredNFTs = userNFTs.filter((nft) => {
        const rarityAsNumber = selectedRarity ? parseInt(selectedRarity, 10) : undefined;
        const matchesRarity = selectedRarity ? nft.rarity === rarityAsNumber : true;
        const matchesSaleStatus = onlyForSale ? nft.for_sale : true;
        const matchesPriceRange =
          (minPrice === undefined || nft.price >= minPrice) &&
          (maxPrice === undefined || nft.price <= maxPrice);
  
        return matchesRarity && matchesSaleStatus && matchesPriceRange;
      });
  
      setNfts(filteredNFTs);
      console.log("Displayed NFTs:", filteredNFTs); // Debugging log
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      message.error("Failed to fetch your NFTs.");
    }
  }, [account, marketplaceAddr, selectedRarity, onlyForSale, minPrice, maxPrice]);

  // Bulk Minting Function
const handleBulkMintNFTs = async (nfts: { name: string; description: string; uri: string; rarity: number }[]) => {
  try {
    for (const nft of nfts) {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::mint_nft`,
        type_arguments: [],
        arguments: [marketplaceAddr, nft.name, nft.description, nft.uri, nft.rarity.toString()],
      };

      console.log("Payload:", entryFunctionPayload); // Debugging log
      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);

      console.log(`Successfully minted: ${txnResponse.hash}`);
    }

    message.success("All NFTs minted successfully!");
  } catch (error) {
    console.error("Error minting NFTs:", error);
    message.error("Failed to mint some NFTs. Check the logs for details.");
  }
};



  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs, currentPage]);

  

  const paginatedNFTs = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const [nftIdToBurn, setNftIdToBurn] = useState<number | null>(null); // Temporary state for NFT ID to burn
  const tempHandleBurnNFTClick = async () => {
    if (nftIdToBurn === null) {
      message.error("Please enter a valid NFT ID to burn.");
      return;
    }
  
    try {
      // Call the burn NFT function with the inputted ID
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::burn_nft`,
        type_arguments: [],
        arguments: [nftIdToBurn], // Pass the NFT ID to burn
      };
  
      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);
  
      message.success("NFT burned successfully!");
      fetchUserNFTs(); // Refresh the NFT list after burning
    } catch (error) {
      console.error("Error burning NFT:", error);
      message.error("Failed to burn NFT.");
    }
  };

  const handleBulkTransferNFTs = async (recipient: string, nftIds: number[]) => {
    if (!recipient) {
      message.error("Recipient address is required.");
      return;
    }
  
    const errors: string[] = [];
    let successCount = 0;
  
    for (const nftId of nftIds) {
      try {
        const entryFunctionPayload = {
          type: "entry_function_payload",
          function: `${marketplaceAddr}::NFTMarketplace::transfer_nft`,
          type_arguments: [],
          arguments: [
            marketplaceAddr, // Marketplace address
            nftId.toString(), // NFT ID
            recipient, // Recipient's address
          ],
        };
  
        const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
        await client.waitForTransaction(response.hash);
  
        successCount++;
      } catch (error) {
        console.error(`Error transferring NFT ID ${nftId}:`, error);
        errors.push(`NFT ID ${nftId}`);
      }
    }
  
    if (errors.length > 0) {
      message.error(`Failed to transfer the following NFTs: ${errors.join(", ")}`);
    }
  
    if (successCount > 0) {
      message.success(`${successCount} NFTs transferred successfully!`);
      fetchUserNFTs(); // Refresh the list
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        backgroundImage: `url(${yourBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <div style={{ backgroundColor: "rgba(255, 255, 255, 0.8)", borderRadius: "10px", padding: "20px" }}>
        <Title level={2}>Developer Mode</Title>
        <p>Perform bulk operations and manage your NFTs with advanced tools.</p>
  
        {/* Bulk Mint NFTs Section */}
        <BulkMintNFTs onBulkMint={handleBulkMintNFTs} />
  
        {/* Filters Section */}
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          <Select
            placeholder="Select Rarity"
            onChange={(value) => setSelectedRarity(value)}
            style={{ width: 200 }}
            allowClear
          >
            <Select.Option value={1}>Common</Select.Option>
            <Select.Option value={2}>Uncommon</Select.Option>
            <Select.Option value={3}>Rare</Select.Option>
            <Select.Option value={4}>Epic</Select.Option>
            <Select.Option value={5}>Legendary</Select.Option>
          </Select>
  
          <Checkbox onChange={(e) => setOnlyForSale(e.target.checked)}>
            Only For Sale
          </Checkbox>
  
          <Input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            style={{ width: 150 }}
          />
          <Input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            style={{ width: 150 }}
          />
        </div>
  
        {/* NFTs Grid */}
        <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
          {paginatedNFTs.map((nft) => (
            <Col key={nft.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                cover={<img alt={nft.name} src={nft.uri} />}
                actions={[]}
                style={{ borderRadius: "10px", overflow: "hidden" }}
              >
                <Meta title={nft.name} description={`Rarity: ${nft.rarity}, Price: ${nft.price} APT`} />
                <p>ID: {nft.id}</p>
              </Card>
            </Col>
          ))}
        </Row>
  
        {/* Burn NFT Section */}
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <Title level={5}>
            Note: This function is buggy and not fully developed. Using this function may cause NFTs to display incorrectly.
          </Title>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
            <Input
              type="number"
              placeholder="Enter NFT ID to burn"
              value={nftIdToBurn ?? ""}
              onChange={(e) => setNftIdToBurn(Number(e.target.value))}
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={tempHandleBurnNFTClick}>
              Burn NFT
            </Button>
          </div>
        </div>
  
        {/* Pagination */}
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalNFTs}
          onChange={(page) => setCurrentPage(page)}
          style={{ marginTop: "30px" }}
        />
  
        {/* Bulk Transfer Section */}
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <Title level={4}>Bulk Transfer NFTs</Title>
          <Form
            layout="inline"
            onFinish={(values: { recipient: string; ids: string }) =>
              handleBulkTransferNFTs(values.recipient, values.ids.split(",").map((id) => Number(id) - 1))
            }
          >
            <Form.Item
              name="recipient"
              rules={[{ required: true, message: "Please enter recipient address" }]}
            >
              <Input placeholder="Recipient Address" style={{ width: 300 }} />
            </Form.Item>
  
            <Form.Item
              name="ids"
              rules={[{ required: true, message: "Enter NFT IDs separated by commas" }]}
            >
              <Input placeholder="NFT IDs (comma-separated)" style={{ width: 300 }} />
            </Form.Item>
  
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Transfer NFTs
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
  
};

export default DeveloperPage;
