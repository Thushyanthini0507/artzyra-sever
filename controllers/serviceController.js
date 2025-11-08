import Service from "../models/service.js";

// Get all service
export const getAllService = async (req, res) => {
  try {
    const services = await Service.find();

    res.status(200).json({
      length: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Get a service by Id
export const getServiceById = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById({ _id: serviceId });

    if (!service) return res.status(404).json({ Message: "Service not found" });

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Create a service
export const createService = async (req, res) => {
  try {
    const newService = new Service(req.body);

    const savedService = await newService.save();
    res.status(200).json({
      Message: "Service created successfully",
      Service: savedService,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Update a service by Id
export const updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const itemExist = await Service.findById({ _id: serviceId });
    if (!itemExist) return res.status(404).json({ Error: "service not found" });

    const updatedService = await Service.findByIdAndUpdate(serviceId, req.body, {
      new: true,
    });
    res.status(200).json({
      Message: "Service updated successfully",
      Service: updatedService,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Delete a service by Id
export const deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findByIdAndDelete(serviceId);
    if (!service) return res.status(404).json({ Message: "Service not found" });
    res.status(200).json({
      Message: "Service removed successfully",
      deletedService: service,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};
