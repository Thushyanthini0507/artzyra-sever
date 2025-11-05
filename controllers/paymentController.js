import Payment from "../models/Payment.js";


// Get all payment
export const getAllPayment = async (req, res) => {
  try {
    const payments = await Payment.find();

    res.status(200).json({
      length: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Get a payment by Id
export const getPaymentById = async (req, res) => {
  try {
    const artistId = req.params.id;
    const payment = await Payment.findById({ _id: itemId });

    if (!payment) return res.status(404).json({ Message: "Payment not found" });

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Create a payment
export const createPayment = async (req, res) => {
  try {
    const newPayment = new Payment(req.body);

    const savedPayment = await newPayment.save();
    res.status(200).json({
      Message: "Payment created successfully",
      Payment: savedPayment,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Update a payment by Id
export const updatePayment = async (req, res) => {
  try {
    const itemId = req.params.id;
    const itemExist = await Payment.findById({ _id: itemId });
    if (!itemExist) return res.status(404).json({ Error: "payment not found" });

    const updatedPayment = await Payment.findByIdAndUpdate(itemId, req.body, {
      new: true,
    });
    res.status(200).json({
      Message: "Payment updated successfully",
      Payment: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Delete a payment by Id
export const deletePayment = async (req, res) => {
  try {
    const itemId = req.params.id;
    const payment = await Payment.findByIdAndDelete(itemId);
    if (!payment) return res.status(404).json({ Message: "Payment not found" });
    res.status(200).json({
      Message: "Payment removed successfully",
      deletedPayment: payment,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};
