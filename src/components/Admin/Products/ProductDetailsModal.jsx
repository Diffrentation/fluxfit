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
    { title: 'Color', dataIndex: 'color', key: 'color', render: (val) => val ? <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: val.toLowerCase() }}></div><span className="capitalize text-zinc-300">{val}</span></div> : 'Default' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => <span className="font-medium text-zinc-300">₹{formatPrice(val || product.basePrice || product.price || 0)}</span> },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (val) => <span className={val > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{val || 0}</span> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (val) => val !== false ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag> }
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20, maxWidth: 1000 }}
      styles={{ body: { height: '80vh', overflowY: 'auto', padding: '24px', background: '#09090b' } }}
      title={<Title level={3} className="!mb-0 !text-white">{product.name}</Title>}
      centered
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mt-4">
        {/* Left Side: Images */}
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-[4/3] relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md">
            {primaryImage ? (
              <Image src={primaryImage} alt={product.name} fill className="object-contain p-4" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-zinc-500">No Image Available</div>
            )}
          </div>
          {/* Other images gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img, idx) => {
                const url = typeof img === 'string' ? img : img.url;
                if (!url) return null;
                return (
                  <div key={idx} className="relative w-24 h-24 rounded-lg border border-zinc-800 overflow-hidden shrink-0 shadow-sm hover:border-emerald-500 transition-colors cursor-pointer bg-zinc-900">
                    <Image src={url} alt="" fill className="object-cover" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Details */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div>
              <Text className="block text-xs uppercase tracking-wider font-semibold mb-1 text-zinc-400">Base Price</Text>
              <Title level={2} className="!mb-0 !text-emerald-400">₹{formatPrice(product.basePrice || product.price || 0)}</Title>
            </div>
            <div className="text-right">
              <Text className="block text-xs uppercase tracking-wider font-semibold mb-1 text-zinc-400">Availability</Text>
              <Tag color={product.inStock ? 'success' : 'error'} className="text-sm px-4 py-1 m-0 rounded-full font-bold">
                {product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </Tag>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-950/20 p-4 rounded-lg border border-blue-900/30 flex flex-col justify-center items-center">
              <Text className="block mb-1 font-medium text-blue-300">Total Stock</Text>
              <Text strong className="text-2xl text-blue-400">{product.stock || 0}</Text>
            </div>
            <div className="bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/30 flex flex-col justify-center items-center">
              <Text className="block mb-1 font-medium text-emerald-300 text-center">Stock Value</Text>
              <Text strong className="text-xl text-emerald-400 text-center truncate w-full">₹{formatPrice(totalStockValue)}</Text>
            </div>
            <div className="bg-purple-950/20 p-4 rounded-lg border border-purple-900/30 flex flex-col justify-center items-center">
              <Text className="block mb-1 font-medium text-purple-300">Category</Text>
              <Text strong className="text-lg text-purple-400 capitalize text-center line-clamp-1">{product.category?.name || product.category || 'N/A'}</Text>
            </div>
          </div>

          <Divider titlePlacement="left" className="!mt-0 !mb-4 border-zinc-800">Description</Divider>
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 mb-6">
            <Paragraph className="!text-zinc-300 whitespace-pre-wrap m-0">
              {product.description || "No description provided for this product."}
            </Paragraph>
          </div>

          <Divider titlePlacement="left" className="!mt-0 !mb-4 border-zinc-800">Variants</Divider>
          <div className="mb-6 flex-1">
            {product.variants && product.variants.length > 0 ? (
              <Table 
                dataSource={product.variants.map((v, i) => ({ ...v, key: i }))} 
                columns={variantsColumns} 
                pagination={false}
                size="middle"
                bordered
                className="shadow-sm rounded-lg overflow-hidden border-zinc-800"
              />
            ) : (
              <div className="bg-zinc-900 p-8 rounded-lg border border-zinc-800 flex items-center justify-center">
                <Text className="text-center text-zinc-400">No variants (sizes/colors) configured for this product.</Text>
              </div>
            )}
          </div>

          <Divider titlePlacement="left" className="!mt-0 !mb-4 border-zinc-800">Details & Metadata</Divider>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-zinc-400 bg-zinc-900 p-4 rounded-lg border border-zinc-800 shadow-inner">
            <div><Text strong className="!text-zinc-300">Status: </Text> <span className="capitalize text-zinc-200">{product.status}</span></div>
            <div className="truncate"><Text strong className="!text-zinc-300">Product ID: </Text> <span className="text-zinc-200" title={product.id || product._id}>{product.id || product._id}</span></div>
            
            {product.originalPrice && product.originalPrice > product.basePrice && (
              <div><Text strong className="!text-zinc-300">Original Price: </Text> <span className="line-through text-zinc-500">₹{formatPrice(product.originalPrice)}</span></div>
            )}
            <div><Text strong className="!text-zinc-300">Discount: </Text> <span className="text-zinc-200">{product.discount || 0}%</span></div>
            
            <div><Text strong className="!text-zinc-300">Rating: </Text> <span className="text-zinc-200">{typeof product.rating === 'object' ? (product.rating?.average || 0) : (product.rating || 0)} / 5 ({(typeof product.rating === 'object' ? product.rating?.count : product.reviews) || 0} reviews)</span></div>
            <div><Text strong className="!text-zinc-300">Customization: </Text> {product.customization ? <span className="text-emerald-400">Available</span> : <span className="text-zinc-500">Not Available</span>}</div>
            
            <div className="truncate"><Text strong className="!text-zinc-300">Meta Title: </Text> <span className="text-zinc-200" title={product.metaTitle}>{product.metaTitle || 'N/A'}</span></div>
            <div className="truncate"><Text strong className="!text-zinc-300">Slug: </Text> <span className="text-zinc-200" title={product.slug}>{product.slug || 'N/A'}</span></div>
            
            {product.gender && <div><Text strong className="!text-zinc-300">Gender: </Text> <span className="capitalize text-zinc-200">{product.gender}</span></div>}
            {product.material && <div><Text strong className="!text-zinc-300">Material: </Text> <span className="capitalize text-zinc-200">{product.material}</span></div>}

            {product.shipping && <div className="col-span-2"><Text strong className="!text-zinc-300">Shipping: </Text> <span className="text-zinc-200">{product.shipping}</span></div>}
            {product.returnPolicy && <div className="col-span-2"><Text strong className="!text-zinc-300">Return Policy: </Text> <span className="text-zinc-200">{product.returnPolicy}</span></div>}
            {product.careInstructions && <div className="col-span-2"><Text strong className="!text-zinc-300">Care Instructions: </Text> <span className="text-zinc-200">{product.careInstructions}</span></div>}
            {product.tags && product.tags.length > 0 && (
              <div className="col-span-2 flex items-start gap-2">
                <Text strong className="!text-zinc-300 mt-1">Tags: </Text> 
                <div className="flex flex-wrap gap-1">
                  {product.tags.map(tag => <Tag key={tag} className="m-0 text-xs bg-zinc-800 text-zinc-300 border-zinc-700">{tag}</Tag>)}
                </div>
              </div>
            )}
          </div>

          <Divider titlePlacement="left" className="!mb-4 border-zinc-800">System Information</Divider>
          <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-xs text-zinc-400">
            <div>
              <Text strong className="block !text-zinc-400 mb-1">Created At</Text>
              {safeFormatDate(product.createdAt, 'dd MMM yyyy, hh:mm a')}
            </div>
            <div className="text-right">
              <Text strong className="block !text-zinc-400 mb-1">Last Updated</Text>
              {safeFormatDate(product.updatedAt, 'dd MMM yyyy, hh:mm a')}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailsModal;
