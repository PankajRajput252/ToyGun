import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { imageUploadApi, sellProductApi, ProductReq } from "../services/api";
import { AlertTriangle, Check } from "lucide-react";
import { SHOOTING_CATEGORIES } from "./shootingCategories";

type ProductForm = {
    title: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    price: string;
    isNegotiable: boolean;
    quantity: string;
    isStoreProduct: boolean;
    location: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
};

export default function AdminSellProductPage() {
    const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
    const userNodeId = user?.nodeId;

    const navigate = useNavigate();
    const routerLocation = useLocation();

    // ─── Edit Mode Detection ──────────────────────────────────────────────────────
    // Pass existing product via router state: navigate('/admin/sell', { state: { product } })
    const existingProduct = routerLocation.state?.product || null;
    const isEditMode = !!existingProduct;
    const editProductId = existingProduct?.productPkId || existingProduct?.id || null;

    // ─── State ───────────────────────────────────────────────────────────────────
    const [coords, setCoords] = useState({ lat: 0, lng: 0 });
    const [productImageIds, setProductImageIds] = useState<string[]>([]);
    const productImageIdsRef = useRef<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [popup, setPopup] = useState({
        open: false,
        title: "",
        message: "",
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [form, setForm] = useState<ProductForm>({
        title: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        price: "",
        isNegotiable: false,
        quantity: "1",
        isStoreProduct: true,
        location: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
    });
    const showPopup = (title: string, message: string) => {
        setPopup({
            open: true,
            title,
            message,
        });
    };
    // ─── Pre-fill form in edit mode ───────────────────────────────────────────────
    useEffect(() => {
        if (!isEditMode || !existingProduct) return;

        setForm({
            title: existingProduct.title || "",
            description: existingProduct.description || "",
            categoryId: existingProduct.categoryId?.toString() || "",
            subcategoryId: existingProduct.subcategoryId?.toString() || "",
            price: existingProduct.price?.toString() || "",
            isNegotiable: existingProduct.isNegotiable || false,
            quantity: existingProduct.productQuantity?.toString() || "1",
            isStoreProduct: true,
            location: existingProduct.location || "",
            city: existingProduct.city || "",
            state: existingProduct.state || "",
            zipCode: existingProduct.zipCode || "",
            country: existingProduct.country || "India",
        });

        setCoords({
            lat: existingProduct.latitude || 0,
            lng: existingProduct.longitude || 0,
        });

        // Pre-fill existing images
        if (existingProduct.productImageList?.length) {
            const ids = existingProduct.productImageList.map(
                (img: any) => img.productImageId
            );
            setProductImageIds(ids);
            productImageIdsRef.current = ids;
            setImagePreviews(ids.map((id: string) => `uploaded:${id}`));
        }
    }, [isEditMode]);

    // ─── Hardcoded categories (see shootingCategories.ts) ─────────────────────────
    // "Category" is the top-level group; "Subcategory" lists its categories and their sub-items
    const selectedGroup = SHOOTING_CATEGORIES.find((g) => g.id === Number(form.categoryId));
    const subCategoryOptions = (selectedGroup?.categories ?? []).flatMap((cat) => [
        { id: cat.id, label: cat.name },
        ...(cat.subcategories ?? []).map((sub) => ({ id: sub.id, label: `    ${sub.name}` })),
    ]);
    const confirmCancel = () => {
        setShowCancelModal(false);
        navigate(-1);
    };

    // ─── Cancel ──────────────────────────────────────────────────────────────────
    const handleCancel = () => {
        setShowCancelModal(true);
    };

    // ─── Form Change ─────────────────────────────────────────────────────────────
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
            // a new category invalidates the previously picked subcategory
            ...(name === "categoryId" ? { subcategoryId: "" } : {}),
        });
    };

    // ─── Image Upload ─────────────────────────────────────────────────────────────
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (!userNodeId) { alert("You must be logged in to upload images."); return; }

        for (const file of files) {
            const localPreview = URL.createObjectURL(file);
            setImagePreviews((prev) => [...prev, localPreview]);

            try {
                setIsUploadingImage(true);
                const response = await imageUploadApi.uploadImage(userNodeId, file);
                const productImageId = response?.message;

                if (productImageId) {
                    setProductImageIds((prev) => {
                        const updated = [...prev, productImageId];
                        productImageIdsRef.current = updated;
                        return updated;
                    });
                    setImagePreviews((prev) =>
                        prev.map((u) => (u === localPreview ? `uploaded:${productImageId}` : u))
                    );
                } else {
                    setImagePreviews((prev) => prev.filter((u) => u !== localPreview));
                    alert("Image uploaded but ID not received. Try again.");
                }
            } catch (error: any) {
                console.error("Image upload failed:", error);
                setImagePreviews((prev) => prev.filter((u) => u !== localPreview));
                if (error.message?.includes("413")) alert("Image too large. Please use an image under 2MB.");
                else if (error.message?.includes("400")) alert("Invalid image format. Please use JPG or PNG.");
                else alert(`Upload failed: ${error.message || "Please try again."}`);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const removeImage = (index: number) => {
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        setProductImageIds((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            productImageIdsRef.current = updated;
            return updated;
        });
    };

    // ─── Submit (Add or Update) ───────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.title || !form.price || !form.categoryId) {
            showPopup(
                "Missing Required Fields",
                "Please fill all required fields: Title, Price and Category."
            );
            return;
        }
        if (!/^[1-9]\d*$/.test(form.quantity)) {
            showPopup("Invalid Quantity", "Product quantity must be a whole number of at least 1.");
            return;
        }
        if (isUploadingImage) {
            showPopup(
                "Images Uploading",
                "Please wait for all images to finish uploading."
            ); return;
        }
        if (imagePreviews.some((url) => url.startsWith("blob:"))) {
            showPopup(
                "Upload In Progress",
                "Some images are still uploading. Please wait."
            ); return;
        }
        if (!userNodeId) {
            showPopup(
                "Login Required",
                "You must be logged in to post an ad."
            ); return;
        }

        const payload: ProductReq = {
            title: form.title,
            description: form.description,
            categoryId: Number(form.categoryId),
            subcategoryId: form.subcategoryId ? Number(form.subcategoryId) : null,
            price: Number(form.price),
            isNegotiable: false,
            productQuantity: Number(form.quantity),
            isStoreProduct: true,
            sellerId: userNodeId,
            location: form.location,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country,
            status: "LIVE",
            createdAt: "",
            updatedAt: "",
            latitude: coords.lat,
            longitude: coords.lng,
            productImageList: productImageIdsRef.current.map((id) => ({
                productImageId: id,
                productFkId: null,
                profileImageUrl: null,
            })),
        };

        try {
            setIsSubmitting(true);
            if (isEditMode && editProductId) {
                await sellProductApi.update(editProductId, payload);
                showPopup(
                    "Success",
                    "Product updated successfully!"
                );

                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            } else {
                await sellProductApi.add(payload);

                showPopup(
                    "Success",
                    "Product posted successfully!"
                );

                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            }
        } catch (error: any) {
            console.error("Submit error:", error);
            showPopup(
                "Error",
                `Something went wrong: ${error.message || "Please try again."}`
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    const confirmSubmit = async () => {
        setShowConfirmModal(false);
        await handleSubmit();
    };
    // ─── Delete ───────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!editProductId) return;
        try {
            setIsDeleting(true);
            await sellProductApi.delete(editProductId);
            showPopup("Success", "Product deleted successfully!");
            navigate(-1);
        } catch (error: any) {
            console.error("Delete error:", error);
            showPopup("Error", `Failed to delete: ${error.message || "Please try again."}`);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <>
            {showCancelModal && (
                <div
                    className="fixed inset-0 z-[9998] flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.7)" }}
                >
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex justify-center mb-4">
                            <AlertTriangle
                                className="w-10 h-10 text-yellow-400"
                                strokeWidth={3}
                            />
                        </div>

                        <h3 className="text-white text-lg font-semibold text-center">
                            Cancel Changes?
                        </h3>

                        <p className="text-gray-400 mt-2 text-center">
                            Are you sure you want to leave? All unsaved changes will be lost.
                        </p>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-2 rounded-lg bg-gray-700 text-white"
                            >
                                Stay
                            </button>

                            <button
                                onClick={confirmCancel}
                                className="flex-1 py-2 rounded-lg bg-red-500 text-white"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {popup.open && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.7)" }}
                    onClick={() =>
                        setPopup({
                            open: false,
                            title: "",
                            message: "",
                        })
                    }
                >
                    <div
                        className="w-full max-w-sm mx-4 rounded-2xl p-6"
                        style={{
                            background: "#1a1a1a",
                            border: "1px solid #2a2a2a",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                style={{ background: "#2d1515" }}
                            >
                                <AlertTriangle
                                    className="w-7 h-7 text-yellow-400"
                                    strokeWidth={3}
                                />
                            </div>

                            <h3 className="text-lg font-semibold text-white">
                                {popup.title}
                            </h3>

                            <p className="text-sm text-gray-400 mt-2">
                                {popup.message}
                            </p>

                            <button
                                onClick={() =>
                                    setPopup({
                                        open: false,
                                        title: "",
                                        message: "",
                                    })
                                }
                                className="w-full mt-5 py-2 rounded-lg font-medium"
                                style={{
                                    background: "#c9931a",
                                    color: "#fff",
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showConfirmModal && (
                <div
                    className="fixed inset-0 z-[9998] flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.7)" }}
                >
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex justify-center mb-4">
                            <Check
                                className="w-10 h-10 text-green-500"
                                strokeWidth={3}
                            />
                        </div>

                        <h3 className="text-white text-lg font-semibold text-center">
                            {isEditMode ? "Update Product?" : "Post Product?"}
                        </h3>

                        <p className="text-gray-400 mt-2 text-center">
                            {isEditMode
                                ? "Are you sure you want to update this product?"
                                : "Are you sure you want to post this product?"}
                        </p>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-2 rounded-lg bg-gray-700 text-white"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmSubmit}
                                className="flex-1 py-2 rounded-lg bg-yellow-500 text-white"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-4xl mx-auto p-3 sm:p-6 mt-10 bg-transparent">

                {/* ── Delete Confirmation Modal ── */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                                    🗑️
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Delete Product?</h3>
                                <p className="text-sm text-gray-500">
                                    This action cannot be undone. The product will be permanently removed.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700
                                           hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium
                                           hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow border-2 border-[#f5b301] overflow-hidden">

                    {/* HEADER */}
                    <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4  bg-[#111827] border-b-2 border-[#f5b301]">
                        <h2 className="text-base sm:text-lg font-semibold text-white">
                            {isEditMode ? "Edit Store Product" : "Post Store Product"}
                        </h2>
                        <div className="flex items-center gap-3">
                            {/* Delete button — only in edit mode */}
                            {isEditMode && (
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={isDeleting}
                                    title="Delete product"
                                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white
                                           text-sm px-3 py-1.5 rounded-lg transition disabled:opacity-50
                                           disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            )}
                            <button onClick={handleCancel} className="text-white/80 hover:text-white transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Store Product Badge */}
                    <div className="px-4 sm:px-6 pt-4">
                        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200
                                    rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm text-yellow-700 font-medium">
                            🛒 This product will be listed as a <strong>Store Product</strong> — buyers can add to cart and checkout.{/* pay via Razorpay */}
                        </div>
                    </div>

                    {/* FORM BODY */}
                    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">

                        {/* Title */}
                        <input
                            name="title"
                            placeholder="Title *"
                            value={form.title}
                            onChange={handleChange}
                            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />

                        {/* Description */}
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={form.description}
                            onChange={handleChange}
                            className="w-full border p-2 rounded-lg h-28 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />

                        {/* Category + Subcategory */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category *
                                </label>
                                <select
                                    name="categoryId"
                                    value={form.categoryId}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2
                                           focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Category *</option>
                                    {SHOOTING_CATEGORIES.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subcategory */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subcategory
                                </label>
                                <select
                                    name="subcategoryId"
                                    value={form.subcategoryId}
                                    onChange={handleChange}
                                    disabled={!form.categoryId || subCategoryOptions.length === 0}
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2
                                           focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {!form.categoryId
                                            ? "Select a category first"
                                            : subCategoryOptions.length === 0
                                                ? "No subcategories available"
                                                : "Select Subcategory"}
                                    </option>
                                    {subCategoryOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {!form.categoryId && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Select a category to see subcategories
                                    </p>
                                )}
                                {form.categoryId && subCategoryOptions.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        No subcategories for this category
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Price */}
                        <input
                            type="number"
                            name="price"
                            placeholder="Price *"
                            value={form.price}
                            onChange={handleChange}
                            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />

                        {/* Quantity */}
                        <div>
                            <label htmlFor="quantity" className="font-medium block mb-1">Product Quantity *</label>
                            <input
                                id="quantity"
                                type="number"
                                name="quantity"
                                min={1}
                                step={1}
                                inputMode="numeric"
                                placeholder="Number of items available"
                                value={form.quantity}
                                onChange={handleChange}
                                className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                        </div>

                        {/* IMAGE UPLOAD */}
                        <div className="space-y-3">
                            <label className="font-medium block">Product Images</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                disabled={isUploadingImage}
                                className="w-full min-w-0 text-sm border p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {isUploadingImage && (
                                <p className="text-sm text-yellow-600 flex items-center gap-2">
                                    <span className="animate-spin inline-block">⏳</span> Uploading image...
                                </p>
                            )}
                            {imagePreviews.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {imagePreviews.map((preview, i) => (
                                        <div key={i} className="relative w-20 h-20 sm:w-24 sm:h-24">
                                            {preview.startsWith("blob:") ? (
                                                <div className="w-full h-full rounded-lg border bg-gray-100
                                                            flex items-center justify-center text-xs text-gray-400 animate-pulse">
                                                    uploading...
                                                </div>
                                            ) : (
                                                <div className="w-full h-full rounded-lg border border-green-300 bg-green-50
                                                            flex flex-col items-center justify-center gap-1 p-1">
                                                    <span className="text-xl">✅</span>
                                                    <span className="text-[10px] text-gray-400 truncate w-full text-center">
                                                        {productImageIds[i]?.slice(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                disabled={preview.startsWith("blob:")}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full
                                                       w-5 h-5 text-xs flex items-center justify-center
                                                       disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* LOCATION */}
                        {/* <div className="space-y-3">
                            <label className="font-medium block">Location</label>

                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="Address"
                                className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <input
                                    name="zipCode"
                                    value={form.zipCode}
                                    onChange={handleChange}
                                    placeholder="PIN Code"
                                    className="w-full min-w-0 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className="w-full min-w-0 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <input
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    placeholder="State"
                                    className="w-full min-w-0 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    placeholder="Country"
                                    className="w-full min-w-0 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>
                        </div> */}

                        {/* SUBMIT */}
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isSubmitting || isUploadingImage}
                            className="w-full py-3 text-white font-semibold rounded-xl bg-[#111827] border-2 border-[#f5b301]
                                   disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                        >
                            {isSubmitting
                                ? isEditMode ? "Updating..." : "Posting..."
                                : isEditMode ? "Update Product" : "Post Store Product"}
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
}