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

// Verification struct stores verification events
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
mapping(uint256 => Transfer[]) private _transferHistory         ;          // Product ID -> Transfer history array
mapping(uint256 => Verification[]) private _verificationHistory ;  // Product ID -> Verification history array
mapping(uint256 => bool) private _authenticityFlags             ;              // Product ID -> Is authentic flag

// Counter for generating unique product IDs
uint256 private _productCounter              ;

// Events for tracking important state changes
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
// Note: metadataHash can be empty initially and added later via updateProductMetadata

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
Transfer memory transfer = Transfer({
from: from,
to: to,
timestamp: block.timestamp,
shipmentDetails: shipmentDetails
});
_transferHistory[productId].push(transfer);
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
Transfer memory transfer = Transfer({
from: from,
to: to,
timestamp: block.timestamp,
shipmentDetails: shipmentDetails
});
_transferHistory[productId].push(transfer);
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
string memory notes
) external productExists(productId) returns (bool isValid) {
Product memory product = _products[productId];
Verification[] memory verifications = _verificationHistory[productId];
bool hasQualityCheck = false;
bool hasComplianceCheck = false;
bool qualityPassed = false;
bool compliancePassed = false;
// Check verification history for quality and compliance checks
for (uint256 i = 0; i < verifications.length; i++) {
if (verifications[i].vType == VerificationType.QUALITY_CHECK) {
hasQualityCheck = true;
if (verifications[i].result) {
qualityPassed = true;
}
}
if (verifications[i].vType == VerificationType.REGULATORY_APPROVAL) {
hasComplianceCheck = true;
if (verifications[i].result) {
compliancePassed = true;
}
}
}
// Product is authentic only if:
// 1. Both quality check and compliance check have been performed
// 2. Both checks passed (quality score >= 50, compliance = true)
// 3. Metadata hash exists (contains certificate information)
// 4. Producer address is valid
bool isAuthentic = hasQualityCheck && hasComplianceCheck &&
qualityPassed && compliancePassed &&
bytes(product.metadataHash).length > 0 &&
product.producer != address(0);
Verification memory verification = Verification({
verifier: msg.sender,
timestamp: block.timestamp,
vType: VerificationType.AUTHENTICITY,
result: isAuthentic,
notes: notes
});
_verificationHistory[productId].push(verification);
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
string memory notes,
string memory certificateHash
) external productExists(productId) {
require(
accessControl.hasRole(msg.sender, SafeBiteAccessRoles.Role.RETAILER) ||
accessControl.hasRole(msg.sender, SafeBiteAccessRoles.Role.REGULATOR),
"SafeBiteSupplyChain: caller must be RETAILER or REGULATOR"
);
require(qualityScore <= 100, "SafeBiteSupplyChain: quality score must be 0-100");
bool passed = qualityScore >= 50;
Verification memory verification = Verification({
verifier: msg.sender,
timestamp: block.timestamp,
vType: VerificationType.QUALITY_CHECK,
result: passed,
notes: notes
});
_verificationHistory[productId].push(verification);
// Store certificate hash in metadataHash if quality check passes and hash is provided
// Backend should merge with existing metadataHash (e.g., from compliance) before calling
if (passed && bytes(certificateHash).length > 0) {
_products[productId].metadataHash = certificateHash;
emit ProductMetadataUpdated(productId, certificateHash);
}
emit ProductVerified(productId, msg.sender, VerificationType.QUALITY_CHECK, passed);
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
Verification memory verification = Verification({
verifier: msg.sender,
timestamp: block.timestamp,
vType: VerificationType.REGULATORY_APPROVAL,
result: compliant,
notes: certificateHash
});
_verificationHistory[productId].push(verification);
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
// Get updated verification history (includes the compliance check we just added)
Verification[] memory verifications = _verificationHistory[productId];
bool hasQualityCheck = false;
bool hasComplianceCheck = false;
bool qualityPassed = false;
bool compliancePassed = false;
// Check verification history for quality and compliance checks
for (uint256 i = 0; i < verifications.length; i++) {
if (verifications[i].vType == VerificationType.QUALITY_CHECK) {
hasQualityCheck = true;
if (verifications[i].result) {
qualityPassed = true;
}
}
if (verifications[i].vType == VerificationType.REGULATORY_APPROVAL) {
hasComplianceCheck = true;
if (verifications[i].result) {
compliancePassed = true;
}
}
}
// Get current metadataHash (may have been updated above)
string memory currentMetadataHash = _products[productId].metadataHash;
// Auto-verify if all conditions are met
bool isAuthentic = hasQualityCheck && hasComplianceCheck &&
qualityPassed && compliancePassed &&
bytes(currentMetadataHash).length > 0 &&
product.producer != address(0);
if (isAuthentic && !_authenticityFlags[productId]) {
_authenticityFlags[productId] = true;
emit AuthenticityConfirmed(productId, msg.sender);
// Also record an authenticity verification event
Verification memory autoVerification = Verification({
verifier: msg.sender,
timestamp: block.timestamp,
vType: VerificationType.AUTHENTICITY,
result: true,
notes: "Auto-verified: Quality and compliance checks completed"
});
_verificationHistory[productId].push(autoVerification);
emit ProductVerified(productId, msg.sender, VerificationType.AUTHENTICITY, true);
}
}
}

