import React, { useEffect, useState } from "react";
import { Layout, Typography, Menu, Space, Button, Dropdown, Input, Switch, message, Modal } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";
import { LogoutOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const { Header } = Layout;
const { Text } = Typography;

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

interface NavBarProps {
  onMintNFTClick: () => void;
}

const TIP_RECEIVER_ADDRESS = "0xd173e7ef18739a76f04923d76e641ca1b5f1ea64bbd9147dda8a4b62f87910ae";

const NavBar: React.FC<NavBarProps> = ({ onMintNFTClick }) => {
  const { connected, account, network, disconnect } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [developerPageVisible, setDeveloperPageVisible] = useState(false);
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(0.01);

  

  const correctPassword = "admin123"; // Hardcoded password (secure in production)
  const suggestedTipAmounts = [0.005, 0.01, 0.05];

  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        try {
          const resources: any[] = await client.getAccountResources(account.address);
          const accountResource = resources.find(
            (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
          );
          if (accountResource) {
            const balanceValue = (accountResource.data as any).coin.value;
            setBalance(balanceValue ? parseInt(balanceValue) / 100000000 : 0);
          } else {
            setBalance(0);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    if (connected) {
      fetchBalance();
    }
  }, [account, connected]);

  const handleLogout = async () => {
    try {
      await disconnect();
      setBalance(null);
      message.success("Disconnected from wallet");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      message.error("Failed to disconnect from wallet");
    }
  };

  const toggleDeveloperMode = (checked: boolean) => {
    setIsDeveloperMode(checked);
    if (checked) {
      setIsModalVisible(true); // Open modal when toggled on
    } else {
      setDeveloperPageVisible(false); // Reset Developer Page visibility
    }
  };

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setDeveloperPageVisible(true);
      message.success("Developer Mode activated!");
    } else {
      message.error("Incorrect password!");
    }
    setIsModalVisible(false); // Close modal regardless of success
  };

  const handleModalCancel = () => {
    setIsDeveloperMode(false); // Turn off Developer Mode toggle if modal is canceled
    setIsModalVisible(false);
  };


  const handleTipClick = () => {
    setIsTipModalVisible(true);
  };

  const handleSendTip = async () => {
    if (!account || !connected) {
      message.error("Please connect your wallet to send a tip!");
      return;
    }

    if (!selectedTipAmount || selectedTipAmount <= 0) {
      message.error("Please enter a valid tip amount!");
      return;
    }

    if (account.address === TIP_RECEIVER_ADDRESS) {
      message.error("You cannot tip yourself!");
      return;
    }

    try {
      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [TIP_RECEIVER_ADDRESS, (selectedTipAmount * 1e8).toString()],
      };

      const transactionRes = await (window as any).aptos.signAndSubmitTransaction(payload);

      if (transactionRes) {
        await client.waitForTransaction(transactionRes.hash);
        message.success(`Tip of ${selectedTipAmount} APT sent successfully!`);
      }
    } catch (error) {
      console.error("Failed to send tip:", error);
      message.error("Failed to send tip. Please try again!");
    } finally {
      setIsTipModalVisible(false);
    }
  };

    
  

  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#001529",
        padding: "0 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="/Aptos_Primary_WHT.png" alt="Aptos Logo" style={{ height: "30px", marginRight: 16 }} />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={["marketplace"]} style={{ backgroundColor: "#001529" }}>
          <Menu.Item key="marketplace">
            <Link to="/" style={{ color: "#fff" }}>Marketplace</Link>
          </Menu.Item>
          <Menu.Item key="my-collection">
            <Link to="/my-nfts" style={{ color: "#fff" }}>My Collection</Link>
          </Menu.Item>
          <Menu.Item key="mint-nft" onClick={onMintNFTClick}>
            <span style={{ color: "#fff" }}>Mint NFT</span>
          </Menu.Item>

          {developerPageVisible && (
            <Menu.Item key="developer">
              <Link to="/developer" style={{ color: "#fff" }}>
                Developer
              </Link>
            </Menu.Item>          
          )}
        </Menu>
      </div>

      <Space style={{ alignItems: "center" }}>
        {/* Tip Jar */}
        <motion.div
          className="tip-jar"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleTipClick}
          style={{ cursor: "pointer", marginRight: 16 }}
        >
          <img src="/tip-jar-icon.png" alt="Tip Jar" style={{ width: "30px", height: "30px" }} />
        </motion.div>

        <Space style={{ color: "#fff" }}>
          Developer Mode
          <Switch checked={isDeveloperMode} onChange={toggleDeveloperMode} />
        </Space>

        {connected && account ? (
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="address">
                  <Text strong>Address:</Text> <br />
                  <Text copyable>{account.address}</Text>
                </Menu.Item>
                <Menu.Item key="network">
                  <Text strong>Network:</Text> {network ? network.name : "Unknown"}
                </Menu.Item>
                <Menu.Item key="balance">
                  <Text strong>Balance:</Text> {balance !== null ? `${balance} APT` : "Loading..."}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                  Log Out
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button type="primary">
              Connected
            </Button>
          </Dropdown>
        ) : (
          <WalletSelector />
        )}
      </Space>

      {/* Password Modal */}
      <Modal
        title="Enter Developer Mode Password"
        visible={isModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={handleModalCancel}
        okText="Submit"
        cancelText="Cancel"
      >
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Modal>

      {/* Tip Modal */}
      <Modal title="Send a Tip" visible={isTipModalVisible} onOk={handleSendTip} onCancel={() => setIsTipModalVisible(false)} okText="Send Tip" cancelText="Cancel">
        <div>
          <p>Select an amount or enter a custom tip:</p>
          <div>
            {suggestedTipAmounts.map((amount) => (
              <Button key={amount} type={selectedTipAmount === amount ? "primary" : "default"} onClick={() => setSelectedTipAmount(amount)} style={{ margin: "0 5px" }}>
                {amount} APT
              </Button>
            ))}
          </div>
          <Input type="number" value={selectedTipAmount} onChange={(e) => setSelectedTipAmount(parseFloat(e.target.value))} placeholder="Custom Amount" style={{ marginTop: "10px" }} />
        </div>
      </Modal>
    </Header>
  );
};

export default NavBar;
