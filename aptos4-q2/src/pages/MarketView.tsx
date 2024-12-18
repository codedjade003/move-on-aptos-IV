import React, { useState, useEffect } from "react";
import { Typography, Radio, message, Card, Row, Col, Pagination, Tag, Button, Modal, Input } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const { Title } = Typography;
const { Meta } = Card;
const yourBackgroundImage = "/images/aptos_wallpaper.jpg";

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
  creator: string;
};

interface MarketViewProps {
  marketplaceAddr: string;
}

const rarityColors: { [key: number]: string } = {
  1: "green",
  2: "blue",
  3: "purple",
  4: "orange",
  5: "yellow"
};

const rarityLabels: { [key: number]: string } = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary"
};

const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

const MarketView: React.FC<MarketViewProps> = ({ marketplaceAddr }) => {
  const { signAndSubmitTransaction } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;


  useEffect(() => {
    handleFetchNfts(undefined);
  }, []);

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    try {
      const response = await client.getAccountResource(
        marketplaceAddr,
        "0x587c3baf114387ef77bdca8b51cf17ff6f05bc3b899fecbf42eaa3aac391ebc9::NFTMarketplace::Marketplace"
      );
      const nftList = (response.data as { nfts: NFT[] }).nfts;

      const hexToUint8Array = (hexString: string): Uint8Array => {
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
        return bytes;
      };

      const decodedNfts = nftList.map((nft) => ({
        ...nft,
        name: new TextDecoder().decode(hexToUint8Array(nft.name.slice(2))),
        description: new TextDecoder().decode(hexToUint8Array(nft.description.slice(2))),
        uri: new TextDecoder().decode(hexToUint8Array(nft.uri.slice(2))),
        price: nft.price / 100000000,
      }));

      const filteredNfts = decodedNfts.filter(
        (nft) => nft.for_sale && (selectedRarity === undefined || nft.rarity === selectedRarity)
      );

      setNfts(filteredNfts);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching NFTs by rarity:", error);
      message.error("Failed to fetch NFTs.");
    }
  };

  const paginatedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

const handleBuyClick = (nft: NFT) => {
  setSelectedNft(nft);
  setIsBuyModalVisible(true);
};

const handleCancelBuy = () => {
  setIsBuyModalVisible(false);
  setSelectedNft(null);
};

const handleConfirmPurchase = async () => {
  if (!selectedNft) return;

  try {
    const priceInOctas = selectedNft.price * 100000000;

    const entryFunctionPayload = {
      type: "entry_function_payload",
      function: `${marketplaceAddr}::NFTMarketplace::purchase_nft`,
      type_arguments: [],
      arguments: [marketplaceAddr, selectedNft.id.toString(), priceInOctas.toString()],
    };

    const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
    await client.waitForTransaction(response.hash);

    message.success("NFT purchased successfully!");
    setIsBuyModalVisible(false);
    await handleFetchNfts(undefined); // Correct way to refresh NFT list
  } catch (error) {
    console.error("Error purchasing NFT:", error);
    message.error("Failed to purchase NFT.");
  }
};

