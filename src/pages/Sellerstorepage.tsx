import AdminSellerStorePage from "./AdminSellerStorePage";

// Same store layout as the admin page, without the post/upload actions
export default function SellerStorePage() {
  return <AdminSellerStorePage allowPosting={false} />;
}
