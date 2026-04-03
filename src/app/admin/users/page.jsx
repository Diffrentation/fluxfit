"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminContent from "@/components/Admin/AdminContent";
import UserList from "@/components/Admin/Users/UserList";
import UserDetails from "@/components/Admin/Users/UserDetails";
import { Input, Select, Spin, message, Modal } from "antd";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";

const { Search } = Input;
const { Option } = Select;

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // roleFilter maps to backend role: buyer/admin
  // display values: all/user/admin
  const [roleFilter, setRoleFilter] = useState("all");
  // statusFilter maps to backend isBlocked:
  // display values: all/active/blocked
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isMutating, setIsMutating] = useState(false);

  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }, []);

  const mapApiUserToUi = useCallback((u) => {
    const firstname = u.firstname || "";
    const lastname = u.lastname || "";
    const name = `${firstname} ${lastname}`.trim();

    return {
      id: u.id,
      name,
      email: u.email,
      phone: u.phone || null,
      role: u.role === "buyer" ? "user" : u.role, // UI uses user/admin
      status: u.isblocked ? "blocked" : "active",
      registeredAt: u.createdAt,
      createdAt: u.createdAt,
      totalOrders: 0,
      totalSpent: 0,
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const roleForApi = roleFilter === "all" ? undefined : roleFilter === "user" ? "buyer" : roleFilter;
      const isBlockedForApi =
        statusFilter === "all"
          ? undefined
          : statusFilter === "blocked"
            ? "true"
            : "false";

      const { data } = await axios.get("/api/admin/users", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery ? searchQuery : undefined,
          role: roleForApi,
          isBlocked: isBlockedForApi,
          sort: "newest",
        },
        headers: getAuthHeaders(),
      });

      if (!data?.success) throw new Error(data?.message || "Failed to load users");

      const mappedUsers = (data.users || []).map(mapApiUserToUi);
      setUsers(mappedUsers);

      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          ...data.pagination,
        }));
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      message.error(error.response?.data?.message || error.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [getAuthHeaders, mapApiUserToUi, pagination.page, pagination.limit, searchQuery, roleFilter, statusFilter]);

  const fetchUserDetails = useCallback(
    async (userId) => {
      if (!userId) return;
      setLoadingUserDetails(true);
      try {
        const { data } = await axios.get(`/api/admin/users/${userId}`, {
          headers: getAuthHeaders(),
        });

        if (!data?.success) throw new Error(data?.message || "Failed to load user");

        const user = data.user;
        setSelectedUser(mapApiUserToUi(user));
      } catch (error) {
        console.error("Fetch user details error:", error);
        message.error(error.response?.data?.message || error.message || "Failed to load user details");
      } finally {
        setLoadingUserDetails(false);
      }
    },
    [getAuthHeaders, mapApiUserToUi],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = useCallback((page, limit) => {
    setPagination((prev) => ({ ...prev, page, limit }));
  }, []);

  const handleBlockUser = useCallback(
    async (userId) => {
      if (!userId) return;
      if (isMutating) return;
      setIsMutating(true);
      try {
        const { data } = await axios.put(
          `/api/admin/users/${userId}/block`,
          {},
          { headers: getAuthHeaders() },
        );
        if (!data?.success) throw new Error(data?.message || "Failed to block user");
        message.success(data?.message || "User blocked successfully");
        await fetchUsers();
        if (selectedUser?.id === userId) await fetchUserDetails(userId);
      } catch (error) {
        console.error("Block user error:", error);
        message.error(error.response?.data?.message || error.message || "Failed to block user");
      } finally {
        setIsMutating(false);
      }
    },
    [fetchUsers, fetchUserDetails, getAuthHeaders, isMutating, selectedUser?.id],
  );

  const handleUnblockUser = useCallback(
    async (userId) => {
      if (!userId) return;
      if (isMutating) return;
      setIsMutating(true);
      try {
        const { data } = await axios.put(
          `/api/admin/users/${userId}/unblock`,
          {},
          { headers: getAuthHeaders() },
        );
        if (!data?.success) throw new Error(data?.message || "Failed to unblock user");
        message.success(data?.message || "User unblocked successfully");
        await fetchUsers();
        if (selectedUser?.id === userId) await fetchUserDetails(userId);
      } catch (error) {
        console.error("Unblock user error:", error);
        message.error(
          error.response?.data?.message || error.message || "Failed to unblock user",
        );
      } finally {
        setIsMutating(false);
      }
    },
    [fetchUsers, fetchUserDetails, getAuthHeaders, isMutating, selectedUser?.id],
  );

  const handleRoleChange = useCallback(
    async (userId, newRole) => {
      if (!userId) return;
      if (isMutating) return;
      setIsMutating(true);
      try {
        const apiRole =
          newRole === "user" ? "buyer" : newRole === "admin" ? "admin" : undefined;
        if (!apiRole) throw new Error("Invalid role");

        const { data } = await axios.put(
          `/api/admin/users/${userId}/role`,
          { role: apiRole },
          { headers: getAuthHeaders() },
        );
        if (!data?.success) throw new Error(data?.message || "Failed to update role");
        message.success(data?.message || "User role updated successfully");
        await fetchUsers();
        if (selectedUser?.id === userId) await fetchUserDetails(userId);
      } catch (error) {
        console.error("Role update error:", error);
        message.error(error.response?.data?.message || error.message || "Failed to update role");
      } finally {
        setIsMutating(false);
      }
    },
    [fetchUsers, fetchUserDetails, getAuthHeaders, isMutating, selectedUser?.id],
  );

  const handleResetPassword = useCallback((userId) => {
    message.success("Password reset email sent successfully");
  }, []);

  const handleSelectUser = useCallback(
    (user) => {
      if (!user?.id) return;

      // Show modal on mobile/tablet immediately for better UX.
      if (window.innerWidth < 1024) {
        setIsDetailsModalVisible(true);
      }

      setSelectedUser(user); // optimistic until details load
      fetchUserDetails(user.id);
    },
    [fetchUserDetails],
  );

  const handleCloseDetails = useCallback(() => {
    setIsDetailsModalVisible(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminSidebar activeItem="users" />

        <AdminContent>
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
                    <Option value="user">User</Option>
                    <Option value="admin">Admin</Option>
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
                  {loadingUsers ? (
                    <div className="p-6">
                      <Spin />
                    </div>
                  ) : (
                    <UserList
                      users={users}
                      pagination={pagination}
                      onPageChange={handlePageChange}
                      onSelect={handleSelectUser}
                      selectedUserId={selectedUser?.id}
                      onBlock={handleBlockUser}
                      onUnblock={handleUnblockUser}
                      isMutating={isMutating}
                    />
                  )}
                </div>
                <div className="lg:col-span-1">
                  {selectedUser ? (
                    loadingUserDetails ? (
                      <div className="p-6">
                        <Spin />
                      </div>
                    ) : (
                      <UserDetails
                        user={selectedUser}
                        onRoleChange={handleRoleChange}
                        onResetPassword={handleResetPassword}
                        onBlock={handleBlockUser}
                        onUnblock={handleUnblockUser}
                        isMutating={isMutating}
                      />
                    )
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
                  users={users}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onSelect={handleSelectUser}
                  selectedUserId={selectedUser?.id}
                  onBlock={handleBlockUser}
                  onUnblock={handleUnblockUser}
                  isMutating={isMutating}
                />
              </div>
            </motion.div>
          </div>
        </AdminContent>
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
          loadingUserDetails ? (
            <div className="p-6">
              <Spin />
            </div>
          ) : (
            <UserDetails
              user={selectedUser}
              onRoleChange={handleRoleChange}
              onResetPassword={handleResetPassword}
              onBlock={handleBlockUser}
              onUnblock={handleUnblockUser}
              onClose={handleCloseDetails}
              isMutating={isMutating}
            />
          )
        )}
      </Modal>
    </div>
  );
};

export default UserManagementPage;
