"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  IconShieldCheck,
  IconTruck,
  IconRefresh,
  IconHeadset,
  IconUser,
  IconPhone,
  IconMap,
  IconFlag,
  IconLock,
  IconX
} from "@tabler/icons-react";
import { Button, Input, Radio, Modal, Form, message, Select } from "antd";
import axios from "axios";

const { TextArea } = Input;
const { Option } = Select;

const AddressStep = ({ onAddressSelect, selectedAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form] = Form.useForm();

  const getHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    []
  );

  const fetchAddresses = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/users/addresses", {
        headers: getHeaders(),
      });
      if (!data?.success) {
        throw new Error(data?.message || "Failed to load addresses");
      }
      setAddresses(data.data.addresses || []);
    } catch (error) {
      console.error("Fetch addresses error:", error);
      message.error(error.response?.data?.message || "Failed to load addresses");
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

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
      onOk: async () => {
        try {
          const { data } = await axios.delete(`/api/users/addresses/${addressId}`, {
            headers: getHeaders(),
          });
          if (!data?.success) {
            throw new Error(data?.message || "Failed to delete address");
          }
          await fetchAddresses();
          message.success("Address deleted successfully");
        } catch (error) {
          message.error(error.response?.data?.message || "Failed to delete address");
        }
      },
    });
  };

  const handleSaveAddress = async (values) => {
    try {
      const payload = {
        ...values,
        country: values.country || "India",
      };
      if (editingAddress) {
        const { data } = await axios.put(
          `/api/users/addresses/${editingAddress.id}`,
          { ...payload, isDefault: editingAddress.isDefault },
          { headers: getHeaders() }
        );
        if (!data?.success) {
          throw new Error(data?.message || "Failed to update address");
        }
        message.success("Address updated successfully");
      } else {
        const { data } = await axios.post(
          "/api/users/addresses",
          { ...payload, isDefault: addresses.length === 0 },
          { headers: getHeaders() }
        );
        if (!data?.success) {
          throw new Error(data?.message || "Failed to add address");
        }
        message.success("Address added successfully");
      }
      await fetchAddresses();
      setIsModalVisible(false);
      form.resetFields();
      setEditingAddress(null);
    } catch (error) {
      const res = error.response;
      if (res?.data?.errors) {
        res.data.errors.forEach((e) => {
          form.setFields([{ name: e.field, errors: [e.message] }]);
        });
      } else {
        message.error(res?.data?.message || "Failed to save address");
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const { data } = await axios.put(
        `/api/users/addresses/${addressId}/default`,
        {},
        { headers: getHeaders() }
      );
      if (!data?.success) {
        throw new Error(data?.message || "Failed to update default address");
      }
      await fetchAddresses();
      message.success("Default address updated");
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to set default address");
    }
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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <IconMapPin className="w-6 h-6 text-[#1e9a58]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Delivery Address</h2>
        </div>
        <button
          onClick={handleAddAddress}
          className="flex items-center justify-center gap-2 px-5 py-2 border-2 border-[#1e9a58] text-[#1e9a58] hover:bg-green-50 rounded-xl font-bold transition-colors w-full sm:w-auto"
        >
          <IconPlus className="w-5 h-5" />
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="w-full border-2 border-dashed border-green-200 bg-[#f4fbf7] rounded-3xl p-10 flex flex-col items-center justify-center text-center mt-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm border-4 border-white">
            <IconMapPin className="w-10 h-10 text-[#1e9a58]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No address saved yet</h3>
          <p className="text-gray-500 mb-8">Add a new address to continue with your order.</p>
          <button
            onClick={handleAddAddress}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-md"
          >
            <IconPlus className="w-5 h-5" />
            Add New Address
          </button>
        </div>
      ) : (

      <Radio.Group
        value={selectedAddress?.id}
        onChange={(e) => {
          const address = addresses.find((addr) => addr.id === e.target.value);
          onAddressSelect(address, false); // Don't auto-proceed, just select
        }}
        className="w-full"
      >
        <div className="space-y-3 sm:space-y-4">
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
                    className={`w-full p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      selectedAddress?.id === address.id
                        ? "border-[#1e9a58] bg-green-50/50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            selectedAddress?.id === address.id
                              ? "bg-[#1e9a58] text-white shadow-sm"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {getAddressIcon(address.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                              {address.name}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {address.phone}
                            </span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-green-100 text-[#1e9a58] text-xs font-bold rounded-md">
                                Default
                              </span>
                            )}
                            <span className="px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded capitalize">
                              {address.type}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {address.addressLine1}, {address.addressLine2}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          {address.landmark && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Landmark: {address.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 ml-0 sm:ml-4 w-full sm:w-auto justify-end sm:justify-start">
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
      )}

      {/* Trust Badges Row */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 bg-[#f4fbf7] p-4 rounded-2xl">
            <IconShieldCheck className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-[#1e9a58] text-xs">Secure Delivery</p>
              <p className="text-gray-500 text-[10px]">Your orders are 100% safe</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#f4fbf7] p-4 rounded-2xl">
            <IconTruck className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-[#1e9a58] text-xs">Fast Delivery</p>
              <p className="text-gray-500 text-[10px]">On-time, every time</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#f4fbf7] p-4 rounded-2xl">
            <IconRefresh className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-[#1e9a58] text-xs">Easy Returns</p>
              <p className="text-gray-500 text-[10px]">Hassle-free returns</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#f4fbf7] p-4 rounded-2xl">
            <IconHeadset className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-[#1e9a58] text-xs">24/7 Support</p>
              <p className="text-gray-500 text-[10px]">We're here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      <Modal
        title={null}
        closeIcon={<div className="w-8 h-8 rounded-full border border-gray-100 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"><IconX className="w-4 h-4 text-gray-500" /></div>}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 700 }}
        className="custom-address-modal"
      >
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0">
            <IconMapPin className="w-6 h-6 text-[#1e9a58]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{editingAddress ? "Edit Address" : "Add New Address"}</h2>
            <p className="text-gray-500">Enter your address details below</p>
          </div>
        </div>

        <style jsx global>{`
          .custom-address-modal .ant-modal-content {
            border-radius: 1.5rem;
            padding: 2rem;
          }
          .custom-address-modal .ant-form-item-label > label {
            font-weight: 600;
            color: #111827;
          }
          .custom-address-modal .ant-form-item-label > label.ant-form-item-required::before {
            display: none !important;
          }
          .custom-address-modal .ant-form-item-label > label.ant-form-item-required::after {
            display: inline-block;
            margin-inline-start: 4px;
            color: #ef4444;
            font-size: 14px;
            font-family: SimSun, sans-serif;
            line-height: 1;
            content: '*';
          }
          .custom-address-modal .ant-input-affix-wrapper,
          .custom-address-modal .ant-select-selector {
            border-radius: 0.75rem !important;
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
            border-color: #e5e7eb !important;
          }
          .custom-address-modal .ant-input-affix-wrapper:focus-within,
          .custom-address-modal .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
            border-color: #1e9a58 !important;
            box-shadow: 0 0 0 2px rgba(30, 154, 88, 0.1) !important;
          }
          .custom-address-modal .ant-input-prefix {
            margin-right: 8px;
          }
        `}</style>

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
            <Select 
              placeholder="Select address type"
              suffixIcon={<IconChevronRight className="w-4 h-4 text-gray-400 rotate-90" />}
              labelInValue={false}
              optionLabelProp="label"
            >
              <Option value="home" label={<div className="flex items-center gap-2"><IconHome className="w-5 h-5 text-[#1e9a58]" />Home</div>}>Home</Option>
              <Option value="work" label={<div className="flex items-center gap-2"><IconBriefcase className="w-5 h-5 text-[#1e9a58]" />Work</div>}>Work</Option>
              <Option value="other" label={<div className="flex items-center gap-2"><IconBuilding className="w-5 h-5 text-[#1e9a58]" />Other</div>}>Other</Option>
            </Select>
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input placeholder="John Doe" prefix={<IconUser className="w-5 h-5 text-[#1e9a58]" />} />
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
              <Input placeholder="+91 9876543210" prefix={<IconPhone className="w-5 h-5 text-[#1e9a58]" />} />
            </Form.Item>
          </div>

          <Form.Item
            name="addressLine1"
            label="Address Line 1"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input placeholder="House/Flat No., Building Name" prefix={<IconHome className="w-5 h-5 text-[#1e9a58]" />} />
          </Form.Item>

          <Form.Item name="addressLine2" label="Address Line 2 (Optional)">
            <Input placeholder="Street, Area, Colony" prefix={<IconBuilding className="w-5 h-5 text-[#1e9a58]" />} />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter city" }]}
            >
              <Input placeholder="Mumbai" prefix={<IconMapPin className="w-5 h-5 text-[#1e9a58]" />} />
            </Form.Item>

            <Form.Item
              name="state"
              label="State"
              rules={[{ required: true, message: "Please enter state" }]}
            >
              <Select 
                placeholder="Select state"
                suffixIcon={<IconChevronRight className="w-4 h-4 text-[#1e9a58] rotate-90" />}
                optionLabelProp="label"
              >
                <Option value="Maharashtra" label={<div className="flex items-center gap-2"><IconMap className="w-5 h-5 text-[#1e9a58]" />Maharashtra</div>}>Maharashtra</Option>
                <Option value="Delhi" label={<div className="flex items-center gap-2"><IconMap className="w-5 h-5 text-[#1e9a58]" />Delhi</div>}>Delhi</Option>
                <Option value="Karnataka" label={<div className="flex items-center gap-2"><IconMap className="w-5 h-5 text-[#1e9a58]" />Karnataka</div>}>Karnataka</Option>
                <Option value="Gujarat" label={<div className="flex items-center gap-2"><IconMap className="w-5 h-5 text-[#1e9a58]" />Gujarat</div>}>Gujarat</Option>
                <Option value="Tamil Nadu" label={<div className="flex items-center gap-2"><IconMap className="w-5 h-5 text-[#1e9a58]" />Tamil Nadu</div>}>Tamil Nadu</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="pincode"
              label="Pincode"
              rules={[
                { required: true, message: "Please enter pincode" },
                { pattern: /^[0-9]{6}$/, message: "Invalid pincode" },
              ]}
            >
              <Input placeholder="400001" maxLength={6} prefix={<IconMapPin className="w-5 h-5 text-[#1e9a58]" />} />
            </Form.Item>
          </div>

          <Form.Item name="landmark" label="Landmark (Optional)">
            <Input placeholder="Near City Park" prefix={<IconFlag className="w-5 h-5 text-[#1e9a58]" />} />
          </Form.Item>

          {/* Trust Alert */}
          <div className="mb-6 bg-[#f4fbf7] border border-green-100 rounded-xl p-4 flex gap-3 mt-4">
            <IconShieldCheck className="w-6 h-6 text-[#1e9a58] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1e9a58] mb-0.5">Your information is safe with us</p>
              <p className="text-xs text-gray-500">We do not share your address with anyone.</p>
            </div>
          </div>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-md"
              >
                <IconLock className="w-4 h-4" />
                {editingAddress ? "Update Address" : "Save Address"}
              </button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressStep;
