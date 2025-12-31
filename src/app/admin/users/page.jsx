"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import UserList from "@/components/Admin/Users/UserList";
import UserDetails from "@/components/Admin/Users/UserDetails";
import { Input, Select, Button, message, Modal } from "antd";
import { IconSearch, IconPlus } from "@tabler/icons-react";

const { Search } = Input;
const { Option } = Select;

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

  // Load users from localStorage on mount
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("adminUsers");
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          setUsers(parsedUsers);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading users from localStorage:", error);
    }

    // Initialize with mock data if no stored data
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
  }, []);

  // Save users to localStorage whenever users state changes
  useEffect(() => {
    if (users.length > 0) {
      try {
        localStorage.setItem("adminUsers", JSON.stringify(users));
      } catch (error) {
        console.error("Error saving users to localStorage:", error);
      }
    }
  }, [users]);

  // Update selected user when users change
  useEffect(() => {
    if (selectedUser) {
      const updatedUser = users.find((u) => u.id === selectedUser.id);
      if (
        updatedUser &&
        JSON.stringify(updatedUser) !== JSON.stringify(selectedUser)
      ) {
        setSelectedUser(updatedUser);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // Filter users using useMemo for better performance
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phone?.includes(searchQuery)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleBlockUser = useCallback((userId) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) =>
        user.id === userId ? { ...user, status: "blocked" } : user
      );
      return updatedUsers;
    });
    message.success("User blocked successfully");
  }, []);

  const handleUnblockUser = useCallback((userId) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) =>
        user.id === userId ? { ...user, status: "active" } : user
      );
      return updatedUsers;
    });
    message.success("User unblocked successfully");
  }, []);

  const handleRoleChange = useCallback((userId, newRole) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      );
      return updatedUsers;
    });
    message.success("User role updated successfully");
  }, []);

  const handleResetPassword = useCallback((userId) => {
    message.success("Password reset email sent successfully");
  }, []);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    // Show modal on mobile/tablet
    if (window.innerWidth < 1024) {
      setIsDetailsModalVisible(true);
    }
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsModalVisible(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminSidebar activeItem="users" />

        <div className="flex-1 ml-0 lg:ml-64 pt-14 sm:pt-16 lg:pt-16">
          <div className="p-2 sm:p-4 md:p-6 pb-4 sm:pb-6 md:pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    User Management
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                    Manage user accounts, roles, and permissions
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3 sm:mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Search
                      placeholder="Search by name, email..."
                      allowClear
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      prefix={
                        <IconSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      }
                      size="large"
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={roleFilter}
                    onChange={setRoleFilter}
                    style={{ width: "100%" }}
                    size="large"
                    className="w-full"
                  >
                    <Option value="all">All Roles</Option>
                    <Option value="customer">Customer</Option>
                    <Option value="admin">Admin</Option>
                    <Option value="vendor">Vendor</Option>
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: "100%" }}
                    size="large"
                    className="w-full"
                  >
                    <Option value="all">All Status</Option>
                    <Option value="active">Active</Option>
                    <Option value="blocked">Blocked</Option>
                  </Select>
                </div>
              </div>

              {/* Desktop Layout: Side by side */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <UserList
                    users={filteredUsers}
                    onSelect={handleSelectUser}
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
                      onBlock={handleBlockUser}
                      onUnblock={handleUnblockUser}
                    />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                      Select a user to view details
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile/Tablet Layout: Full width list */}
              <div className="lg:hidden">
                <UserList
                  users={filteredUsers}
                  onSelect={handleSelectUser}
                  selectedUserId={selectedUser?.id}
                  onBlock={handleBlockUser}
                  onUnblock={handleUnblockUser}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet User Details Modal */}
      <Modal
        title={selectedUser ? selectedUser.name : "User Details"}
        open={isDetailsModalVisible}
        onCancel={handleCloseDetails}
        footer={null}
        width="95%"
        style={{ maxWidth: 600 }}
        className="dark:bg-gray-800"
        centered
      >
        {selectedUser && (
          <UserDetails
            user={selectedUser}
            onRoleChange={handleRoleChange}
            onResetPassword={handleResetPassword}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onClose={handleCloseDetails}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserManagementPage;
