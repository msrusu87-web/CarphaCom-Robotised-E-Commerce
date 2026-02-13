'use client';

import React, { useState, useEffect } from 'react';

interface TieredPrice {
  min_qty: number;
  max_qty: number | null;
  price: number;
}

interface Product {
  id: string;
  title: string;
  sku: string;
  rrp_price: number;
  tiered_pricing: TieredPrice[];
  description: string;
  stock_supplier: number;
  box_size: number;
}

export default function TieredPricingDemo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch test products
    const fetchProducts = async () => {
      try {
        const response = await fetch('/app/api/suppliers/mypni/import-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetch-products' })
        });
        
        // For demo, use hardcoded test products
        const demoProducts: Product[] = [
          {
            id: 'prod_test_radio_01',
            title: 'PNI HP 60 Radio Station',
            sku: 'PNI-HP60',
            rrp_price: 132,
            description: 'Professional CB radio station',
            stock_supplier: 930,
            box_size: 20,
            tiered_pricing: [
              { min_qty: 1, max_qty: 2, price: 100 },
              { min_qty: 3, max_qty: 4, price: 98 },
              { min_qty: 5, max_qty: 9, price: 95 },
              { min_qty: 10, max_qty: 19, price: 93 },
              { min_qty: 20, max_qty: null, price: 90 }
            ]
          },
          {
            id: 'prod_test_mic_01',
            title: 'PNI CB Microphone 4-Pin',
            sku: 'PNI-MIC4PIN',
            rrp_price: 85,
            description: 'Professional microphone with 4-pin connector',
            stock_supplier: 150,
            box_size: 10,
            tiered_pricing: [
              { min_qty: 1, max_qty: 4, price: 65 },
              { min_qty: 5, max_qty: 9, price: 62 },
              { min_qty: 10, max_qty: 19, price: 60 },
              { min_qty: 20, max_qty: null, price: 58 }
            ]
          },
          {
            id: 'prod_test_suport_01',
            title: 'PNI Magnetic Antenna Mount',
            sku: 'PNI-SUPORT-MAG',
            rrp_price: 45,
            description: 'Magnetic mount for CB antennas',
            stock_supplier: 500,
            box_size: 50,
            tiered_pricing: [
              { min_qty: 1, max_qty: 9, price: 35 },
              { min_qty: 10, max_qty: 24, price: 33 },
              { min_qty: 25, max_qty: null, price: 31 }
            ]
          }
        ];

        setProducts(demoProducts);
        
        // Initialize quantities
        const initialQty: Record<string, number> = {};
        demoProducts.forEach(p => {
          initialQty[p.id] = 1;
        });
        setSelectedQty(initialQty);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getPriceForQuantity = (tieredPricing: TieredPrice[], qty: number) => {
    let price = tieredPricing[0].price; // default
    for (const tier of tieredPricing) {
      if (qty >= tier.min_qty && (!tier.max_qty || qty <= tier.max_qty)) {
        price = tier.price;
        break;
      }
    }
    return price;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  if (loading) {
    return <div className="text-center py-20">Loading products...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            📦 Tiered Pricing Demo
          </h1>
          <p className="text-slate-300 text-lg">
            Products with dynamic quantity-based pricing. RRP (Recommended Retail Price) adjusts based on the ordered quantity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {products.map(product => {
            const qty = selectedQty[product.id] || 1;
            const currentPrice = getPriceForQuantity(product.tiered_pricing, qty);
            const total = currentPrice * qty;

            return (
              <div
                key={product.id}
                className="bg-slate-800/80 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-2">{product.title}</h2>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">SKU: {product.sku}</span>
                    <span className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                      RRP: {formatPrice(product.rrp_price)} RON
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  {/* Description */}
                  <p className="text-slate-400 text-sm">{product.description}</p>

                  {/* Stock Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Stock</p>
                      <p className="text-lg font-bold text-green-400">{product.stock_supplier} pcs</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Box</p>
                      <p className="text-lg font-bold text-blue-400">{product.box_size} pcs/box</p>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Order quantity:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) =>
                          setSelectedQty(prev => ({
                            ...prev,
                            [product.id]: Math.max(1, parseInt(e.target.value) || 1)
                          }))
                        }
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-slate-400 py-2 px-3">pcs</span>
                    </div>
                  </div>

                  {/* Tiered Pricing Table */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                      Price by Quantity (Excl. VAT)
                    </p>
                    <div className="space-y-2">
                      {product.tiered_pricing.map((tier, idx) => {
                        const isSelected = qty >= tier.min_qty && (!tier.max_qty || qty <= tier.max_qty);
                        const rangeLabel = tier.max_qty
                          ? `${tier.min_qty}-${tier.max_qty} pcs`
                          : `${tier.min_qty}+ pcs`;

                        return (
                          <div
                            key={idx}
                            className={`flex justify-between items-center p-3 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-green-600/20 border border-green-500/50'
                                : 'bg-slate-900/30 border border-slate-700/30'
                            }`}
                          >
                            <span className={`text-sm ${isSelected ? 'text-green-300 font-semibold' : 'text-slate-400'}`}>
                              {rangeLabel}
                            </span>
                            <span className={`font-bold ${isSelected ? 'text-green-400 text-lg' : 'text-slate-300'}`}>
                              {formatPrice(tier.price)} RON
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Price Display */}
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Unit price for {qty} pcs:</p>
                        <p className="text-3xl font-bold text-green-400">{formatPrice(currentPrice)} RON</p>
                      </div>
                      {currentPrice < product.rrp_price && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Discount vs RRP:</p>
                          <p className="text-lg font-bold text-green-400">
                            -{formatPrice(product.rrp_price - currentPrice)} RON
                          </p>
                          <p className="text-xs text-green-300">
                            {Math.round(((product.rrp_price - currentPrice) / product.rrp_price) * 100)}% off
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t border-green-500/30 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Total (excl. VAT):</span>
                        <span className="text-2xl font-bold text-green-300">{formatPrice(total)} RON</span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95">
                    🛒 Add to Cart ({qty} pcs)
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
          <h3 className="text-xl font-bold mb-4 text-slate-200">ℹ️ How Does Tiered Pricing Work?</h3>
          <div className="grid md:grid-cols-3 gap-6 text-slate-300">
            <div>
              <p className="font-semibold text-blue-400 mb-2">1️⃣ Small Quantity (1-2)</p>
              <p className="text-sm">Higher price, for small orders only. Ideal for testing.</p>
            </div>
            <div>
              <p className="font-semibold text-green-400 mb-2">2️⃣ Medium Quantity (5-10)</p>
              <p className="text-sm">Reduced price. Progressive discount for larger orders.</p>
            </div>
            <div>
              <p className="font-semibold text-cyan-400 mb-2">3️⃣ Large Quantity (20+)</p>
              <p className="text-sm">Wholesale price. Best offer for bulk orders.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
