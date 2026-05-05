import { Product } from "./ProductCard";
export function mapApiToProduct(p: any): Product {
  return {
    id: p.productPkId,
    title: p.productName,
    price: p.price,
    location: p.location,
    date: p.createdDateTime,

    images:
      Array.isArray(p.productImageList) && p.productImageList.length > 0
        ? p.productImageList.map((img: any) => img.profileImageUrl).filter(Boolean)
        : ["https://via.placeholder.com/300"],

    isStoreProduct: p.isStoreProduct,
    isNegotiable: p.negotiable,
    description: p.notesGlinBigTxt,
    sellerId: p.userFkId,
    sellerName: p.userName,
  };
}