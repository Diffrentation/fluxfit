"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import UserList from "@/components/Admin/Users/UserList";
import UserDetails from "@/components/Admin/Users/UserDetails";
import { Input, Select, Button, message } from "antd";
import { IconSearch, IconPlus } from "@tabler/icons-react";

const { Search } = Input;
const { Option } = Select;

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = () => {
    // Mock data - in production, fetch from API
    const mockUsers = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "+91 9876543210",
        role: "customer",
        status: "active",
        registeredAt: "2024-01-15",
        totalOrders: 5,
        totalSpent: 15000,
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+91 9876543211",
        role: "customer",
        status: "active",
        registeredAt: "2024-02-20",
        totalOrders: 3,
        totalSpent: 8000,
      },
      {
        id: 3,
        name: "Admin User",
        email: "admin@example.com",
        phone: "+91 9876543212",
        role: "admin",
        status: "active",
        registeredAt: "2024-01-01",
        totalOrders: 0,
        totalSpent: 0,
      },
    ];
    setUsers(mockUsers);
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, status: "blocked" } : user
    );
    setUsers(updatedUsers);
    message.success("User blocked successfully");
    loadUsers();
  };

  const handleUnblockUser = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, status: "active" } : user
    );
    setUsers(updatedUsers);
    message.success("User unblocked successfully");
    loadUsers();
  };

  const handleRoleChange = (userId, newRole) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, role: newRole } : user
    );
    setUsers(updatedUsers);
    message.success("User role updated successfully");
    loadUsers();
  };

  const handleResetPassword = (userId) => {
    message.success("Password reset email sent successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar activeItem="users" />

        <div className="flex-1 ml-0 lg:ml-64 pt-20 lg:pt-16">
          <div className="p-4 md:p-6 pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    User Management
                  </h1>
                  <p className="text-gray-600">
                    Manage user accounts, roles, and permissions
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="flex-1">
                  <Search
                    placeholder="Search by name or email"
                    allowClear
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={<IconSearch className="w-4 h-4 text-gray-400" />}
                    size="large"
                  />
                </div>
                <Select
                  value={roleFilter}
                  onChange={setRoleFilter}
                  style={{ width: 150 }}
                  size="large"
                >
                  <Option value="all">All Roles</Option>
                  <Option value="customer">Customer</Option>
                  <Option value="admin">Admin</Option>
                  <Option value="vendor">Vendor</Option>
                </Select>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 150 }}
                  size="large"
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="blocked">Blocked</Option>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <UserList
                    users={filteredUsers}
                    onSelect={(user) => setSelectedUser(user)}
                    selectedUserId={selectedUser?.id}
                    onBlock={handleBlockUser}
                    onUnblock={handleUnblockUser}
                  />
                </div>
                <div className="lg:col-span-1">
                  {selectedUser ? (
                    <UserDetails
                      user={selectedUser}
                      onRoleChange={handleRoleChange}
                      onResetPassword={handleResetPassword}
                    />
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                      Select a user to view details
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;

