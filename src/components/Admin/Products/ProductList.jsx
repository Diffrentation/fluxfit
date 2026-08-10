"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Tag,
  Button,
  Image,
  Dropdown,
  message,
  Card,
  Input,
  Select,
  Space,
  Spin,
  Empty,
  Pagination,
  Modal
} from "antd";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconDots,
  IconCheck,
  IconX,
  IconClock,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconCalendar,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format, isValid, parseISO } from "date-fns";
import axios from "axios";
import safeFormatDate from "@/lib/dateFormatter";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
const myDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#09090b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  borderColor: "#27272a",
  rowHoverColor: "#18181b",
});

const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

const ProductList = ({ onEdit, onDelete, onView }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    inStock: "",
    page: 1,
    limit: 10,
    sort: "createdAt-desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [categories, setCategories] = useState([]);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  const searchTimeoutRef = useRef(null);
  const previousFiltersRef = useRef({});
  const filtersRef = useRef(filters);

  // Keep an always-fresh ref for event-driven refreshes.
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/categories?format=flat", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  // Build query parameters — GET /api/products expects `search`, not `q`
  const buildQueryParams = useCallback((currentFilters) => {
    const params = new URLSearchParams();

    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        if (key === "search" && String(value).trim()) {
          params.append("search", String(value).trim());
        } else {
          params.append(key, value);
        }
      }
    });

    return params.toString();
  }, []);

  // Check if filters have actually changed
  const hasFiltersChanged = useCallback((newFilters, oldFilters) => {
    const keys = ["search", "category", "status", "inStock", "sort", "page", "limit"];
    return keys.some(key => newFilters[key] !== oldFilters[key]);
  }, []);

  // Fetch products with filters - optimized with debouncing
  const fetchProducts = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams(currentFilters);
      
      const { data } = await axios.get(`/api/products?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (data.success) {
        // Ensure createdAt is a valid date for each product
        const validatedProducts = (data.data.products || []).map(product => ({
          ...product,
          id: product.id || product._id,
          createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        }));
        
        setProducts(validatedProducts);
        setPagination(data.data.pagination || {
          page: currentFilters.page,
          limit: currentFilters.limit,
          total: 0,
          totalPages: 1,
        });
        
        // Store current filters for comparison
        previousFiltersRef.current = { ...currentFilters };
      } else {
        message.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      message.error(
        error.response?.data?.message || 
        "Failed to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  // Debounced search function
  const debouncedSearch = useCallback((searchValue) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => {
        const newFilters = {
          ...prev,
          search: searchValue,
          page: 1, // Reset to first page on new search
        };
        
        // Only fetch if filters have changed
        if (hasFiltersChanged(newFilters, previousFiltersRef.current)) {
          fetchProducts(newFilters);
        }
        
        return newFilters;
      });
    }, 500); // 500ms debounce delay
  }, [fetchProducts, hasFiltersChanged]);

  // Handle filter changes with optimization
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
        ...(key !== "page" && key !== "limit" ? { page: 1 } : {}), // Reset page on filter change
      };
      
      // For search, use debounced version
      if (key === "search") {
        debouncedSearch(value);
        return newFilters;
      }
      
      // For other filters, fetch immediately if changed
      if (hasFiltersChanged(newFilters, previousFiltersRef.current)) {
        fetchProducts(newFilters);
      }
      
      return newFilters;
    });
  }, [debouncedSearch, fetchProducts, hasFiltersChanged]);

  // Handle search input with immediate feedback
  const handleSearch = (value) => {
    handleFilterChange("search", value);
  };

  // Handle pagination change
  const handlePageChange = (page, pageSize) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        page,
        limit: pageSize,
      };
      
      if (hasFiltersChanged(newFilters, previousFiltersRef.current)) {
        fetchProducts(newFilters);
      }
      
      return newFilters;
    });
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchProducts(filters);
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // When a product is edited in `ProductForm`, refresh this table + its filters.
  useEffect(() => {
    const handleRefreshEvent = () => {
      fetchProducts(filtersRef.current);
    };

    window.addEventListener("products:refresh", handleRefreshEvent);
    return () => {
      window.removeEventListener("products:refresh", handleRefreshEvent);
    };
  }, [fetchProducts]);

  // Show delete confirmation modal
  const showDeleteConfirm = (product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { data } = await axios.delete(`/api/products/${productToDelete.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (data.success) {
        message.success({
          content: 'Product deleted successfully',
          icon: <IconCheck className="w-4 h-4 text-green-500" />,
        });
        
        // Refresh products with current filters
        fetchProducts(filters);
        
        // Call onDelete callback if provided
        if (onDelete) onDelete(productToDelete.id);
        
        // Close modal
        setDeleteModalVisible(false);
        setProductToDelete(null);
      } else {
        message.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error(
        error.response?.data?.message || 
        "Failed to delete product. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  // Handle quick status change directly from the table
  const handleStatusChange = useCallback(async (productId, newStatus) => {
    try {
      const { data } = await axios.put(
        `/api/products/${productId}`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (data.success) {
        message.success(`Status changed to "${newStatus}"`);
        fetchProducts(filtersRef.current);
        window.dispatchEvent(new Event("products:refresh"));
      } else {
        message.error(data.message || "Failed to update status");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to update status");
    }
  }, [fetchProducts]);

  // Handle refresh
  const handleRefresh = () => {
    fetchProducts(filters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const defaultFilters = {
      search: "",
      category: "",
      status: "",
      inStock: "",
      page: 1,
      limit: 10,
      sort: "createdAt-desc",
    };
    
    setFilters(defaultFilters);
    fetchProducts(defaultFilters);
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    const { search, category, status, inStock, sort } = filters;
    return search !== "" || category !== "" || status !== "" || inStock !== "" || sort !== "createdAt-desc";
  };

  // Status color mapping
  const getStatusColor = (status) => {
    const colors = {
      approved: "green",
      pending: "orange",
      rejected: "red",
      draft: "gray",
      active: "blue",
      inactive: "gray",
    };
    return colors[status] || "default";
  };

  // Status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "active":
        return <IconCheck className="w-4 h-4" />;
      case "pending":
        return <IconClock className="w-4 h-4" />;
      case "rejected":
      case "inactive":
        return <IconX className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Grid columns
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Product",
        flex: 1,
        minWidth: 220,
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-2 sm:gap-3">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
              <Image
                src={p.data.primaryImage || p.data.images?.[0]?.url || ""}
                alt={p.data.name}
                width={36}
                height={36}
                className="object-cover"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23e5e7eb'/%3E%3C/svg%3E"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {p.data.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ID: {p.data.id}</div>
            </div>
          </div>
        ),
      },
      {
        headerName: "Category",
        width: 150,
        valueGetter: (p) => p.data.category?.name || "Uncategorized",
        cellRenderer: (p) => (
          <Tag color="blue" className="font-medium">
            {p.value}
          </Tag>
        ),
      },
      {
        headerName: "Price",
        width: 130,
        cellRenderer: (p) => (
          <div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              ₹{formatPrice(p.data.basePrice || 0)}
            </span>
            {p.data.originalPrice > p.data.basePrice && (
              <div className="text-xs text-gray-500 line-through">
                ₹{formatPrice(p.data.originalPrice || 0)}
              </div>
            )}
          </div>
        ),
      },
      {
        headerName: "Stock",
        field: "stock",
        width: 110,
        cellRenderer: (p) => (
          <span
            className={`font-semibold text-sm ${
              p.value > 10
                ? "text-green-600 dark:text-green-400"
                : p.value > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {(p.value || 0)} units
          </span>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 130,
        cellRenderer: (p) => (
          <Tag color={getStatusColor(p.value)} className="flex items-center gap-1 w-fit">
            {getStatusIcon(p.value)}
            <span className="capitalize">{p.value || "draft"}</span>
          </Tag>
        ),
      },
      {
        headerName: "Created",
        field: "createdAt",
        width: 140,
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-1 text-xs text-gray-500">
            <IconCalendar className="w-3 h-3" />
            {safeFormatDate(p.value)}
          </div>
        ),
      },
      {
        headerName: "Actions",
        width: 90,
        pinned: "right",
        cellRenderer: (p) => {
          const record = p.data;
          return (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "view",
                    label: "View Details",
                    icon: <IconEye className="w-4 h-4" />,
                    onClick: () => onView && onView(record),
                  },
                  {
                    key: "edit",
                    label: "Edit Product",
                    icon: <IconEdit className="w-4 h-4" />,
                    onClick: () => onEdit && onEdit(record),
                  },
                  {
                    key: "status",
                    label: "Change Status",
                    icon: <IconCheck className="w-4 h-4" />,
                    children: [
                      {
                        key: "status-active",
                        label: <span className="text-green-600 font-medium">Active</span>,
                        disabled: record.status === "active",
                        onClick: () => handleStatusChange(record.id, "active"),
                      },
                      {
                        key: "status-draft",
                        label: <span className="text-gray-500 font-medium">Draft</span>,
                        disabled: record.status === "draft",
                        onClick: () => handleStatusChange(record.id, "draft"),
                      },
                      {
                        key: "status-inactive",
                        label: <span className="text-orange-500 font-medium">Inactive</span>,
                        disabled: record.status === "inactive",
                        onClick: () => handleStatusChange(record.id, "inactive"),
                      },
                    ],
                  },
                  { type: "divider" },
                  {
                    key: "delete",
                    label: "Delete",
                    icon: <IconTrash className="w-4 h-4" />,
                    danger: true,
                    onClick: () => showDeleteConfirm(record),
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button type="text" icon={<IconDots className="w-4 h-4" />} />
            </Dropdown>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, handleStatusChange]
  );

  // Grid view for mobile and tablet
  const renderProductCard = (product) => {
    return (
      <Card
        className="h-full hover:shadow-md transition-shadow"
        styles={{ body: { padding: "12px" } }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
              <Image
                src={product.primaryImage || product.images?.[0]?.url || ""}
                alt={product.name}
                width={80}
                height={80}
                className="object-cover"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23e5e7eb'/%3E%3C/svg%3E"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate mb-1">
                {product.name || "Unnamed Product"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                ID: {product.id || "N/A"}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                <Tag color="blue" className="text-xs">
                  {product.category?.name || "Uncategorized"}
                </Tag>
                <Tag
                  color={getStatusColor(product.status)}
                  className="flex items-center gap-1 text-xs"
                >
                  {getStatusIcon(product.status)}
                  <span className="capitalize">{product.status || "draft"}</span>
                </Tag>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Price:</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{formatPrice(product.basePrice || 0)}
                </p>
                {product.originalPrice > product.basePrice && (
                  <p className="text-xs text-gray-500 line-through">
                    ₹{formatPrice(product.originalPrice || 0)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Stock:</span>
              <p
                className={`font-semibold ${
                  (product.stock || 0) > 10
                    ? "text-green-600 dark:text-green-400"
                    : (product.stock || 0) > 0
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {(product.stock || 0)} units
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1">
            <IconCalendar className="w-3 h-3" />
            Created: {safeFormatDate(product.createdAt)}
          </div>

          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <Button
              type="default"
              size="small"
              icon={<IconEye className="w-3 h-3" />}
              onClick={() => onView && onView(product)}
              className="flex-1"
            >
              View
            </Button>
            <Button
              type="default"
              size="small"
              icon={<IconEdit className="w-3 h-3" />}
              onClick={() => onEdit && onEdit(product)}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              type="default"
              size="small"
              icon={<IconTrash className="w-3 h-3" />}
              onClick={() => showDeleteConfirm(product)}
              danger
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Filter controls JSX
  const filterControlsJSX = (
    <div className="!bg-zinc-950 rounded-lg p-4 mb-6 shadow-sm border border-zinc-800">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Search
            placeholder="Search by name, ID, description, or SKU..."
            allowClear
            enterButton={<IconSearch className="w-4 h-4" />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            value={filters.search}
            loading={loading}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select
            placeholder="Category"
            style={{ width: 150 }}
            size="large"
            allowClear
            value={filters.category || undefined}
            onChange={(value) => handleFilterChange("category", value)}
            loading={categories.length === 0}
          >
            {categories.map((cat) => (
              <Option key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Status"
            style={{ width: 150 }}
            size="large"
            allowClear
            value={filters.status || undefined}
            onChange={(value) => handleFilterChange("status", value)}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="pending">Pending</Option>
            <Option value="draft">Draft</Option>
          </Select>

          <Select
            placeholder="Stock"
            style={{ width: 150 }}
            size="large"
            allowClear
            value={filters.inStock || undefined}
            onChange={(value) => handleFilterChange("inStock", value)}
          >
            <Option value="true">In Stock</Option>
            <Option value="false">Out of Stock</Option>
          </Select>

          <Select
            placeholder="Sort By"
            style={{ width: 150 }}
            size="large"
            value={filters.sort}
            onChange={(value) => handleFilterChange("sort", value)}
          >
            <Option value="createdAt-desc">Newest First</Option>
            <Option value="createdAt-asc">Oldest First</Option>
            <Option value="price-asc">Price: Low to High</Option>
            <Option value="price-desc">Price: High to Low</Option>
            <Option value="name-asc">Name: A to Z</Option>
            <Option value="name-desc">Name: Z to A</Option>
          </Select>

          <Button
            type="default"
            icon={<IconRefresh className="w-4 h-4" />}
            size="large"
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          
          {hasActiveFilters() && (
            <Button
              type="text"
              size="large"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters indicator */}
      {hasActiveFilters() && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Active filters:</span>
          {filters.search && (
            <Tag closable onClose={() => handleFilterChange("search", "")}>
              Search: {filters.search}
            </Tag>
          )}
          {filters.category && (
            <Tag closable onClose={() => handleFilterChange("category", "")}>
              Category: {categories.find(c => (c._id || c.id) === filters.category)?.name || filters.category}
            </Tag>
          )}
          {filters.status && (
            <Tag closable onClose={() => handleFilterChange("status", "")}>
              Status: {filters.status}
            </Tag>
          )}
          {filters.inStock && (
            <Tag closable onClose={() => handleFilterChange("inStock", "")}>
              Stock: {filters.inStock === "true" ? "In Stock" : "Out of Stock"}
            </Tag>
          )}
          {filters.sort !== "createdAt-desc" && (
            <Tag closable onClose={() => handleFilterChange("sort", "createdAt-desc")}>
              Sort: {filters.sort}
            </Tag>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Filter Controls */}
      {filterControlsJSX}

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <IconAlertTriangle className="w-5 h-5" />
            <span>Delete Product</span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={handleDeleteCancel}
        footer={[
          <Button key="cancel" onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleteLoading}
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>,
        ]}
        width={400}
      >
        <div className="py-4">
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete this product?
          </p>
          {productToDelete && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Image
                  src={productToDelete.primaryImage || productToDelete.images?.[0]?.url || ""}
                  alt={productToDelete.name}
                  width={40}
                  height={40}
                  className="rounded object-cover"
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3C/svg%3E"
                />
                <div>
                  <p className="font-medium">{productToDelete.name}</p>
                  <p className="text-xs text-gray-500">ID: {productToDelete.id}</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-red-500 text-sm mt-3">
            This action cannot be undone. The product will be permanently deleted.
          </p>
        </div>
      </Modal>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col gap-4 justify-center items-center py-20">
          <Spin size="large" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Products Count */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {Math.min(products.length, pagination.limit)} of {pagination.total} products
            </div>
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          </div>

          {/* Grid Layout for Mobile and Tablet */}
          <div className="lg:hidden">
            {products.length === 0 ? (
              <Empty
                description="No products found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="py-12"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {products.map((product) => (
                  <React.Fragment key={product.id || Math.random()}>
                    {renderProductCard(product)}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Table Layout for Desktop — server-paginated (fetchProducts
              already fetches one page at a time via `filters.page`), so
              ag-grid pagination stays off and the existing Pagination
              component below drives page changes as before. */}
          <div className="hidden lg:block !bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 overflow-hidden p-2">
            {isClient ? (
              <div style={{ width: "100%", height: 560 }}>
                <AgGridReact
                  theme={myDarkTheme}
                  modules={[AllCommunityModule]}
                  rowData={products}
                  columnDefs={columnDefs}
                  defaultColDef={{ sortable: true, resizable: true }}
                  getRowId={(p) => String(p.data.id)}
                  animateRows
                  rowHeight={56}
                  headerHeight={44}
                  loading={loading}
                  suppressCellFocus
                  overlayNoRowsTemplate="No products found"
                />
              </div>
            ) : (
              <div className="h-[560px]" />
            )}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                current={pagination.page}
                pageSize={pagination.limit}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`
                }
                size="default"
                disabled={loading}
              />
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ProductList;