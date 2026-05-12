import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapPicker from "./MapPicker";
import { imageUploadApi, sellProductApi, ProductReq } from "../services/api";

type ProductForm = {
    title: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    price: string;
    isNegotiable: boolean;
    isStoreProduct: boolean;
    location: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
};

type Category = {
    categoryPkId: number;
    categoryName: string;
};

const API_URL = "http://bandookwale.eba-55irbrg4.ap-south-1.elasticbeanstalk.com"; // ← update if different

export default function SellProductPage() {
    const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
    const userNodeId = user?.nodeId;

    const navigate = useNavigate();

    // ─── State ───────────────────────────────────────────────────────────────────
    const [coords, setCoords] = useState({ lat: 0, lng: 0 });
    const [productImageIds, setProductImageIds] = useState<string[]>([]);
    const productImageIdsRef = useRef<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Category state ───────────────────────────────────────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);

    const [form, setForm] = useState<ProductForm>({
        title: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        price: "",
        isNegotiable: false,
        isStoreProduct: false,
        location: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
    });

    // ─── Fetch Categories from API ────────────────────────────────────────────────
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsCategoryLoading(true);
                const res = await fetch(
                    `${API_URL}/api/users/getCategory?filterBy=ACTIVE&page=0&size=20&inputPkId=null&inputFkId=null&searchValue=null`
                );
                const data = await res.json();

                console.log("Categories response:", data);

                // Handle common API response formats
                const list: Category[] =
                    Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.content)
                            ? data.content
                            : Array.isArray(data)
                                ? data
                                : [];

                setCategories(list);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            } finally {
                setIsCategoryLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // ─── Cancel ──────────────────────────────────────────────────────────────────
    const handleCancel = () => {
        const confirmLeave = window.confirm(
            "Are you sure you want to cancel? Your changes will be lost."
        );
        if (confirmLeave) navigate(-1);
    };

    // ─── Form Change ─────────────────────────────────────────────────────────────
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;
        setForm({
            ...form,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        });
    };

    // ─── Address Search ───────────────────────────────────────────────────────────
    const handleAddressSearch = async () => {
        const searchValue = form.zipCode || form.location;
        if (!searchValue) return;

        const isZip = /^\d{5,6}$/.test(searchValue);
        const query = isZip ? `${searchValue}, India` : searchValue;

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&q=${encodeURIComponent(query)}`
            );
            const data = await res.json();

            if (data.length === 0) {
                alert("Location not found. Try adding city/state or PIN code.");
                return;
            }

            const place = data[0];
            setCoords({
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lon),
            });
            setForm((prev) => ({
                ...prev,
                location: place.display_name,
                city: place.address?.city || place.address?.town || "",
                state: place.address?.state || "",
                zipCode: place.address?.postcode || searchValue,
                country: place.address?.country || "India",
            }));
        } catch (err) {
            alert("Error fetching location. Try again.");
        }
    };

    // ─── Image Upload ─────────────────────────────────────────────────────────────
    const handleImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (!userNodeId) {
            alert("You must be logged in to upload images.");
            return;
        }

        for (const file of files) {
            const localPreview = URL.createObjectURL(file);
            setImagePreviews((prev) => [...prev, localPreview]);

            try {
                setIsUploadingImage(true);

                const response = await imageUploadApi.uploadUserImage(userNodeId, file);
                console.log("Full upload response:", JSON.stringify(response));

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

                    console.log("Stored productImageId:", productImageId);
                } else {
                    console.warn("No productImageId in response:", response);
                    setImagePreviews((prev) => prev.filter((u) => u !== localPreview));
                    alert("Image uploaded but ID not received. Try again.");
                }
            } catch (error: any) {
                console.error("Image upload failed:", error);
                setImagePreviews((prev) => prev.filter((u) => u !== localPreview));

                if (error.message?.includes("413")) {
                    alert("Image too large. Please use an image under 2MB.");
                } else if (error.message?.includes("400")) {
                    alert("Invalid image format. Please use JPG or PNG.");
                } else {
                    alert(`Upload failed: ${error.message || "Please try again."}`);
                }
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

    // ─── Submit ───────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.title || !form.price || !form.categoryId) {
            alert("Please fill all required fields: Title, Price, Category");
            return;
        }

        if (isUploadingImage) {
            alert("Please wait for images to finish uploading.");
            return;
        }

        if (imagePreviews.some((url) => url.startsWith("blob:"))) {
            alert("Some images are still uploading. Please wait.");
            return;
        }

        const sellerId = userNodeId;
        if (!sellerId) {
            alert("You must be logged in to post an ad.");
            return;
        }

        console.log("productImageIdsRef at submit:", productImageIdsRef.current);

        const payload: ProductReq = {
            title: form.title,
            description: form.description,
            categoryId: Number(form.categoryId),
            subcategoryId: Number(form.subcategoryId),
            price: Number(form.price),
            isNegotiable: form.isNegotiable,
            sellerId,
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

        console.log("Submitting payload:", payload);

        try {
            setIsSubmitting(true);
            const response = await sellProductApi.add(payload);
            console.log("Product posted:", response);
            alert("Ad posted successfully!");
            navigate(-1);
        } catch (error: any) {
            console.error("Submit error:", error);
            alert(`Something went wrong: ${error.message || "Please try again."}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto p-6 mt-10 bg-transparent">
            <div className="bg-white rounded-xl shadow overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-black to-yellow-500">
                    <h2 className="text-lg font-semibold text-white">Post Your Ad</h2>
                    <button
                        onClick={handleCancel}
                        className="text-white/80 hover:text-white transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* FORM BODY */}
                <div className="p-6 space-y-6">

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

                    {/* Category — fetched from API */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            name="categoryId"
                            value={form.categoryId}
                            onChange={handleChange}
                            disabled={isCategoryLoading}
                            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2
                                       focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                {isCategoryLoading ? "Loading categories..." : "Select Category *"}
                            </option>
                            {categories.map((cat) => (
                                <option key={cat.categoryPkId} value={cat.categoryPkId}>
                                    {cat.categoryName}
                                </option>
                            ))}
                        </select>
                        {isCategoryLoading && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <span className="animate-spin inline-block">⏳</span>
                                Fetching categories...
                            </p>
                        )}
                        {!isCategoryLoading && categories.length === 0 && (
                            <p className="text-xs text-red-400 mt-1">
                                Failed to load categories. Please refresh the page.
                            </p>
                        )}
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

                    {/* Negotiable */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="isNegotiable"
                            checked={form.isNegotiable}
                            onChange={handleChange}
                            className="w-4 h-4 accent-yellow-500"
                        />
                        <span>Negotiable</span>
                    </label>

                    {/* IMAGE UPLOAD */}
                    <div className="space-y-3">
                        <label className="font-medium block">Product Images</label>

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            disabled={isUploadingImage}
                            className="w-full border p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        {isUploadingImage && (
                            <p className="text-sm text-yellow-600 flex items-center gap-2">
                                <span className="animate-spin inline-block">⏳</span>
                                Uploading image...
                            </p>
                        )}

                        {imagePreviews.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-2">
                                {imagePreviews.map((preview, i) => (
                                    <div key={i} className="relative w-24 h-24">
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
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* LOCATION */}
                    <div className="space-y-3">
                        <label className="font-medium block">Select Location *</label>

                        {/* <MapPicker
                            coords={coords}
                            onSelect={(data) => {
                                setCoords({ lat: data.lat, lng: data.lng });
                                setForm((prev) => ({
                                    ...prev,
                                    location: data.address,
                                    city: data.city,
                                    state: data.state,
                                    zipCode: data.zip,
                                    country: data.country,
                                }));
                            }}
                        /> */}

                        <div className="flex gap-2">
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="Search address"
                                className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <button
                                type="button"
                                onClick={handleAddressSearch}
                                className="px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                            >
                                Search
                            </button>
                        </div>

                        <input
                            name="zipCode"
                            value={form.zipCode}
                            onChange={handleChange}
                            placeholder="Enter PIN code"
                            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                value={form.city}
                                readOnly
                                placeholder="City"
                                className="border p-2 rounded-lg bg-gray-100 text-gray-500"
                            />
                            <input
                                value={form.state}
                                readOnly
                                placeholder="State"
                                className="border p-2 rounded-lg bg-gray-100 text-gray-500"
                            />
                        </div>

                        <input
                            value={form.country}
                            readOnly
                            placeholder="Country"
                            className="w-full border p-2 rounded-lg bg-gray-100 text-gray-500"
                        />
                    </div>

                    {/* SUBMIT */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isUploadingImage}
                        className="w-full py-3 text-white rounded-xl bg-gradient-to-r from-black to-yellow-500
                                   disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                    >
                        {isSubmitting ? "Posting..." : "Post Ad"}
                    </button>

                </div>
            </div>
        </div>
    );
}