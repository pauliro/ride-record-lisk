// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

error VehicleAlreadyRegistered(bytes32 serialHash);
error OnlyOwnerCanTransfer(bytes32 serialHash, address currentOwner, address caller);
error CannotTransferToZeroAddress(bytes32 serialHash);

contract RideRecords {
    // Mapping from the hashed vehicle serial number to its current owner
    mapping(bytes32 => address) public vehicleOwners;

    // Event for when a new vehicle is registered
    event VehicleRegistered(
        bytes32 indexed serialHash,
        address indexed owner,
        uint256 odometer
    );

    // Event for when a vehicle is transferred
    event VehicleTransferred(
        bytes32 indexed serialHash,
        address indexed from,
        address indexed to,
        uint256 odometer
    );

    /**
     * @notice Registers a new vehicle, anchoring it on-chain.
     * @param serialHash The keccak256 hash of the vehicle's VIN/serial number.
     * @param odometer The current odometer reading of the vehicle.
     */
    function registerVehicle(bytes32 serialHash, uint256 odometer) public {
        if (vehicleOwners[serialHash] != address(0)) {
            revert VehicleAlreadyRegistered(serialHash);
        }
        vehicleOwners[serialHash] = msg.sender;
        emit VehicleRegistered(serialHash, msg.sender, odometer);
    }

    /**
     * @notice Transfers ownership of a vehicle to a new address.
     * @param serialHash The keccak256 hash of the vehicle's VIN/serial number.
     * @param to The address of the new owner.
     * @param odometer The current odometer reading of the vehicle.
     */
    function transferVehicle(bytes32 serialHash, address to, uint256 odometer) public {
        address currentOwner = vehicleOwners[serialHash];
        if (currentOwner == address(0)) {
            revert VehicleAlreadyRegistered(serialHash);
        }
        if (currentOwner != msg.sender) {
            revert OnlyOwnerCanTransfer(serialHash, currentOwner, msg.sender);
        }
        if (to == address(0)) {
            revert CannotTransferToZeroAddress(serialHash);
        }
        
        address from = msg.sender;
        vehicleOwners[serialHash] = to;
        emit VehicleTransferred(serialHash, from, to, odometer);
    }

    /**
     * @notice Gets the current owner of a vehicle.
     * @param serialHash The keccak256 hash of the vehicle's VIN/serial number.
     * @return The address of the current owner.
     */
    function getVehicleOwner(bytes32 serialHash) public view returns (address) {
        return vehicleOwners[serialHash];
    }
}
