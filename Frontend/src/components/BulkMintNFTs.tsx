import React, { useState } from "react";
import { Form, Input, Select, Button, Card, Space, message } from "antd";

type NFT = {
  name: string;
  description: string;
  uri: string;
  rarity: number;
};

const BulkMintNFTs = ({ onBulkMint }: { onBulkMint: (nfts: NFT[]) => void }) => {
  const [nfts, setNFTs] = useState<NFT[]>([
    { name: "", description: "", uri: "", rarity: 1 },
  ]);

  const addNFTField = () => {
    setNFTs([...nfts, { name: "", description: "", uri: "", rarity: 1 }]);
  };

  const removeNFTField = (index: number) => {
    const updatedNFTs = nfts.filter((_, idx) => idx !== index);
    setNFTs(updatedNFTs);
  };

  const handleChange = <K extends keyof NFT>(index: number, key: K, value: NFT[K]) => {
    const updatedNFTs = [...nfts];
    updatedNFTs[index][key] = value;
    setNFTs(updatedNFTs);
  };

  const handleSubmit = () => {
    const isValid = nfts.every(
      (nft) => nft.name && nft.description && nft.uri && nft.rarity
    );

    if (!isValid) {
      message.error("Please fill out all fields for every NFT.");
      return;
    }

    onBulkMint(nfts);
  };

  return (
    <Card style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h2>Bulk Mint NFTs</h2>
      <Form layout="vertical">
        {nfts.map((nft, index) => (
          <Card
            key={index}
            style={{ marginBottom: "16px", border: "1px solid #f0f0f0" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Form.Item label="Name">
                <Input
                  value={nft.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Description">
                <Input
                  value={nft.description}
                  onChange={(e) =>
                    handleChange(index, "description", e.target.value)
                  }
                />
              </Form.Item>
              <Form.Item label="URI">
                <Input
                  value={nft.uri}
                  onChange={(e) => handleChange(index, "uri", e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Rarity">
                <Select
                  value={nft.rarity}
                  onChange={(value) => handleChange(index, "rarity", value)}
                >
                  <Select.Option value={1}>Common</Select.Option>
                  <Select.Option value={2}>Uncommon</Select.Option>
                  <Select.Option value={3}>Rare</Select.Option>
                  <Select.Option value={4}>Epic</Select.Option>
                  <Select.Option value={5}>Legendary</Select.Option>
                </Select>
              </Form.Item>
              <Button
                type="dashed"
                danger
                onClick={() => removeNFTField(index)}
                disabled={nfts.length === 1}
              >
                Remove
              </Button>
            </Space>
          </Card>
        ))}

        <Space>
          <Button type="dashed" onClick={addNFTField}>
            Add More NFTs
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Bulk Mint
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default BulkMintNFTs;
