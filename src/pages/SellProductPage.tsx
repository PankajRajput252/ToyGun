import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { imageUploadApi, sellProductApi, ProductReq } from "../services/api";
import { AlertTriangle } from "lucide-react";

type ProductForm = {
    title: string;
    description: string;
    weaponCategoryFkId: string;
    weaponTypeFkId: string;
    weaponSubTypeFkId: string;
    caliberFkId: string;
    licenseRequired: boolean;
    price: string;
    isNegotiable: boolean;
    isStoreProduct: boolean;
    location: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
};

// NOTE: WeaponCategory field names confirmed from actual API response.
// WeaponType / WeaponSubType / Caliber are ASSUMED to follow the same
// "*PkId" / "*Name" pattern — please verify against real responses from
// getWeaponType / getWeaponSubType / getCaliber and adjust if different.
type WeaponCategory = { weaponCategoryPkId: number; weaponCategoryName: string };
type WeaponType      = { weaponTypePkId: number;     weaponTypeName: string };
type WeaponSubType   = { weaponSubTypePkId: number;  weaponSubTypeName: string };
type Caliber         = { caliberPkId: number;        caliberName: string };

const API_URL = "https://api.bandookwale.in";

const EMPTY_FORM: ProductForm = {
    title: "", description: "",
    weaponCategoryFkId: "", weaponTypeFkId: "",
    weaponSubTypeFkId: "", caliberFkId: "",
    licenseRequired: false,
    price: "", isNegotiable: false, isStoreProduct: false,
    location: "", city: "", state: "", zipCode: "", country: "India",
};

