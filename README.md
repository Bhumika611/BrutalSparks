# Decentralized AI Marketplace

A decentralized marketplace for buying and selling AI datasets using blockchain technology and IPFS for data storage.

## Features

- **Smart Contract**: Ethereum-based smart contract for managing dataset transactions
- **IPFS Integration**: Decentralized storage for datasets using IPFS
- **Web3 Integration**: Frontend built with Next.js and React for interacting with the blockchain
- **Secure Transactions**: Escrow-based payment system ensuring fair transactions

## Smart Contract Features

- Upload datasets with IPFS hash and price
- Purchase datasets with ETH
- Automatic payment distribution to dataset owners
- Prevention of double-purchasing
- Event emission for frontend integration

## Project Structure

```
decentralized-ai-marketplac/
├── contracts/
│   └── DataMarketplace.sol    # Main smart contract
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   └── DataMarketplace.test.js # Smart contract tests
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask or another Web3 wallet

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd decentralized-ai-marketplac
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Compile Smart Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Deploy to Local Network
```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy the contract
npm run deploy
```

### Start Development Server
```bash
npm run dev
```

## Smart Contract Functions

### `uploadDataset(string memory _ipfsHash, uint _price)`
Upload a new dataset to the marketplace.
- `_ipfsHash`: IPFS hash of the dataset
- `_price`: Price in wei

### `purchaseDataset(uint _id)`
Purchase a dataset by its ID.
- `_id`: Dataset ID to purchase
- Requires sending the exact price in ETH

## Testing

The project includes comprehensive tests covering:
- Dataset upload functionality
- Dataset purchase with correct payment
- Error handling for insufficient payment
- Prevention of double-purchasing

Run tests with:
```bash
npm run test
```

## Development

### Adding New Features

1. Modify the smart contract in `contracts/DataMarketplace.sol`
2. Update tests in `test/DataMarketplace.test.js`
3. Update deployment script if needed
4. Test thoroughly before deployment

### Frontend Integration

The project is set up with Next.js for the frontend. Key integration points:
- Connect to Web3 provider (MetaMask)
- Interact with smart contract functions
- Handle IPFS uploads and retrievals
- Manage user transactions

## Security Considerations

- Always verify IPFS hashes before purchase
- Use proper access controls for sensitive operations
- Implement proper error handling
- Test thoroughly on testnets before mainnet deployment

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and questions, please open an issue on the repository.
