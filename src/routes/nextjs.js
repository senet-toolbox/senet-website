// components/ProductCard.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Reactive effect - updates when product changes
  useEffect(() => {
    setCartCount(product.cartQuantity || 0);
  }, [product.cartQuantity]);

  const handleAddToCart = async () => {
    setIsLoading(true);
    await onAddToCart(product.id);
    setCartCount(prev => prev + 1);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <Image src={product.image} alt={product.name} width={200} height={200} className="w-full h-48 object-cover rounded mb-4" />
      
      <Link href={`/products/${product.id}`} className="block mb-2">
        <h3 className="font-semibold text-lg hover:text-blue-600">{product.name}</h3>
      </Link>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-bold">${product.price}</span>
        {cartCount > 0 && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">In cart: {cartCount}</span>}
      </div>
      
      <button onClick={handleAddToCart} disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-300">
        {isLoading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
};