export default function SellProductPage() {
    const user       = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
    const userNodeId = user?.nodeId;
    const navigate   = useNavigate();

    // ── popup ────────────────────────────────────────────────────────────────────
    const [popup, setPopup] = useState({ open: false, title: "", message: "" });
    const showPopup = (title: string, message: string) =>
        setPopup({ open: true, title, message });
    const closePopup = () => setPopup({ open: false, title: "", message: "" });

    // ── misc state ───────────────────────────────────────────────────────────────
    const [coords, setCoords]               = useState({ lat: 0, lng: 0 });
    const [productImageIds, setProductImageIds] = useState<string[]>([]);
    const productImageIdsRef                = useRef<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSubmitting, setIsSubmitting]   = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal,  setShowCancelModal]  = useState(false);

    // ── dropdown data ─────────────────────────────────────────────────────────────
    const [weaponCategories, setWeaponCategories] = useState<WeaponCategory[]>([]);
    const [weaponTypes,      setWeaponTypes]      = useState<WeaponType[]>([]);
    const [weaponSubTypes,   setWeaponSubTypes]   = useState<WeaponSubType[]>([]);
    const [calibers,         setCalibersState]    = useState<Caliber[]>([]);

    const [loadingCat,    setLoadingCat]    = useState(false);
    const [loadingType,   setLoadingType]   = useState(false);
    const [loadingSubType,setLoadingSubType]= useState(false);
    const [loadingCal,    setLoadingCal]    = useState(false);

    // ── form ──────────────────────────────────────────────────────────────────────
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

    // helper to extract array from varied API shapes
    const toArray = <T,>(data: any): T[] =>
        Array.isArray(data?.data)    ? data.data    :
        Array.isArray(data?.content) ? data.content :
        Array.isArray(data)          ? data          : [];

    // ── 1. Fetch Weapon Categories on mount ───────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                setLoadingCat(true);
                const res  = await fetch(`${API_URL}/api/users/getWeaponCategory`);
                const data = await res.json();
                setWeaponCategories(toArray<WeaponCategory>(data));
            } catch (e) { console.error(e); }
            finally { setLoadingCat(false); }
        })();
    }, []);

    // ── 2. Fetch Weapon Types when category changes ───────────────────────────────
    useEffect(() => {
        setWeaponTypes([]);
        setWeaponSubTypes([]);
        setCalibersState([]);
        setForm(prev => ({ ...prev, weaponTypeFkId: "", weaponSubTypeFkId: "", caliberFkId: "" }));

        if (!form.weaponCategoryFkId) return;
        (async () => {
            try {
                setLoadingType(true);
                const res  = await fetch(
                    `${API_URL}/api/users/getWeaponType?weaponCategoryId=${form.weaponCategoryFkId}`
                );
                const data = await res.json();
                setWeaponTypes(toArray<WeaponType>(data));
            } catch (e) { console.error(e); }
            finally { setLoadingType(false); }
        })();
    }, [form.weaponCategoryFkId]);

    // ── 3. Fetch Sub Types + Calibers when type changes ───────────────────────────
    useEffect(() => {
        setWeaponSubTypes([]);
        setCalibersState([]);
        setForm(prev => ({ ...prev, weaponSubTypeFkId: "", caliberFkId: "" }));

        if (!form.weaponTypeFkId) return;
        (async () => {
            try {
                setLoadingSubType(true);
                setLoadingCal(true);

                const [subRes, calRes] = await Promise.all([
                    fetch(`${API_URL}/api/users/getWeaponSubType?weaponTypeId=${form.weaponTypeFkId}`),
                    fetch(`${API_URL}/api/users/getCaliberMaster?weaponTypeId=${form.weaponTypeFkId}`),
                ]);

                const [subData, calData] = await Promise.all([subRes.json(), calRes.json()]);
                setWeaponSubTypes(toArray<WeaponSubType>(subData));
                setCalibersState(toArray<Caliber>(calData));
            } catch (e) { console.error(e); }
            finally { setLoadingSubType(false); setLoadingCal(false); }
        })();
    }, [form.weaponTypeFkId]);

    // ── handlers ──────────────────────────────────────────────────────────────────
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleCancel  = () => setShowCancelModal(true);
    const confirmCancel = () => { setShowCancelModal(false); navigate(-1); };

    const handleAddressSearch = async () => {
        const searchValue = form.zipCode || form.location;
        if (!searchValue) return;
        const isZip  = /^\d{5,6}$/.test(searchValue);
        const query  = isZip ? `${searchValue}, India` : searchValue;
        try {
            const res  = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (!data.length) { alert("Location not found."); return; }
            const place = data[0];
            setCoords({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
            setForm(prev => ({
                ...prev,
                location: place.display_name,
                city:     place.address?.city || place.address?.town || "",
                state:    place.address?.state || "",
                zipCode:  place.address?.postcode || searchValue,
                country:  place.address?.country || "India",
            }));
        } catch { alert("Error fetching location."); }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (!userNodeId) { alert("You must be logged in."); return; }

        for (const file of files) {
            const localPreview = URL.createObjectURL(file);
            setImagePreviews(prev => [...prev, localPreview]);
            try {
                setIsUploadingImage(true);
                const response       = await imageUploadApi.uploadImage(userNodeId, file);
                const productImageId = response?.message;
                if (productImageId) {
                    setProductImageIds(prev => {
                        const updated = [...prev, productImageId];
                        productImageIdsRef.current = updated;
                        return updated;
                    });
                    setImagePreviews(prev =>
                        prev.map(u => u === localPreview ? `uploaded:${productImageId}` : u)
                    );
                } else {
                    setImagePreviews(prev => prev.filter(u => u !== localPreview));
                    alert("Image uploaded but ID not received.");
                }
            } catch (error: any) {
                setImagePreviews(prev => prev.filter(u => u !== localPreview));
                if      (error.message?.includes("413")) alert("Image too large. Use under 2MB.");
                else if (error.message?.includes("400")) alert("Invalid format. Use JPG or PNG.");
                else alert(`Upload failed: ${error.message || "Please try again."}`);
            } finally { setIsUploadingImage(false); }
        }
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setProductImageIds(prev => {
            const updated = prev.filter((_, i) => i !== index);
            productImageIdsRef.current = updated;
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!form.title || !form.price || !form.weaponCategoryFkId) {
            showPopup("Missing Required Fields", "Please fill Title, Price and Weapon Category.");
            return;
        }
        if (isUploadingImage) {
            showPopup("Images Uploading", "Please wait for all images to finish uploading.");
            return;
        }
        if (imagePreviews.some(url => url.startsWith("blob:"))) {
            showPopup("Upload In Progress", "Some images are still uploading.");
            return;
        }
        if (!userNodeId) {
            showPopup("Login Required", "You must be logged in to post an ad.");
            return;
        }

        const payload: ProductReq = {
            title:              form.title,
            description:        form.description,
            weaponCategoryFkId: Number(form.weaponCategoryFkId),
            weaponTypeFkId:     form.weaponTypeFkId    ? Number(form.weaponTypeFkId)    : null,
            weaponSubTypeFkId:  form.weaponSubTypeFkId ? Number(form.weaponSubTypeFkId) : null,
            caliberFkId:        form.caliberFkId       ? Number(form.caliberFkId)       : null,
            licenseRequired:    form.licenseRequired,
            price:              Number(form.price),
            isNegotiable:       form.isNegotiable,
            isStoreProduct:     form.isStoreProduct,
            sellerId:           userNodeId,
            location:           form.location,
            city:               form.city,
            state:              form.state,
            zipCode:            form.zipCode,
            country:            form.country,
            status:             "LIVE",
            createdAt:          "",
            updatedAt:          "",
            latitude:           coords.lat,
            longitude:          coords.lng,
            // FIX: previously referenced an undefined `productImageId` variable
            // instead of the `id` from the map callback — this would throw at
            // submit time. Now correctly maps each id.
            productImageList:   productImageIdsRef.current.map(id => ({
                productImageId: id, productFkId: null, profileImageUrl: null,
            })),
        };

        try {
            setIsSubmitting(true);
            await sellProductApi.add(payload);
            showPopup("Success", "Your ad has been posted successfully!");
            setTimeout(() => navigate(-1), 2000);
        } catch (error: any) {
            showPopup("Error", `Something went wrong: ${error.message || "Please try again."}`);
        } finally { setIsSubmitting(false); }
    };

    const confirmSubmit = async () => { setShowConfirmModal(false); await handleSubmit(); };

    // ── small reusable select ─────────────────────────────────────────────────────
    const Select = ({
        name, value, onChange, disabled, placeholder, children,
    }: {
        name: string; value: string;
        onChange: React.ChangeEventHandler<HTMLSelectElement>;
        disabled?: boolean; placeholder: string; children: React.ReactNode;
    }) => (
        <select
            name={name} value={value} onChange={onChange} disabled={disabled}
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2
                       focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <option value="">{placeholder}</option>
            {children}
        </select>
    );

    // ── render ────────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Cancel Modal ── */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center"
                     style={{ background: "rgba(0,0,0,0.7)" }}>
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex justify-center mb-4">
                            <AlertTriangle className="w-10 h-10 text-yellow-400" strokeWidth={3} />
                        </div>
                        <h3 className="text-white text-lg font-semibold text-center">Cancel Changes?</h3>
                        <p className="text-gray-400 mt-2 text-center">
                            Are you sure you want to leave? All unsaved changes will be lost.
                        </p>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-2 rounded-lg bg-gray-700 text-white">Stay</button>
                            <button onClick={confirmCancel}
                                    className="flex-1 py-2 rounded-lg bg-red-500 text-white">Leave</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Generic Popup ── */}
            {popup.open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center"
                     style={{ background: "rgba(0,0,0,0.7)" }} onClick={closePopup}>
                    <div className="w-full max-w-sm mx-4 rounded-2xl p-6"
                         style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                         onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                 style={{ background: "#2d1515" }}>
                                <AlertTriangle className="w-7 h-7 text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{popup.title}</h3>
                            <p className="text-sm text-gray-400 mt-2">{popup.message}</p>
                            <button onClick={closePopup}
                                    className="w-full mt-5 py-2 rounded-lg font-medium"
                                    style={{ background: "#c9931a", color: "#fff" }}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Post Modal ── */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center"
                     style={{ background: "rgba(0,0,0,0.7)" }}>
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm mx-4">
                        <h3 className="text-white text-lg font-semibold">Post Advertisement?</h3>
                        <p className="text-gray-400 mt-2">Are you sure you want to post this ad?</p>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-2 rounded-lg bg-gray-700 text-white">Cancel</button>
                            <button onClick={confirmSubmit}
                                    className="flex-1 py-2 rounded-lg bg-yellow-500 text-white">Yes, Post</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Page ── */}
            <div className="max-w-4xl mx-auto p-6 mt-20 bg-transparent">
                <div className="bg-white rounded-xl shadow overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-black to-yellow-500">
                        <h2 className="text-lg font-semibold text-white">Post Your Ad</h2>
                        <button onClick={handleCancel} className="text-white/80 hover:text-white transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-6">

                        {/* Title */}
                        <input name="title" placeholder="Title *" value={form.title}
                               onChange={handleChange}
                               className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />

                        {/* Description */}
                        <textarea name="description" placeholder="Description" value={form.description}
                                  onChange={handleChange}
                                  className="w-full border p-2 rounded-lg h-28 focus:outline-none focus:ring-2 focus:ring-yellow-400" />

                        {/* ── Weapon dropdowns (2-column grid) ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Weapon Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weapon Category *
                                </label>
                                <Select name="weaponCategoryFkId" value={form.weaponCategoryFkId}
                                        onChange={handleChange} disabled={loadingCat}
                                        placeholder={loadingCat ? "Loading..." : "Select Category *"}>
                                    {weaponCategories.map(c => (
                                        <option key={c.weaponCategoryPkId} value={c.weaponCategoryPkId}>
                                            {c.weaponCategoryName}
                                        </option>
                                    ))}
                                </Select>
                                {!loadingCat && weaponCategories.length === 0 && (
                                    <p className="text-xs text-red-400 mt-1">Failed to load. Please refresh.</p>
                                )}
                            </div>

                            {/* Weapon Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weapon Type
                                    {loadingType && <span className="ml-2 text-xs text-yellow-500">⏳ Loading...</span>}
                                </label>
                                <Select name="weaponTypeFkId" value={form.weaponTypeFkId}
                                        onChange={handleChange}
                                        disabled={!form.weaponCategoryFkId || loadingType}
                                        placeholder={
                                            !form.weaponCategoryFkId ? "Select a category first" :
                                            loadingType              ? "Loading types..."        :
                                            weaponTypes.length === 0 ? "No types available"      :
                                                                       "Select Weapon Type"
                                        }>
                                    {weaponTypes.map(t => (
                                        <option key={t.weaponTypePkId} value={t.weaponTypePkId}>
                                            {t.weaponTypeName}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            {/* Weapon Sub Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weapon Sub Type
                                    {loadingSubType && <span className="ml-2 text-xs text-yellow-500">⏳ Loading...</span>}
                                </label>
                                <Select name="weaponSubTypeFkId" value={form.weaponSubTypeFkId}
                                        onChange={handleChange}
                                        disabled={!form.weaponTypeFkId || loadingSubType}
                                        placeholder={
                                            !form.weaponTypeFkId        ? "Select a type first"       :
                                            loadingSubType              ? "Loading sub types..."       :
                                            weaponSubTypes.length === 0 ? "No sub types available"     :
                                                                          "Select Sub Type"
                                        }>
                                    {weaponSubTypes.map(s => (
                                        <option key={s.weaponSubTypePkId} value={s.weaponSubTypePkId}>
                                            {s.weaponSubTypeName}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            {/* Caliber */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Caliber
                                    {loadingCal && <span className="ml-2 text-xs text-yellow-500">⏳ Loading...</span>}
                                </label>
                                <Select name="caliberFkId" value={form.caliberFkId}
                                        onChange={handleChange}
                                        disabled={!form.weaponTypeFkId || loadingCal}
                                        placeholder={
                                            !form.weaponTypeFkId    ? "Select a type first"   :
                                            loadingCal              ? "Loading calibers..."    :
                                            calibers.length === 0   ? "No calibers available"  :
                                                                      "Select Caliber"
                                        }>
                                    {calibers.map(c => (
                                        <option key={c.caliberPkId} value={c.caliberPkId}>
                                            {c.caliberName}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* License Required */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" name="licenseRequired"
                                   checked={form.licenseRequired} onChange={handleChange}
                                   className="w-4 h-4 accent-yellow-500" />
                            <span className="text-sm font-medium text-gray-700">License Required</span>
                        </label>

                        {/* Price */}
                        <input type="number" name="price" placeholder="Price *" value={form.price}
                               onChange={handleChange}
                               className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />

                        {/* Negotiable */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" name="isNegotiable"
                                   checked={form.isNegotiable} onChange={handleChange}
                                   className="w-4 h-4 accent-yellow-500" />
                            <span>Negotiable</span>
                        </label>

                        {/* Image Upload */}
                        <div className="space-y-3">
                            <label className="font-medium block">Product Images</label>
                            <input type="file" accept="image/*" multiple
                                   onChange={handleImageChange} disabled={isUploadingImage}
                                   className="w-full border p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" />
                            {isUploadingImage && (
                                <p className="text-sm text-yellow-600 flex items-center gap-2">
                                    <span className="animate-spin inline-block">⏳</span> Uploading image...
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
                                            <button type="button" onClick={() => removeImage(i)}
                                                    disabled={preview.startsWith("blob:")}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full
                                                               w-5 h-5 text-xs flex items-center justify-center
                                                               disabled:opacity-40 disabled:cursor-not-allowed
                                                               hover:bg-red-600 transition">✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-3">
                            <label className="font-medium block">Location</label>
                            <input name="location" value={form.location} onChange={handleChange}
                                   placeholder="Address"
                                   className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="zipCode" value={form.zipCode} onChange={handleChange}
                                       placeholder="PIN Code"
                                       className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                <input name="city" value={form.city} onChange={handleChange}
                                       placeholder="City"
                                       className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="state" value={form.state} onChange={handleChange}
                                       placeholder="State"
                                       className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                <input name="country" value={form.country} onChange={handleChange}
                                       placeholder="Country"
                                       className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            </div>
                            <button type="button" onClick={handleAddressSearch}
                                    className="text-sm text-yellow-600 underline hover:text-yellow-700">
                                Auto-fill from PIN / Address
                            </button>
                        </div>

                        {/* Submit */}
                        <button onClick={() => setShowConfirmModal(true)}
                                disabled={isSubmitting || isUploadingImage}
                                className="w-full py-3 text-white rounded-xl bg-gradient-to-r from-black to-yellow-500
                                           disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
                            {isSubmitting ? "Posting..." : "Post Ad"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}