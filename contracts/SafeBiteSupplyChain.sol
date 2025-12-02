// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19                ;

import "./SafeBiteAccessRoles.sol";

// Main supply chain contract for tracking products through the food supply chain
// Handles product registration, ownership transfers, status updates, and verification
contract SafeBiteSupplyChain {

// Product status enum tracks where the product is in the supply chain
// Status flows: CREATED -> SHIPPED -> RECEIVED -> STORED -> DELIVERED
enum ProductStatus {
CREATED, // Product just registered by producer
SHIPPED, // Product in transit to distributor/retailer
RECEIVED, // Product received by distributor/retailer
STORED, // Product in storage
DELIVERED // Product delivered to consumer
}

// Types of verification that can be performed on products
enum VerificationType {
QUALITY_CHECK, // Quality assessment by retailer
REGULATORY_APPROVAL, // Compliance check by regulator
AUTHENTICITY, // Authenticity verification by consumer
COMPLIANCE // General compliance verification
}

// Product struct stores all information about a registered product
struct Product {
uint256 id                                                          ;              // Unique product identifier
string name                                                         ;             // Product name
string batchId                                                      ;          // Batch identifier for tracking
address producer                                                    ;        // Address of producer/manufacturer
uint256 createdAt                                                   ;       // Timestamp when product was registered
string origin                                                       ;           // Origin location/country
string metadataHash                                                 ;     // IPFS hash or off-chain storage reference for certificates
}

// Transfer struct records each ownership transfer
struct Transfer {
address from                                       ;            // Previous owner/custodian
address to                                         ;              // New owner/custodian
uint256 timestamp                                  ;       // When the transfer happened
string shipmentDetails                             ;  // Shipping info like tracking number, carrier
}

// Verification struct - kept for backward compatibility with view functions
// Note: Verification history is now retrieved from events, not stored in arrays
struct Verification {
address verifier                                  ;        // Who performed the verification
uint256 timestamp                                 ;       // When verification happened
VerificationType vType                            ;  // Type of verification
bool result                                       ;             // Pass or fail
string notes                                      ;            // Additional notes about verification
}

// Reference to access control contract to check roles
SafeBiteAccessRoles public accessControl               ;

// Storage mappings
mapping(uint256 => Product) private _products                   ;                    // Product ID -> Product info
mapping(uint256 => address) private _currentOwners              ;               // Product ID -> Current owner
mapping(uint256 => ProductStatus) private _productStatuses      ;       // Product ID -> Current status
mapping(uint256 => bool) private _authenticityFlags             ;              // Product ID -> Is authentic flag
mapping(uint256 => bool) private _hasQualityCheckPassed         ;  // Product ID -> Quality check passed flag
mapping(uint256 => bool) private _hasComplianceCheckPassed     ;  // Product ID -> Compliance check passed flag

// Counter for generating unique product IDs
uint256 private _productCounter              ;

// Events track all state changes - backend queries these events to retrieve history
event ProductRegistered(
uint256 indexed productId,
address indexed producer,
string name,
string batchId
)                                              ;

event OwnershipTransferred(
uint256 indexed productId,
address indexed from,
address indexed to,
string shipmentDetails
)                           ;

event StatusUpdated(
uint256 indexed productId,
ProductStatus oldStatus,
ProductStatus newStatus,
address indexed updatedBy
)                          ;

event ProductMetadataUpdated(
uint256 indexed productId,
string metadataHash
)                             ;

event ProductVerified(
uint256 indexed productId,
address indexed verifier,
VerificationType vType,
bool result
)                          ;

event AuthenticityConfirmed(
uint256 indexed productId,
address indexed verifier
)                            ;

event ComplianceChecked(
uint256 indexed productId,
address indexed regulator,
bool compliant
)                          ;

// Modifier: Only addresses with PRODUCER role can call
modifier onlyProducer() {
require(
accessControl.hasRole(msg.sender, SafeBiteAccessRoles.Role.PRODUCER),
"SafeBiteSupplyChain: caller is not a producer"
)                                                                     ;
_                                                                     ;
}

// Modifier: Only addresses with REGULATOR role can call
modifier onlyRegulator() {
require(
accessControl.hasRole(msg.sender, SafeBiteAccessRoles.Role.REGULATOR),
"SafeBiteSupplyChain: caller is not a regulator"
)                                                                      ;
_                                                                      ;
}

// Modifier: Check if product exists (product ID is not zero)
modifier productExists(uint256 productId) {
require(_products[productId].id != 0, "SafeBiteSupplyChain: product does not exist");
_                                                                                     ;
}

// Modifier: Only current owner of the product can call
modifier onlyOwner(uint256 productId) {
require(
_currentOwners[productId] == msg.sender,
"SafeBiteSupplyChain: caller is not the product owner"
)                                                       ;
_                                                       ;
}

// Constructor: Initialize with access control contract address
// Sets up the connection to role management contract
constructor(address _accessControl) {
require(_accessControl != address(0), "SafeBiteSupplyChain: invalid access control address");
accessControl = SafeBiteAccessRoles(_accessControl)                                           ;
_productCounter = 0                                                                           ;
}

// Register a new product on the blockchain
// Only PRODUCER role can register products
// Returns the unique product ID assigned to the product
function registerProduct(
string memory name,
string memory batchId,
string memory origin,
string memory metadataHash
) external onlyProducer returns (uint256 productId) {
require(bytes(name).length > 0, "SafeBiteSupplyChain: product name cannot be empty");
require(bytes(batchId).length > 0, "SafeBiteSupplyChain: batch ID cannot be empty");
require(bytes(origin).length > 0, "SafeBiteSupplyChain: origin cannot be empty");
// metadataHash can be empty initially and added later when certificates are generated

// Increment product counter
_productCounter++            ;
productId = _productCounter  ;

// Create Product struct
_products[productId] = Product({
id: productId,
name: name,
batchId: batchId,
producer: msg.sender,
createdAt: block.timestamp,
origin: origin,
metadataHash: metadataHash
})                               ;

// Set status to CREATED
_productStatuses[productId] = ProductStatus.CREATED ;

// Set current owner to producer
_currentOwners[productId] = msg.sender ;

// Set authenticity flag to false initially (needs verification)
_authenticityFlags[productId] = false                            ;

// Emit ProductRegistered event
emit ProductRegistered(productId, msg.sender, name, batchId) ;

return productId ;
}

// Update product metadata (like certificates or quality reports)
// Only current owner can update metadata
function updateProductMetadata(
uint256 productId,
string memory newMetadataHash
) external productExists(productId) onlyOwner(productId) {
require(bytes(newMetadataHash).length > 0, "SafeBiteSupplyChain: metadata hash cannot be empty");
_products[productId].metadataHash = newMetadataHash;
emit ProductMetadataUpdated(productId, newMetadataHash);
}

// Get all information about a product by its ID
// Returns all fields from the Product struct
function getProduct(uint256 productId) external view productExists(productId) returns (
string memory name,
string memory batchId,
address producer,
uint256 createdAt,
string memory origin,
string memory metadataHash
) {

// - Return all fields from Product struct
Product memory product = _products[productId] ;
return (
product.name,
product.batchId,
product.producer,
product.createdAt,
product.origin,
product.metadataHash
)                                             ;
}

// Get total number of products registered in the system
function getProductCount() external view returns (uint256 count) {

return _productCounter ;
}

// Check if a product exists by checking if product ID is registered
function isProductExists(uint256 productId) external view returns (bool exists) {
return _products[productId].id != 0                                               ;
}

// Transfer product ownership to another stakeholder
// Only current owner can transfer
// Updates product status based on recipient role (DISTRIBUTOR->SHIPPED, RETAILER->RECEIVED, CONSUMER->DELIVERED)
function transferOwnership(
uint256 productId,
address to,
string memory shipmentDetails
) external productExists(productId) onlyOwner(productId) {
require(to != address(0), "SafeBiteSupplyChain: cannot transfer to zero address");
require(to != msg.sender, "SafeBiteSupplyChain: cannot transfer to yourself");
address from = _currentOwners[productId];
SafeBiteAccessRoles.Role recipientRole = accessControl.getRole(to);
require(
recipientRole == SafeBiteAccessRoles.Role.DISTRIBUTOR ||
recipientRole == SafeBiteAccessRoles.Role.RETAILER ||
recipientRole == SafeBiteAccessRoles.Role.CONSUMER,
"SafeBiteSupplyChain: recipient must be DISTRIBUTOR, RETAILER, or CONSUMER"
);
ProductStatus oldStatus = _productStatuses[productId];
ProductStatus newStatus;
if (recipientRole == SafeBiteAccessRoles.Role.DISTRIBUTOR) {
newStatus = ProductStatus.SHIPPED;
} else if (recipientRole == SafeBiteAccessRoles.Role.RETAILER) {
newStatus = ProductStatus.RECEIVED;
} else {
newStatus = ProductStatus.DELIVERED;
}
// Update ownership and status - history recorded via events
_currentOwners[productId] = to;
_productStatuses[productId] = newStatus;
emit OwnershipTransferred(productId, from, to, shipmentDetails);
emit StatusUpdated(productId, oldStatus, newStatus, msg.sender);
}

// Transfer multiple products to the same recipient in one transaction
// Useful for batch operations
function batchTransferOwnership(
uint256[] memory productIds,
address to,
string memory shipmentDetails
) external {
require(to != address(0), "SafeBiteSupplyChain: cannot transfer to zero address");
SafeBiteAccessRoles.Role recipientRole = accessControl.getRole(to);
require(
recipientRole == SafeBiteAccessRoles.Role.DISTRIBUTOR ||
recipientRole == SafeBiteAccessRoles.Role.RETAILER ||
recipientRole == SafeBiteAccessRoles.Role.CONSUMER,
"SafeBiteSupplyChain: recipient must be DISTRIBUTOR, RETAILER, or CONSUMER"
);
for (uint256 i = 0; i < productIds.length; i++) {
uint256 productId = productIds[i];
require(_products[productId].id != 0, "SafeBiteSupplyChain: product does not exist");
require(_currentOwners[productId] == msg.sender, "SafeBiteSupplyChain: caller is not the product owner");
address from = _currentOwners[productId];
ProductStatus oldStatus = _productStatuses[productId];
ProductStatus newStatus;
if (recipientRole == SafeBiteAccessRoles.Role.DISTRIBUTOR) {
newStatus = ProductStatus.SHIPPED;
} else if (recipientRole == SafeBiteAccessRoles.Role.RETAILER) {
newStatus = ProductStatus.RECEIVED;
} else {
newStatus = ProductStatus.DELIVERED;
}
// Update ownership and status - history recorded via events
_currentOwners[productId] = to;
_productStatuses[productId] = newStatus;
emit OwnershipTransferred(productId, from, to, shipmentDetails);
emit StatusUpdated(productId, oldStatus, newStatus, msg.sender);
}
}

// Update product status (e.g., from RECEIVED to STORED)
// Only current owner can update status
// Should validate that status transition is valid (can't go backwards)
function updateStatus(
uint256 productId,
ProductStatus newStatus
) external productExists(productId) onlyOwner(productId) {
ProductStatus oldStatus = _productStatuses[productId];
require(newStatus != oldStatus, "SafeBiteSupplyChain: status is already set to this value");
if (oldStatus == ProductStatus.DELIVERED) {
require(false, "SafeBiteSupplyChain: cannot change status after DELIVERED");
}
if (oldStatus == ProductStatus.CREATED && newStatus != ProductStatus.SHIPPED) {
require(false, "SafeBiteSupplyChain: CREATED can only transition to SHIPPED");
}
if (oldStatus == ProductStatus.SHIPPED && newStatus != ProductStatus.RECEIVED) {
require(false, "SafeBiteSupplyChain: SHIPPED can only transition to RECEIVED");
}
if (oldStatus == ProductStatus.RECEIVED && newStatus != ProductStatus.STORED && newStatus != ProductStatus.DELIVERED) {
require(false, "SafeBiteSupplyChain: RECEIVED can only transition to STORED or DELIVERED");
}
if (oldStatus == ProductStatus.STORED && newStatus != ProductStatus.DELIVERED) {
require(false, "SafeBiteSupplyChain: STORED can only transition to DELIVERED");
}
_productStatuses[productId] = newStatus;
emit StatusUpdated(productId, oldStatus, newStatus, msg.sender);
}

// Verify product authenticity (anyone can verify)
// Checks if product hasn't been tampered with
// Requires both quality check and compliance check to have been performed and passed
// Returns true if product is authentic
function verifyAuthenticity(
uint256 productId,
string memory /* notes */
) external productExists(productId) returns (bool isValid) {
Product memory product = _products[productId];
// Check if quality and compliance checks have passed
bool hasQualityCheck = _hasQualityCheckPassed[productId];
bool hasComplianceCheck = _hasComplianceCheckPassed[productId];
// Product is authentic only if:
// 1. Both quality check and compliance check have been performed and passed
// 2. Metadata hash exists (contains certificate information)
// 3. Producer address is valid
bool isAuthentic = hasQualityCheck && hasComplianceCheck &&
bytes(product.metadataHash).length > 0 &&
product.producer != address(0);
// Set authenticity flag and emit event
if (isAuthentic) {
_authenticityFlags[productId] = true;
emit AuthenticityConfirmed(productId, msg.sender);
}
emit ProductVerified(productId, msg.sender, VerificationType.AUTHENTICITY, isAuthentic);
return isAuthentic;
}

// Perform quality check on product
// Only RETAILER or REGULATOR can perform quality checks
// Quality score should be 0-100
// If certificateHash is provided and quality check passes, stores it in metadataHash
// Backend should merge with existing metadataHash before calling
function performQualityCheck(
uint256 productId,
uint8 qualityScore,
string memory /* notes */,
string memory certificateHash
) external productExists(productId) {
require(
accessControl.hasRole(msg.sender, SafeBiteAccessRoles.Role.RETAILER) ||
accessControl.hasRole(msg.sender, SafeBiteAccessRoles.Role.REGULATOR),
"SafeBiteSupplyChain: caller must be RETAILER or REGULATOR"
);
require(qualityScore <= 100, "SafeBiteSupplyChain: quality score must be 0-100");
bool passed = qualityScore >= 50;
Product memory product = _products[productId];
// Set flag to indicate quality check passed
if (passed) {
_hasQualityCheckPassed[productId] = true;
}
// Store certificate hash in metadataHash if quality check passes and hash is provided
// Backend should merge with existing metadataHash (e.g., from compliance) before calling
if (passed && bytes(certificateHash).length > 0) {
_products[productId].metadataHash = certificateHash;
emit ProductMetadataUpdated(productId, certificateHash);
}
// Emit event to record this quality check - events are stored in logs, not expensive contract storage
emit ProductVerified(productId, msg.sender, VerificationType.QUALITY_CHECK, passed);
// Auto-verify authenticity if regulator has completed both quality and compliance checks
// This works regardless of which check is done first
if (passed && accessControl.hasRole(msg.sender, SafeBiteAccessRoles.Role.REGULATOR)) {
// Check if both verification checks have passed
bool hasQualityCheck = _hasQualityCheckPassed[productId];
bool hasComplianceCheck = _hasComplianceCheckPassed[productId];
// Get current metadataHash (may have been updated above)
string memory currentMetadataHash = _products[productId].metadataHash;
// Auto-verify if all conditions are met
bool isAuthentic = hasQualityCheck && hasComplianceCheck &&
bytes(currentMetadataHash).length > 0 &&
product.producer != address(0);
if (isAuthentic && !_authenticityFlags[productId]) {
_authenticityFlags[productId] = true;
emit AuthenticityConfirmed(productId, msg.sender);
// Record verification in event logs
emit ProductVerified(productId, msg.sender, VerificationType.AUTHENTICITY, true);
}
}
}

// Check regulatory compliance
// Only REGULATOR role can perform compliance checks
// Stores certificate hash if product is compliant
// If metadataHash already exists, it should contain merged certificate data (handled by backend)
// Automatically verifies authenticity if both quality and compliance checks have passed
function checkCompliance(
uint256 productId,
bool compliant,
string memory certificateHash
) external productExists(productId) onlyRegulator {
Product memory product = _products[productId];
// Set flag to indicate compliance check passed
if (compliant) {
_hasComplianceCheckPassed[productId] = true;
}
// Store certificate hash in metadataHash if compliant
// Backend should merge with existing metadataHash (e.g., quality certificate) before calling
if (compliant && bytes(certificateHash).length > 0) {
_products[productId].metadataHash = certificateHash;
emit ProductMetadataUpdated(productId, certificateHash);
}
emit ComplianceChecked(productId, msg.sender, compliant);
emit ProductVerified(productId, msg.sender, VerificationType.REGULATORY_APPROVAL, compliant);
// Auto-verify authenticity if both quality and compliance checks have passed
// This happens automatically when compliance check completes successfully
if (compliant) {
// Check verification status using boolean flags
bool hasQualityCheck = _hasQualityCheckPassed[productId];
bool hasComplianceCheck = _hasComplianceCheckPassed[productId];
// Get current metadataHash (may have been updated above)
string memory currentMetadataHash = _products[productId].metadataHash;
// Auto-verify if all conditions are met
bool isAuthentic = hasQualityCheck && hasComplianceCheck &&
bytes(currentMetadataHash).length > 0 &&
product.producer != address(0);
if (isAuthentic && !_authenticityFlags[productId]) {
_authenticityFlags[productId] = true;
emit AuthenticityConfirmed(productId, msg.sender);
// Record verification in event logs
emit ProductVerified(productId, msg.sender, VerificationType.AUTHENTICITY, true);
}
}
}

// Get current owner/custodian of a product
function getCurrentOwner(uint256 productId) external view productExists(productId) returns (address owner) {
return _currentOwners[productId]                                                                             ;
}

// Get complete transfer history for a product
// Returns empty array - backend queries OwnershipTransferred events for transfer history
function getTransferHistory(uint256 productId) external view productExists(productId) returns (Transfer[] memory transfers) {
Transfer[] memory emptyTransfers = new Transfer[](0);
return emptyTransfers;
}

// Get current status of a product
function getProductStatus(uint256 productId) external view productExists(productId) returns (ProductStatus status) {
return _productStatuses[productId]                                                                                   ;
}

// Get all verification records for a product
// Returns empty array - backend queries ProductVerified, AuthenticityConfirmed, and ComplianceChecked events for verification history
function getVerificationHistory(uint256 productId) external view productExists(productId) returns (Verification[] memory verifications) {
Verification[] memory emptyVerifications = new Verification[](0);
return emptyVerifications;
}

// Check if product has been verified as authentic
function isProductAuthentic(uint256 productId) external view productExists(productId) returns (bool isAuthentic) {
return _authenticityFlags[productId];
}

// Get product journey as readable strings
// Returns only registration event - backend queries ProductRegistered, OwnershipTransferred, and StatusUpdated events for full journey
function getProductJourney(uint256 productId) external view productExists(productId) returns (string[] memory journey) {
Product memory product = _products[productId];
// Return only the initial registration - backend will query events for full history
string[] memory events = new string[](1);
events[0] = string(abi.encodePacked(
"Product registered: ",
product.name,
" (Batch: ",
product.batchId,
") by producer at ",
uint2str(product.createdAt)
));
return events;
}

// Get complete provenance record
// Returns current product state only - backend queries events for complete provenance
function getCompleteProvenance(uint256 productId) external view productExists(productId) returns (string memory provenance) {
Product memory product = _products[productId];
// Return current state only - backend queries events for complete history
string memory result = string(abi.encodePacked(
'{"productId":',
uint2str(productId),
',"name":"',
product.name,
'","batchId":"',
product.batchId,
'","producer":"',
addressToString(product.producer),
'","createdAt":',
uint2str(product.createdAt),
',"origin":"',
product.origin,
'","metadataHash":"',
product.metadataHash,
'","currentOwner":"',
addressToString(_currentOwners[productId]),
'","status":',
uint2str(uint256(_productStatuses[productId])),
',"authentic":',
_authenticityFlags[productId] ? 'true' : 'false',
',"transfers":[],"verifications":[]}'
));
return result;
}
// Helper function to convert uint256 to string
function uint2str(uint256 _i) internal pure returns (string memory) {
if (_i == 0) {
return "0";
}
uint256 j = _i;
uint256 len;
while (j != 0) {
len++;
j /= 10;
}
bytes memory bstr = new bytes(len);
uint256 k = len;
while (_i != 0) {
k = k - 1;
uint8 temp = (48 + uint8(_i - _i / 10 * 10));
bytes1 b1 = bytes1(temp);
bstr[k] = b1;
_i /= 10;
}
return string(bstr);
}
// Helper function to convert address to string
function addressToString(address _addr) internal pure returns (string memory) {
bytes32 value = bytes32(uint256(uint160(_addr)));
bytes memory alphabet = "0123456789abcdef";
bytes memory str = new bytes(42);
str[0] = '0';
str[1] = 'x';
for (uint256 i = 0; i < 20; i++) {
str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
}
return string(str);
}
}
