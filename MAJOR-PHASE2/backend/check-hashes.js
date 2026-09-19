// Check which vehicles have blockchain transaction hashes
print("\n=== VEHICLES WITH BLOCKCHAIN HASH ===\n");
db.vehicles.find({
    blockchainTxHash: { $exists: true, $ne: null, $ne: "", $ne: "0x0" }
}).forEach(v => {
    print("✅ " + v.regNumber + " -> " + v.blockchainTxHash);
});

print("\n=== VEHICLES WITHOUT BLOCKCHAIN HASH ===\n");
db.vehicles.find({
    $or: [
        { blockchainTxHash: null },
        { blockchainTxHash: { $exists: false } },
        { blockchainTxHash: "" },
        { blockchainTxHash: "0x0" }
    ]
}).forEach(v => {
    print("❌ " + v.regNumber + " -> " + (v.blockchainTxHash || "NOT SET"));
});
