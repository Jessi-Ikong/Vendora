const {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../queries/address.queries");

// ─── Get all addresses ────────────────────────────────────────
const getAddresses = async (req, res) => {
  try {
    const addresses = await getUserAddresses(req.user.id);
    res.status(200).json({ addresses });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Add new address ──────────────────────────────────────────
const addAddress = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      country,
    } = req.body;

    // Validate required fields
    if (!full_name || !phone || !address_line1 || !city || !state) {
      return res.status(400).json({
        message: "full_name, phone, address_line1, city and state are required",
      });
    }

    const address = await createAddress(req.user.id, {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      country,
    });

    res.status(201).json({
      message: "Address added successfully",
      address,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Update address ───────────────────────────────────────────
const editAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Check address exists and belongs to user
    const existing = await getAddressById(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Address not found" });
    }

    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      country,
    } = req.body;

    const updated = await updateAddress(id, req.user.id, {
      full_name: full_name || existing.full_name,
      phone: phone || existing.phone,
      address_line1: address_line1 || existing.address_line1,
      address_line2:
        address_line2 !== undefined ? address_line2 : existing.address_line2,
      city: city || existing.city,
      state: state || existing.state,
      country: country || existing.country,
    });

    res.status(200).json({
      message: "Address updated successfully",
      address: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Delete address ───────────────────────────────────────────
const removeAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getAddressById(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Address not found" });
    }

    await deleteAddress(id, req.user.id);

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Set default address ──────────────────────────────────────
const makeDefault = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getAddressById(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Address not found" });
    }

    const address = await setDefaultAddress(id, req.user.id);

    res.status(200).json({
      message: "Default address updated",
      address,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  editAddress,
  removeAddress,
  makeDefault,
};