// Get current owner/custodian of a product
function getCurrentOwner(uint256 productId) external view productExists(productId) returns (address owner) {
return _currentOwners[productId]                                                                             ;
}

// Get complete transfer history for a product
// Returns array of all Transfer records showing ownership changes
function getTransferHistory(uint256 productId) external view productExists(productId) returns (Transfer[] memory transfers) {
return _transferHistory[productId];
}

// Get current status of a product
function getProductStatus(uint256 productId) external view productExists(productId) returns (ProductStatus status) {
return _productStatuses[productId]                                                                                   ;
}

// Get all verification records for a product
// Shows quality checks, compliance checks, authenticity verifications
function getVerificationHistory(uint256 productId) external view productExists(productId) returns (Verification[] memory verifications) {
return _verificationHistory[productId];
}

// Check if product has been verified as authentic
function isProductAuthentic(uint256 productId) external view productExists(productId) returns (bool isAuthentic) {
return _authenticityFlags[productId];
}

// Get product journey as readable strings
// Combines registration, transfers, and status updates into a timeline
// Returns array of strings describing each event in chronological order
function getProductJourney(uint256 productId) external view productExists(productId) returns (string[] memory journey) {
Product memory product = _products[productId];
uint256 transferCount = _transferHistory[productId].length;
uint256 totalEvents = 1 + transferCount;
string[] memory events = new string[](totalEvents);
events[0] = string(abi.encodePacked(
"Product registered: ",
product.name,
" (Batch: ",
product.batchId,
") by producer at ",
uint2str(product.createdAt)
));
for (uint256 i = 0; i < transferCount; i++) {
Transfer memory transfer = _transferHistory[productId][i];
events[i + 1] = string(abi.encodePacked(
"Transferred from ",
addressToString(transfer.from),
" to ",
addressToString(transfer.to),
" at ",
uint2str(transfer.timestamp)
));
}
return events;
}

// Get complete provenance record
// Combines all product data, transfers, status updates, and verifications
// Returns as structured data (JSON-like string)
// Note: Consider gas costs for large strings
function getCompleteProvenance(uint256 productId) external view productExists(productId) returns (string memory provenance) {
Product memory product = _products[productId];
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
',"transfers":['));
uint256 transferCount = _transferHistory[productId].length;
for (uint256 i = 0; i < transferCount; i++) {
Transfer memory transfer = _transferHistory[productId][i];
if (i > 0) {
result = string(abi.encodePacked(result, ','));
}
result = string(abi.encodePacked(
result,
'{"from":"',
addressToString(transfer.from),
'","to":"',
addressToString(transfer.to),
'","timestamp":',
uint2str(transfer.timestamp),
',"details":"',
transfer.shipmentDetails,
'"}'
));
}
result = string(abi.encodePacked(result, '],"verifications":['));
uint256 verificationCount = _verificationHistory[productId].length;
for (uint256 i = 0; i < verificationCount; i++) {
Verification memory verification = _verificationHistory[productId][i];
if (i > 0) {
result = string(abi.encodePacked(result, ','));
}
string memory vTypeStr = verification.vType == VerificationType.QUALITY_CHECK ? 'QUALITY_CHECK' :
verification.vType == VerificationType.REGULATORY_APPROVAL ? 'REGULATORY_APPROVAL' :
verification.vType == VerificationType.AUTHENTICITY ? 'AUTHENTICITY' : 'COMPLIANCE';
result = string(abi.encodePacked(
result,
'{"verifier":"',
addressToString(verification.verifier),
'","timestamp":',
uint2str(verification.timestamp),
',"type":"',
vTypeStr,
'","result":',
verification.result ? 'true' : 'false',
',"notes":"',
verification.notes,
'"}'
));
}
result = string(abi.encodePacked(result, ']}'));
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
