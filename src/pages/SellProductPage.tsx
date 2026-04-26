import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapPicker from "./MapPicker";

type ProductForm = {
    title: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    price: string;
    isNegotiable: boolean;
    location: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
};

export default function SellProductPage() {
    const navigate = useNavigate();
    const [coords, setCoords] = useState({ lat: 0, lng: 0 });
    const handleCancel = () => {
        const confirmLeave = window.confirm(
            "Are you sure you want to cancel? Your changes will be lost."
        );
        if (confirmLeave) navigate(-1);
    };

    const [form, setForm] = useState<ProductForm>({
        title: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        price: "",
        isNegotiable: false,
        location: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
    });

    //     const handleAddressSearch = async () => {
    //         if (!form.location) return;

    //         // const res = await fetch(
    //         //     `https://nominatim.openstreetmap.org/search?format=json&q=${form.location}`
    //         // );
    //          const res = await fetch(
    //   `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&q=${form.location}`
    // );
    //         const data = await res.json();

    //         if (data.length > 0) {
    //             const place = data[0];

    //             setCoords({
    //                 lat: parseFloat(place.lat),
    //                 lng: parseFloat(place.lon),
    //             });
    //         }
    //     };

   const handleAddressSearch = async () => {
  const searchValue = form.zipCode || form.location;

  if (!searchValue) return;

  const isZip = /^\d{5,6}$/.test(searchValue);

  const query = isZip
    ? `${searchValue}, India`
    : searchValue;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&q=${query}`
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
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

    const handleSubmit = () => {
        if (!form.title || !form.price || !form.categoryId) {
            alert("Required fields missing");
            return;
        }

        const payload = {
            ...form,
            price: Number(form.price),
            latitude: coords.lat,
            longitude: coords.lng,
        };

        console.log("Sending to backend:", payload);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-10 bg-transparent" >
            <div className="bg-white rounded-xl shadow overflow-hidden">

                {/* ✅ HEADER */}
                <div className="flex items-center justify-between px-6 py-4 
                        bg-gradient-to-r from-black to-yellow-500">
                    <h2 className="text-lg font-semibold text-white">
                        Post Your Ad
                    </h2>

                    <button
                        onClick={handleCancel}
                        className="text-white/80 hover:text-white transition"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* ✅ FORM BODY */}
                <div className="p-6 space-y-6">

                    <input
                        name="title"
                        placeholder="Title *"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full border p-2 rounded-lg"
                    />

                    <textarea
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full border p-2 rounded-lg h-28"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <select
                            name="categoryId"
                            value={form.categoryId}
                            onChange={handleChange}
                            className="border p-2 rounded-lg"
                        >
                            <option value="">Select Category *</option>
                            <option value="1">Cars</option>
                            <option value="2">Bikes</option>
                        </select>

                        <select
                            name="subcategoryId"
                            value={form.subcategoryId}
                            onChange={handleChange}
                            className="border p-2 rounded-lg"
                        >
                            <option value="">Select Subcategory</option>
                            <option value="11">SUV</option>
                            <option value="12">Sedan</option>
                        </select>
                    </div>

                    <input
                        type="number"
                        name="price"
                        placeholder="Price *"
                        value={form.price}
                        onChange={handleChange}
                        className="w-full border p-2 rounded-lg"
                    />

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isNegotiable"
                            checked={form.isNegotiable}
                            onChange={handleChange}
                        />
                        Negotiable
                    </label>

                    {/* <input
                        name="location"
                        placeholder="Full Address"
                        value={form.location}
                        onChange={handleChange}
                        className="w-full border p-2 rounded-lg"
                    /> */}

                    {/* <div className="grid grid-cols-2 gap-4">
                        <input
                            name="city"
                            placeholder="City"
                            value={form.city}
                            onChange={handleChange}
                            className="border p-2 rounded-lg"
                        />

                        <input
                            name="state"
                            placeholder="State"
                            value={form.state}
                            onChange={handleChange}
                            className="border p-2 rounded-lg"
                        />
                    </div> */}

                    {/* <div className="grid grid-cols-3 gap-4">
                        <input
                            name="zipCode"
                            placeholder="Zip Code"
                            value={form.zipCode}
                            onChange={handleChange}
                            className="border p-2 rounded-lg"
                        />

                        <input
                            name="country"
                            placeholder="Country"
                            value={form.country}
                            onChange={handleChange}
                            className="border p-2 rounded-lg col-span-2"
                        />
                    </div> */}
                    <div className="space-y-3">
                        <label className="font-medium">Select Location *</label>

                        <MapPicker
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
                        />
                        <div className="flex gap-2">
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="Search address"
                                className="w-full border p-2 rounded-lg"
                            />

                            <button
                                type="button"
                                onClick={handleAddressSearch}
                                className="px-4 bg-yellow-500 text-white rounded-lg"
                            >
                                Search
                            </button>
                        </div>

                        <input
                            name="zipCode"
                            value={form.zipCode}
                            onChange={handleChange}
                            placeholder="Enter PIN code"
                            className="w-full border p-2 rounded-lg"
                        />

                        {/* Address */}
                        {/* <input
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Search or select address"
                            className="w-full border p-2 rounded-lg"
                        /> */}

                        {/* City + State */}
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                value={form.city}
                                readOnly
                                placeholder="City"
                                className="border p-2 rounded-lg bg-gray-100"
                            />
                            <input
                                value={form.state}
                                readOnly
                                placeholder="State"
                                className="border p-2 rounded-lg bg-gray-100"
                            />
                        </div>

                        {/* Zip + Country */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* <input
                                value={form.zipCode}
                                readOnly
                                placeholder="Zip Code"
                                className="border p-2 rounded-lg bg-gray-100"
                            /> */}
                            <input
                                value={form.country}
                                readOnly
                                className="border p-2 rounded-lg bg-gray-100"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-3 text-white rounded-xl 
                       bg-gradient-to-r from-black to-yellow-500"
                    >
                        Post Ad
                    </button>

                </div>
            </div>
        </div>
    );
}