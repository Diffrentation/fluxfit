import React from 'react';
import { Modal, Tag, Table, Divider, Typography } from 'antd';
import Image from 'next/image';
import { formatPrice } from "@/lib/formatPrice";
import safeFormatDate from "@/lib/dateFormatter";

const { Title, Text, Paragraph } = Typography;

const ProductDetailsModal = ({ visible, product, onClose }) => {
  if (!product) return null;

  const primaryImage = product.primaryImage || product.images?.[0]?.url || product.image || "";

  // Calculate total inventory value
  const totalStockValue = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + ((v.stock || 0) * (v.price || product.basePrice || product.price || 0)), 0)
    : (product.stock || 0) * (product.basePrice || product.price || 0);

  const variantsColumns = [
    { title: 'Size', dataIndex: 'size', key: 'size', render: (val) => val || 'One Size' },
    { title: 'Color', dataIndex: 'color', key: 'color', render: (val) => val ? <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: val.toLowerCase() }}></div><span className="capitalize">{val}</span></div> : 'Default' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => <span className="font-medium text-gray-800">₹{formatPrice(val || product.basePrice || product.price || 0)}</span> },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (val) => <span className={val > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{val || 0}</span> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (val) => val !== false ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag> }
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20 }}
      styles={{ body: { height: '80vh', overflowY: 'auto', padding: '24px' } }}
      title={<Title level={3} className="!mb-0">{product.name}</Title>}
      centered
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mt-4">
        {/* Left Side: Images */}
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-[4/3] relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm">
            {primaryImage ? (
              <Image src={primaryImage} alt={product.name} fill className="object-contain p-4" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">No Image Available</div>
            )}
          </div>
          {/* Other images gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img, idx) => {
                const url = typeof img === 'string' ? img : img.url;
                if (!url) return null;
                return (
                  <div key={idx} className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden shrink-0 shadow-sm hover:border-blue-400 transition-colors cursor-pointer">
                    <Image src={url} alt="" fill className="object-cover" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Details */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <Text type="secondary" className="block text-xs uppercase tracking-wider font-semibold mb-1">Base Price</Text>
              <Title level={2} className="!mb-0 text-blue-600">₹{formatPrice(product.basePrice || product.price || 0)}</Title>
            </div>
            <div className="text-right">
              <Text type="secondary" className="block text-xs uppercase tracking-wider font-semibold mb-1">Availability</Text>
              <Tag color={product.inStock ? 'success' : 'error'} className="text-sm px-4 py-1 m-0 rounded-full font-bold">
                {product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </Tag>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center items-center">
              <Text type="secondary" className="block mb-1 font-medium text-blue-800">Total Stock</Text>
              <Text strong className="text-2xl text-blue-600">{product.stock || 0}</Text>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col justify-center items-center">
              <Text type="secondary" className="block mb-1 font-medium text-green-800 text-center">Stock Value</Text>
              <Text strong className="text-xl text-green-600 text-center truncate w-full">₹{formatPrice(totalStockValue)}</Text>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col justify-center items-center">
              <Text type="secondary" className="block mb-1 font-medium text-purple-800">Category</Text>
              <Text strong className="text-lg text-purple-600 capitalize text-center line-clamp-1">{product.category?.name || product.category || 'N/A'}</Text>
            </div>
          </div>

          <Divider titlePlacement="left" className="!mt-0 !mb-4">Description</Divider>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
            <Paragraph className="text-gray-700 whitespace-pre-wrap m-0">
              {product.description || "No description provided for this product."}
            </Paragraph>
          </div>

          <Divider titlePlacement="left" className="!mt-0 !mb-4">Variants</Divider>
          <div className="mb-6 flex-1">
            {product.variants && product.variants.length > 0 ? (
              <Table 
                dataSource={product.variants.map((v, i) => ({ ...v, key: i }))} 
                columns={variantsColumns} 
                pagination={false}
                size="middle"
                bordered
                className="shadow-sm rounded-lg overflow-hidden"
              />
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 flex items-center justify-center">
                <Text type="secondary" className="text-center">No variants (sizes/colors) configured for this product.</Text>
              </div>
            )}
          </div>

          <Divider titlePlacement="left" className="!mt-0 !mb-4">Details & Metadata</Divider>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-inner">
            <div><Text strong className="text-gray-800">Status: </Text> <span className="capitalize">{product.status}</span></div>
            <div className="truncate"><Text strong className="text-gray-800">Product ID: </Text> <span title={product.id || product._id}>{product.id || product._id}</span></div>
            
            {product.originalPrice && product.originalPrice > product.basePrice && (
              <div><Text strong className="text-gray-800">Original Price: </Text> <span className="line-through text-gray-400">₹{formatPrice(product.originalPrice)}</span></div>
            )}
            <div><Text strong className="text-gray-800">Discount: </Text> {product.discount || 0}%</div>
            
            <div><Text strong className="text-gray-800">Rating: </Text> {typeof product.rating === 'object' ? (product.rating?.average || 0) : (product.rating || 0)} / 5 ({(typeof product.rating === 'object' ? product.rating?.count : product.reviews) || 0} reviews)</div>
            <div><Text strong className="text-gray-800">Customization: </Text> {product.customization ? <span className="text-green-600">Available</span> : <span className="text-gray-400">Not Available</span>}</div>
            
            <div className="truncate"><Text strong className="text-gray-800">Meta Title: </Text> <span title={product.metaTitle}>{product.metaTitle || 'N/A'}</span></div>
            <div className="truncate"><Text strong className="text-gray-800">Slug: </Text> <span title={product.slug}>{product.slug || 'N/A'}</span></div>
            
            {product.gender && <div><Text strong className="text-gray-800">Gender: </Text> <span className="capitalize">{product.gender}</span></div>}
            {product.material && <div><Text strong className="text-gray-800">Material: </Text> <span className="capitalize">{product.material}</span></div>}

            {product.shipping && <div className="col-span-2"><Text strong className="text-gray-800">Shipping: </Text> {product.shipping}</div>}
            {product.returnPolicy && <div className="col-span-2"><Text strong className="text-gray-800">Return Policy: </Text> {product.returnPolicy}</div>}
            {product.careInstructions && <div className="col-span-2"><Text strong className="text-gray-800">Care Instructions: </Text> {product.careInstructions}</div>}
            {product.tags && product.tags.length > 0 && (
              <div className="col-span-2 flex items-start gap-2">
                <Text strong className="text-gray-800 mt-1">Tags: </Text> 
                <div className="flex flex-wrap gap-1">
                  {product.tags.map(tag => <Tag key={tag} className="m-0 text-xs">{tag}</Tag>)}
                </div>
              </div>
            )}
          </div>

          <Divider titlePlacement="left" className="!mb-4">System Information</Divider>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100 text-xs text-gray-500">
            <div>
              <Text strong className="block text-gray-700 mb-1">Created At</Text>
              {safeFormatDate(product.createdAt, 'dd MMM yyyy, hh:mm a')}
            </div>
            <div className="text-right">
              <Text strong className="block text-gray-700 mb-1">Last Updated</Text>
              {safeFormatDate(product.updatedAt, 'dd MMM yyyy, hh:mm a')}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailsModal;
