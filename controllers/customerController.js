import Customer from "../models/Customer.js";

// Get all customer
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();

    res.status(200).json({
      length: customers.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Get a customer by Id
export const getCustomerById = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById({ _id: customerId });

    if (!customer)
      return res.status(404).json({ Message: "Customer not found" });

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Create a customer
export const createCustomer = async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);

    const savedCustomer = await newCustomer.save();
    res.status(200).json({
      Message: "Customer created successfully",
      Customer: savedCustomer,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Update a customer by Id
export const updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customerExist = await Customer.findById({ _id: customerId });
    if (!customerExist)
      return res.status(404).json({ Error: "Customer not found" });

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      req.body,
      {
        new: true,
      }
    );
    res.status(200).json({
      Message: "Customer updated successfully",
      Customer: updatedCustomer,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Delete a customer by Id
export const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findByIdAndDelete(customerId);
    if (!customer)
      return res.status(404).json({ Message: "Customer not found" });
    res.status(200).json({
      Message: "Customer removed successfully",
      deletedcustomer: customer,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};