const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>("");
  const [selectedTipNFT, setSelectedTipNFT] = useState<NFT | null>(null);

  const handleTipClick = (nft: NFT) => {
    setSelectedTipNFT(nft);
    setIsTipModalVisible(true);
  };
  
  const handleConfirmTip = async () => {
    if (!selectedTipNFT || !tipAmount) {
      message.error("Please select an NFT and enter a valid tip amount.");
      return;
    }
  
    try {
      // Convert the tip amount to Octas (smallest APT unit)
      const tipInOctas = BigInt(Math.floor(parseFloat(tipAmount) * 100000000));
  
      // Ensure the tip amount is within u64 limits
      if (tipInOctas <= 0 || tipInOctas > BigInt("18446744073709551615")) {
        message.error("Tip amount is out of allowed range.");
        return;
      }
  
      // Prepare transaction payload
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::tip_creator`,
        type_arguments: [],
        arguments: [
          marketplaceAddr,                     // Marketplace address
          selectedTipNFT.id.toString(),       // NFT ID
          tipInOctas.toString(),              // Tip amount in Octas
        ],
      };
  
      // Submit transaction
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("Tip sent successfully!");
      setIsTipModalVisible(false);
      setTipAmount(""); // Reset the form
    } catch (error) {
      console.error("Error sending tip:", error);
      message.error("Failed to send tip.");
    }
  };
  
  
  
  const handleCancelTip = () => {
    setIsTipModalVisible(false);
    setTipAmount("");
    setSelectedTipNFT(null);
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
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",}}>
      <Title level={2} style={{ marginBottom: "20px" }}>Marketplace</Title>
      <Radio.Group
        value={rarity}
        onChange={(e) => {
          const selectedRarity = e.target.value;
          setRarity(selectedRarity);
          handleFetchNfts(selectedRarity === 'all' ? undefined : selectedRarity);
        }}
        buttonStyle="solid"
      >
        <Radio.Button value="all">All</Radio.Button>
        <Radio.Button value={1}>Common</Radio.Button>
        <Radio.Button value={2}>Uncommon</Radio.Button>
        <Radio.Button value={3}>Rare</Radio.Button>
        <Radio.Button value={4}>Super Rare</Radio.Button>
        <Radio.Button value={5}>Legendary</Radio.Button>
      </Radio.Group>

      <Row gutter={[24, 24]} style={{ marginTop: 20, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
        {paginatedNfts.map((nft) => (
          <Col key={nft.id} xs={24} sm={12} md={8} lg={6} xl={6}>

            <Card
  hoverable
  cover={<img alt={nft.name} src={nft.uri} />}
  style={{ maxWidth: "300px", margin: "0 auto", textAlign: "left" }}
>
  <Meta title={nft.name} description={`Price: ${nft.price} APT`} />
  <p><strong>ID:</strong> {nft.id}</p>
  <p><strong>Description:</strong> {nft.description}</p>
  <p>
    <strong>Rarity: </strong>
    <Tag color={rarityColors[nft.rarity]}>
      {rarityLabels[nft.rarity]}
    </Tag>
  </p>
  <p><strong>For Sale:</strong> {nft.for_sale ? "Yes" : "No"}</p>
  <p><strong>Owner:</strong> {truncateAddress(nft.owner)}</p>

  <Row gutter={8} justify="center" style={{ marginTop: "10px" }}>
    <Col span={12}>
      <Button
        type="primary"
        block
        onClick={() => handleBuyClick(nft)}
        disabled={!nft.for_sale}
      >
        Buy
      </Button>
    </Col>
    <Col span={12}>
      <Button
        type="default"
        block
        onClick={() => handleTipClick(nft)}
      >
        Tip Creator
      </Button>
    </Col>
  </Row>
</Card>


          </Col>
        ))}
            <Modal
            title="Tip Creator"
            visible={isTipModalVisible}
            onCancel={handleCancelTip}
            footer={[
              <Button key="cancel" onClick={handleCancelTip}>Cancel</Button>,
              <Button key="confirm" type="primary" onClick={handleConfirmTip}>Confirm Tip</Button>,
            ]}
          >
            {selectedTipNFT && (
              <>
                <p><strong>NFT Name:</strong> {selectedTipNFT.name}</p>
                <p><strong>Creator Address:</strong> {selectedTipNFT.creator}</p>
                <Input
                  type="number"
                  placeholder="Enter tip amount in APT"
                  value={tipAmount}
                  onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setTipAmount(e.target.value)}
                  style={{ marginTop: 10 }}
                />
              </>
            )}
          </Modal>
      </Row>

      <Pagination current={currentPage} pageSize={pageSize} total={nfts.length} onChange={setCurrentPage} />
      <Modal
      title="Confirm Purchase"
      visible={isBuyModalVisible}
      onCancel={handleCancelBuy}
      footer={[
        <Button key="cancel" onClick={handleCancelBuy}>
          Cancel
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirmPurchase}>
          Confirm Purchase
        </Button>,
      ]}
    >
      {selectedNft && (
        <>
          <p><strong>NFT ID:</strong> {selectedNft.id}</p>
          <p><strong>Name:</strong> {selectedNft.name}</p>
          <p><strong>Description:</strong> {selectedNft.description}</p>
          <p><strong>Rarity:</strong> {selectedNft.rarity}</p>
          <p><strong>Price:</strong> {selectedNft.price} APT</p>
          <p><strong>Owner:</strong> {truncateAddress(selectedNft.owner)}</p>
        </>
      )}
    </Modal>

    </div>
    </div>
    
  );
};

export default MarketView;
