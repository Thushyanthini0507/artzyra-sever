import Booking from "../models/Booking.js";

// Get all booking
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();

    res.status(200).json({
      length: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Get a booking by Id
export const getBookingById = async (req, res) => {
  try {
    const saleId = req.params.id;
    const booking = await Booking.findById({ _id: saleId });

    if (!booking) return res.status(404).json({ Message: "Booking not found" });

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Create a booking
export const createBooking = async (req, res) => {
  try {
    const newBooking = new Booking(req.body);

    const savedBooking = await newBooking.save();
    res.status(200).json({
      Message: "Booking created successfully",
      Booking: savedBooking,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Update a booking by Id
export const updateBooking = async (req, res) => {
  try {
    const saleId = req.params.id;
    const saleExist = await Booking.findById({ _id: saleId });
    if (!saleExist) return res.status(404).json({ Error: "booking not found" });

    const updatedBooking = await Booking.findByIdAndUpdate(saleId, req.body, {
      new: true,
    });
    res.status(200).json({
      Message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Delete a booking by Id
export const deleteBooking = async (req, res) => {
  try {
    const saleId = req.params.id;
    const booking = await Booking.findByIdAndDelete(saleId);
    if (!booking) return res.status(404).json({ Message: "Booking not found" });
    res.status(200).json({
      Message: "Booking removed successfully",
      deletedBooking: booking,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};
