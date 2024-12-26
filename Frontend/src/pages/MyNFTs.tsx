
import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Row, Col, Pagination, message, Button, Input, Modal, Select, Checkbox } from "antd";
import { AptosClient } from "aptos";
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
  creator: string; // Add this field
};

const MyNFTs: React.FC = () => {
  const pageSize = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const { account, signAndSubmitTransaction } = useWallet();
  const marketplaceAddr = "0xd173e7ef18739a76f04923d76e641ca1b5f1ea64bbd9147dda8a4b62f87910ae";

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [salePrice, setSalePrice] = useState<string>('');

  const fetchUserNFTs = useCallback(async () => {
    if (!account) return;

    try {
      const nftIdsResponse = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_all_nfts_for_owner`,
        arguments: [marketplaceAddr, account.address, "100", "0"],
        type_arguments: [],
      });

      const nftIds = Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse;
      console.log("Fetched NFT IDs:", nftIds);
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

            const [nftId, , name, description, uri, price, forSale, rarity, creator] = nftDetails as [
              number,
              string,
              string,
              string,
              string,
              number,
              boolean,
              number,
              string
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
              creator,
            };
          } catch (error) {
            console.error(`Error fetching details for NFT ID ${id}:`, error);
            return null;
          }
        })
      )).filter((nft): nft is NFT => nft !== null);

      console.log("Filtered NFTs:", userNFTs);
      setNfts(userNFTs);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
    }
  }, [account, client, marketplaceAddr]);

  const handleBurnClick = async (nft: NFT) => {
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::burn_nft`,
        type_arguments: [],
        arguments: [marketplaceAddr, nft.id],
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);

      message.success("NFT burned successfully!");
      setNfts((prevNfts) => prevNfts.filter((item) => item.id !== nft.id));
    } catch (error) {
      console.error("Error burning NFT:", error);
      message.error("Failed to burn NFT.");
    }
  };

  const handleSellClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedNft(null);
    setSalePrice("");
  };

  const handleConfirmListing = async () => {
    if (!selectedNft || !salePrice) return;

    try {
      const priceInOctas = parseFloat(salePrice) * 100000000;

      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::list_for_sale`,
        type_arguments: [],
        arguments: [marketplaceAddr, selectedNft.id.toString(), priceInOctas.toString()],
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);

      message.success("NFT listed for sale successfully!");
      setIsModalVisible(false);
      setSalePrice("");
      fetchUserNFTs();
    } catch (error) {
      console.error("Error listing NFT for sale:", error);
      message.error("Failed to list NFT for sale.");
    }
  };

  const handleTransferClick = async (nft: NFT) => {
    const recipientAddress = prompt("Enter the recipient's Aptos address:");

    if (!recipientAddress) return;

    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::transfer_nft`,
        type_arguments: [],
        arguments: [marketplaceAddr, nft.id.toString(), recipientAddress],
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);

      message.success("NFT transferred successfully!");
      fetchUserNFTs();
    } catch (error) {
      console.error("Error transferring NFT:", error);
      message.error("Failed to transfer NFT.");
    }
  };

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs, currentPage]);

  const paginatedNFTs = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
    style={{
      textAlign: "center",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "20px",
      minHeight: "100vh",
    }}
  >
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Title level={2} style={{ marginBottom: "20px" }}>My Collection</Title>
      <p>Your personal collection of NFTs.</p>
   
      {/* Card Grid */}
      <Row
        gutter={[32, 32]} // Increased gutter size for better spacing
        style={{
          marginTop: 20,
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {paginatedNFTs.map((nft) => (
          <Col
            key={nft.id}
            xs={24} sm={12} md={8} lg={8} xl={6}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Card
              hoverable
              style={{
                width: "100%",
                maxWidth: "320px", // Increased maxWidth for larger cards
                minWidth: "240px", // Adjusted for smaller screen compatibility
                padding: "15px", // Added padding inside the card
                margin: "0 auto",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Added subtle shadow for better aesthetics
              }}
              cover={<img alt={nft.name} src={nft.uri} style={{ height: "200px", objectFit: "cover" }} />}
            >
              <Meta
                title={<span style={{ fontSize: "16px", fontWeight: "bold" }}>{nft.name}</span>}
                description={<p>Rarity: {nft.rarity}, Price: {nft.price} APT</p>}
              />
              <p style={{ marginTop: "10px" }}>ID: {nft.id}</p>
              <p>{nft.description}</p>
              <p style={{ margin: "10px 0" }}>For Sale: {nft.for_sale ? "Yes" : "No"}</p>
              <p style={{ margin: "10px 0" }}>Royalty: 5%</p>
  
              {/* Button Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Button type="primary" block onClick={() => handleSellClick(nft)}>
                  Sell
                </Button>
                <Button type="default" block onClick={() => handleTransferClick(nft)}>
                  Transfer
                </Button>
                <Button type="default" danger block onClick={() => handleBurnClick(nft)}>
                  Burn
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
  
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalNFTs}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>
          {/* Modal for selling NFT */}
          <Modal
          title="Sell NFT"
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button key="confirm" type="primary" onClick={handleConfirmListing}>
              Confirm Listing
            </Button>,
          ]}
        >
          {selectedNft && (
            <>
              <p><strong>NFT ID:</strong> {selectedNft.id}</p>
              <p><strong>Name:</strong> {selectedNft.name}</p>
              <p><strong>Description:</strong> {selectedNft.description}</p>
              <p><strong>Rarity:</strong> {selectedNft.rarity}</p>
              <p><strong>Current Price:</strong> {selectedNft.price} APT</p>
    
              <Input
                type="number"
                placeholder="Enter sale price in APT"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                style={{ marginTop: 10 }}
              />
            </>
          )}
        </Modal>
  </div>
  </div>
  
  );
};

export default MyNFTs;
