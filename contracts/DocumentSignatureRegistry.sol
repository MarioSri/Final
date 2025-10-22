// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DocumentSignatureRegistry
 * @dev Smart contract for recording and verifying document signatures on blockchain
 * 
 * Features:
 * - Record digital signatures with signer information
 * - Verify signature authenticity
 * - Track multiple signatures per document (approval chains)
 * - Immutable audit trail
 * - Event emissions for off-chain tracking
 * 
 * Use Cases:
 * - Academic document approvals
 * - Multi-level approval workflows
 * - Certificate issuance verification
 * - Legal document authenticity
 */

contract DocumentSignatureRegistry {
    
    // Signature record structure
    struct SignatureRecord {
        bytes32 signatureHash;      // Hash of the signature image/data
        address signer;              // Ethereum address of signer
        string signerName;           // Full name of signer
        string signerRole;           // Role (Principal, HOD, Registrar, etc.)
        uint256 timestamp;           // When signature was recorded
        bool isValid;                // Signature validity status
    }
    
    // Document structure to track multiple signatures
    struct Document {
        bytes32 documentHash;
        SignatureRecord[] signatures;
        mapping(bytes32 => bool) signatureExists;
        bool exists;
    }
    
    // Mapping: documentHash => Document
    mapping(bytes32 => Document) private documents;
    
    // Mapping: documentHash => array of signature hashes (for iteration)
    mapping(bytes32 => bytes32[]) private documentSignatureList;
    
    // Events
    event SignatureRecorded(
        bytes32 indexed documentHash,
        bytes32 indexed signatureHash,
        address indexed signer,
        string signerName,
        string signerRole,
        uint256 timestamp
    );
    
    event SignatureRevoked(
        bytes32 indexed documentHash,
        bytes32 indexed signatureHash,
        address revokedBy,
        uint256 timestamp
    );
    
    /**
     * @dev Record a signature on the blockchain
     * @param documentHash Unique hash of the document
     * @param signatureHash Hash of the signature data
     * @param signerName Full name of the signer
     * @param signerRole Role of the signer (e.g., "Principal", "HOD")
     * @return signatureId Unique identifier for this signature
     */
    function recordSignature(
        bytes32 documentHash,
        bytes32 signatureHash,
        string memory signerName,
        string memory signerRole
    ) external returns (uint256 signatureId) {
        require(documentHash != bytes32(0), "Invalid document hash");
        require(signatureHash != bytes32(0), "Invalid signature hash");
        require(bytes(signerName).length > 0, "Signer name required");
        require(bytes(signerRole).length > 0, "Signer role required");
        
        // Initialize document if it doesn't exist
        if (!documents[documentHash].exists) {
            documents[documentHash].documentHash = documentHash;
            documents[documentHash].exists = true;
        }
        
        // Check if this signature already exists
        require(
            !documents[documentHash].signatureExists[signatureHash],
            "Signature already recorded"
        );
        
        // Create signature record
        SignatureRecord memory newSignature = SignatureRecord({
            signatureHash: signatureHash,
            signer: msg.sender,
            signerName: signerName,
            signerRole: signerRole,
            timestamp: block.timestamp,
            isValid: true
        });
        
        // Add to document
        documents[documentHash].signatures.push(newSignature);
        documents[documentHash].signatureExists[signatureHash] = true;
        documentSignatureList[documentHash].push(signatureHash);
        
        // Emit event
        emit SignatureRecorded(
            documentHash,
            signatureHash,
            msg.sender,
            signerName,
            signerRole,
            block.timestamp
        );
        
        return documents[documentHash].signatures.length - 1;
    }
    
    /**
     * @dev Verify if a signature exists and is valid
     * @param documentHash Hash of the document
     * @param signatureHash Hash of the signature to verify
     * @return isValid True if signature exists and is valid
     */
    function verifySignature(
        bytes32 documentHash,
        bytes32 signatureHash
    ) external view returns (bool isValid) {
        if (!documents[documentHash].exists) {
            return false;
        }
        
        if (!documents[documentHash].signatureExists[signatureHash]) {
            return false;
        }
        
        // Find the signature and check validity
        SignatureRecord[] storage signatures = documents[documentHash].signatures;
        for (uint i = 0; i < signatures.length; i++) {
            if (signatures[i].signatureHash == signatureHash) {
                return signatures[i].isValid;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get the first (or primary) signature for a document
     * @param documentHash Hash of the document
     * @return Signature record details
     */
    function getSignature(bytes32 documentHash) 
        external 
        view 
        returns (SignatureRecord memory) 
    {
        require(documents[documentHash].exists, "Document not found");
        require(documents[documentHash].signatures.length > 0, "No signatures found");
        
        return documents[documentHash].signatures[0];
    }
    
    /**
     * @dev Get all signatures for a document
     * @param documentHash Hash of the document
     * @return Array of all signature records
     */
    function getDocumentSignatures(bytes32 documentHash)
        external
        view
        returns (SignatureRecord[] memory)
    {
        require(documents[documentHash].exists, "Document not found");
        return documents[documentHash].signatures;
    }
    
    /**
     * @dev Get signature count for a document
     * @param documentHash Hash of the document
     * @return count Number of signatures
     */
    function getSignatureCount(bytes32 documentHash) 
        external 
        view 
        returns (uint256 count) 
    {
        if (!documents[documentHash].exists) {
            return 0;
        }
        return documents[documentHash].signatures.length;
    }
    
    /**
     * @dev Check if a document has been recorded
     * @param documentHash Hash of the document
     * @return exists True if document exists
     */
    function documentExists(bytes32 documentHash) 
        external 
        view 
        returns (bool exists) 
    {
        return documents[documentHash].exists;
    }
    
    /**
     * @dev Revoke a signature (only by original signer or contract owner)
     * @param documentHash Hash of the document
     * @param signatureHash Hash of the signature to revoke
     */
    function revokeSignature(
        bytes32 documentHash,
        bytes32 signatureHash
    ) external {
        require(documents[documentHash].exists, "Document not found");
        require(
            documents[documentHash].signatureExists[signatureHash],
            "Signature not found"
        );
        
        // Find and revoke the signature
        SignatureRecord[] storage signatures = documents[documentHash].signatures;
        for (uint i = 0; i < signatures.length; i++) {
            if (signatures[i].signatureHash == signatureHash) {
                require(
                    signatures[i].signer == msg.sender,
                    "Only signer can revoke"
                );
                
                signatures[i].isValid = false;
                
                emit SignatureRevoked(
                    documentHash,
                    signatureHash,
                    msg.sender,
                    block.timestamp
                );
                
                break;
            }
        }
    }
    
    /**
     * @dev Get signature details by index
     * @param documentHash Hash of the document
     * @param index Index of the signature in the array
     * @return Signature record at the specified index
     */
    function getSignatureByIndex(
        bytes32 documentHash,
        uint256 index
    ) external view returns (SignatureRecord memory) {
        require(documents[documentHash].exists, "Document not found");
        require(
            index < documents[documentHash].signatures.length,
            "Index out of bounds"
        );
        
        return documents[documentHash].signatures[index];
    }
    
    /**
     * @dev Batch verify multiple signatures for a document
     * @param documentHash Hash of the document
     * @param signatureHashes Array of signature hashes to verify
     * @return results Array of booleans indicating validity
     */
    function batchVerifySignatures(
        bytes32 documentHash,
        bytes32[] calldata signatureHashes
    ) external view returns (bool[] memory results) {
        results = new bool[](signatureHashes.length);
        
        if (!documents[documentHash].exists) {
            return results; // All false
        }
        
        for (uint i = 0; i < signatureHashes.length; i++) {
            if (documents[documentHash].signatureExists[signatureHashes[i]]) {
                // Find and check validity
                SignatureRecord[] storage signatures = documents[documentHash].signatures;
                for (uint j = 0; j < signatures.length; j++) {
                    if (signatures[j].signatureHash == signatureHashes[i]) {
                        results[i] = signatures[j].isValid;
                        break;
                    }
                }
            }
        }
        
        return results;
    }
}
