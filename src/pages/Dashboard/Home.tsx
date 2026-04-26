import React, { useEffect, useState } from "react";
import Footer from "../../components/footer/Footer";
import CategoryFilterBar from "../CategoryFilterBar";
import CategoryGrid from "../CategoryGrid";
import ProductCard from "../ProductCard";
import { sellProductApi, ProductResponse } from "../../services/api"

export interface Product {
    images: string[];
  price: number,
  title: string,
  location: string,
  date: string,
  isNegotiable: boolean,
}
export default function Home() {

  const [isLoading, setIsLoading] = useState<boolean>(false);
const [products, setProducts] = useState<Product[]>([]);


  const fetchProductData = async () => {
  try {
    setIsLoading(true);

    const response = await sellProductApi.getAll(0, 25, 'ACTIVE', null);

    const mappedProducts = response.content.map((item: any) => ({
      images:
        item.productImageList?.length > 0
          ? item.productImageList.map((img: any) => img.profileImageUrl)
          : ["https://via.placeholder.com/300"],

      price: item.price,
      title: item.title,
      location: `${item.city}, ${item.state}`,
      date: item.createdDatetime
        ? new Date(item.createdDatetime).toLocaleDateString()
        : "Today",
        isNegotiable:item.isNegotiable
    }));

    setProducts(mappedProducts);

    console.log("Mapped Products -->", mappedProducts);

  } catch (error) {
    console.error("Error fetching products:", error);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchProductData();
  }, []);

  return (
    <>
      {/* Main Layout Container */}
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">

        <CategoryFilterBar />

        <main >
          <div >
            <CategoryGrid />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 my-8 mx-8 gap-4">
              {products.map((item, index) => (
                <ProductCard key={index} item={item} />
              ))}
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </>
  );
}