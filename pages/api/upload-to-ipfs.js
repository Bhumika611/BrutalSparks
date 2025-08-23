import formidable from 'formidable';
import fs from 'fs';
import { create } from 'ipfs-http-client';

// Disable bodyParser for this API route to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize IPFS client
const getIPFSClient = () => {
  // Try different IPFS providers
  const providers = [
    // Local IPFS node (if running)
    { host: 'localhost', port: 5001, protocol: 'http' },
    // Infura IPFS (requires project credentials)
    {
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: process.env.IPFS_PROJECT_ID ? {
        authorization: `Basic ${Buffer.from(
          `${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`
        ).toString('base64')}`
      } : undefined
    }
  ];

  // Try each provider until one works
  for (const provider of providers) {
    try {
      return create(provider);
    } catch (error) {
      console.log(`Failed to connect to IPFS provider:`, error.message);
    }
  }
  
  // Fallback to default
  return create();
};

// Encrypt data (simple XOR encryption for demo - use proper encryption in production)
const encryptData = (data, key = 'demo-encryption-key') => {
  const encrypted = Buffer.alloc(data.length);
  const keyBuffer = Buffer.from(key);
  
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return encrypted;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const form = formidable({
      uploadDir: './tmp',
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    const metadata = fields.metadata?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Processing file upload:', file.originalFilename);

    // Read file data
    const fileData = fs.readFileSync(file.filepath);
    
    // Encrypt the file data
    const encryptedData = encryptData(fileData);
    
    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(metadata || '{}');
    } catch (error) {
      console.log('Invalid metadata JSON, using empty object');
    }

    // Create comprehensive metadata
    const fileMetadata = {
      ...parsedMetadata,
      originalName: file.originalFilename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      encrypted: true,
      encryptionMethod: 'XOR', // In production, use AES or similar
      ipfsVersion: '1.0'
    };

    // Initialize IPFS client
    const ipfs = getIPFSClient();
    
    console.log('Uploading to IPFS...');
    
    // Upload encrypted file to IPFS
    const fileResult = await ipfs.add({
      content: encryptedData,
      path: `encrypted_${file.originalFilename}`
    });
    
    console.log('File uploaded to IPFS:', fileResult.cid.toString());
    
    // Upload metadata to IPFS
    const metadataResult = await ipfs.add({
      content: JSON.stringify(fileMetadata, null, 2),
      path: 'metadata.json'
    });
    
    console.log('Metadata uploaded to IPFS:', metadataResult.cid.toString());
    
    // Create a directory containing both file and metadata
    const directoryFiles = [
      {
        path: 'dataset/encrypted_data',
        content: encryptedData
      },
      {
        path: 'dataset/metadata.json',
        content: JSON.stringify(fileMetadata, null, 2)
      }
    ];
    
    // Upload directory to IPFS
    let directoryHash = '';
    for await (const result of ipfs.addAll(directoryFiles, { wrapWithDirectory: true })) {
      if (result.path === '') {
        directoryHash = result.cid.toString();
      }
    }
    
    console.log('Directory uploaded to IPFS:', directoryHash);
    
    // Clean up temporary file
    try {
      fs.unlinkSync(file.filepath);
    } catch (error) {
      console.log('Failed to clean up temp file:', error.message);
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      ipfsHash: directoryHash,
      fileHash: fileResult.cid.toString(),
      metadataHash: metadataResult.cid.toString(),
      metadata: fileMetadata,
      message: 'File uploaded successfully to IPFS'
    });
    
  } catch (error) {
    console.error('IPFS upload error:', error);
    
    // Clean up any temporary files
    try {
      const form = formidable();
      const [, files] = await form.parse(req);
      const file = files.file?.[0];
      if (file?.filepath) {
        fs.unlinkSync(file.filepath);
      }
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError.message);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload to IPFS',
      details: error.message
    });
  }
}
