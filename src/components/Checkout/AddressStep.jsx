"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMapPin,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconHome,
  IconBuilding,
  IconBriefcase,
  IconChevronRight,
} from "@tabler/icons-react";
import { Button, Input, Radio, Modal, Form, message, Select } from "antd";

const { TextArea } = Input;
const { Option } = Select;

const AddressStep = ({ onAddressSelect, selectedAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form] = Form.useForm();

  // Load addresses from localStorage (dummy data)
  useEffect(() => {
    const savedAddresses = localStorage.getItem("userAddresses");
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    } else {
      // Initialize with dummy addresses
      const dummyAddresses = [
        {
          id: "1",
          type: "home",
          name: "John Doe",
          phone: "+91 9876543210",
          addressLine1: "123, Main Street",
          addressLine2: "Near City Park",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          landmark: "City Park",
          isDefault: true,
        },
        {
          id: "2",
          type: "work",
          name: "John Doe",
          phone: "+91 9876543210",
          addressLine1: "456, Business Tower",
          addressLine2: "Floor 5, Office 501",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400002",
          landmark: "Business District",
          isDefault: false,
        },
      ];
      setAddresses(dummyAddresses);
      localStorage.setItem("userAddresses", JSON.stringify(dummyAddresses));
    }
  }, []);

  // Set default selected address (don't auto-proceed)
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr =
        addresses.find((addr) => addr.isDefault) || addresses[0];
      onAddressSelect(defaultAddr, false);
    }
  }, [addresses, selectedAddress, onAddressSelect]);

  const handleAddAddress = () => {
    setEditingAddress(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    form.setFieldsValue(address);
    setIsModalVisible(true);
  };

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete Address",
      content: "Are you sure you want to delete this address?",
      onOk: () => {
        const updatedAddresses = addresses.filter(
          (addr) => addr.id !== addressId
        );
        if (
          updatedAddresses.length > 0 &&
          !updatedAddresses.some((a) => a.isDefault)
        ) {
          updatedAddresses[0].isDefault = true;
        }
        setAddresses(updatedAddresses);
        localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses));
        if (selectedAddress?.id === addressId) {
          onAddressSelect(updatedAddresses[0]);
        }
        message.success("Address deleted successfully");
      },
    });
  };

  const handleSaveAddress = (values) => {
    if (editingAddress) {
      // Update existing address
      const updatedAddresses = addresses.map((addr) =>
        addr.id === editingAddress.id
          ? { ...values, id: editingAddress.id }
          : addr
      );
      setAddresses(updatedAddresses);
      localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses));
      message.success("Address updated successfully");
      if (selectedAddress?.id === editingAddress.id) {
        onAddressSelect({ ...values, id: editingAddress.id });
      }
    } else {
      // Add new address
      const newAddress = {
        ...values,
        id: Date.now().toString(),
        isDefault: addresses.length === 0,
      };
      const updatedAddresses = [...addresses, newAddress];
      setAddresses(updatedAddresses);
      localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses));
      message.success("Address added successfully");
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSetDefault = (addressId) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));
    setAddresses(updatedAddresses);
    localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses));
    message.success("Default address updated");
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case "home":
        return <IconHome className="w-5 h-5" />;
      case "work":
        return <IconBriefcase className="w-5 h-5" />;
      default:
        return <IconBuilding className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Delivery Address</h2>
        <Button
          type="primary"
          icon={<IconPlus className="w-4 h-4" />}
          onClick={handleAddAddress}
        >
          Add New Address
        </Button>
      </div>

      <Radio.Group
        value={selectedAddress?.id}
        onChange={(e) => {
          const address = addresses.find((addr) => addr.id === e.target.value);
          onAddressSelect(address, false); // Don't auto-proceed, just select
        }}
        className="w-full"
      >
        <div className="space-y-4">
          <AnimatePresence>
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
              >
                <Radio value={address.id} className="w-full">
                  <div
                    className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAddress?.id === address.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedAddress?.id === address.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getAddressIcon(address.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {address.name}
                            </span>
                            <span className="text-gray-500">
                              {address.phone}
                            </span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                Default
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded capitalize">
                              {address.type}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {address.addressLine1}, {address.addressLine2}
                          </p>
                          <p className="text-gray-700 text-sm">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          {address.landmark && (
                            <p className="text-gray-500 text-xs mt-1">
                              Landmark: {address.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!address.isDefault && (
                          <Button
                            type="text"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(address.id);
                            }}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          type="text"
                          size="small"
                          icon={<IconEdit className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                        />
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<IconTrash className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(address.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Radio>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Radio.Group>

      {/* Continue Button */}
      {selectedAddress && (
        <div className="mt-6 flex justify-end">
          <Button
            type="primary"
            size="large"
            onClick={() => onAddressSelect(selectedAddress, true)}
            className="min-w-[150px]"
          >
            Continue to Payment
            <IconChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Modal
        title={editingAddress ? "Edit Address" : "Add New Address"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveAddress}
          className="mt-4"
        >
          <Form.Item
            name="type"
            label="Address Type"
            rules={[{ required: true, message: "Please select address type" }]}
          >
            <Select placeholder="Select address type">
              <Option value="home">Home</Option>
              <Option value="work">Work</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: "Please enter phone number" },
                {
                  pattern:
                    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                  message: "Invalid phone number",
                },
              ]}
            >
              <Input placeholder="+91 9876543210" />
            </Form.Item>
          </div>

          <Form.Item
            name="addressLine1"
            label="Address Line 1"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input placeholder="House/Flat No., Building Name" />
          </Form.Item>

          <Form.Item name="addressLine2" label="Address Line 2">
            <Input placeholder="Street, Area, Colony" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter city" }]}
            >
              <Input placeholder="Mumbai" />
            </Form.Item>

            <Form.Item
              name="state"
              label="State"
              rules={[{ required: true, message: "Please enter state" }]}
            >
              <Input placeholder="Maharashtra" />
            </Form.Item>

            <Form.Item
              name="pincode"
              label="Pincode"
              rules={[
                { required: true, message: "Please enter pincode" },
                { pattern: /^[0-9]{6}$/, message: "Invalid pincode" },
              ]}
            >
              <Input placeholder="400001" maxLength={6} />
            </Form.Item>
          </div>

          <Form.Item name="landmark" label="Landmark (Optional)">
            <Input placeholder="Near City Park" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAddress ? "Update Address" : "Save Address"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressStep;
