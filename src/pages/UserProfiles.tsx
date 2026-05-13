import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { individualProfileApi, UpdateProfileRequest, usersApi, imageUploadApi } from "../services/api";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { EnvelopeIcon, UserIcon, EyeIcon, EyeCloseIcon } from "../icons";
import Button from "../components/ui/button/Button";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  // Get user data from localStorage (most up-to-date)
  const getUserData = () => {
    const storedUser = localStorage.getItem("stylocoin_user");
    return storedUser ? JSON.parse(storedUser) : user;
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    country: "",
    transactionPassword: "",
  });

  const [selectedCountry, setSelectedCountry] = useState("");
  const hasFetchedRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data into form - only fetch once when component mounts or userPkId changes
  useEffect(() => {
    const currentUserData = getUserData();
    const userPkId = currentUserData?.userPkId;

    if (!userPkId) {
      // Fallback to localStorage data if userPkId is not available
      const country = currentUserData?.country || "";

      // Ensure name is not the email address
      const userName = currentUserData?.name && currentUserData.name !== currentUserData?.email
        ? currentUserData.name
        : "";

      console.log("Loading from localStorage (no userPkId):", {
        name: currentUserData?.name,
        email: currentUserData?.email,
        userName
      });

      setFormData({
        name: userName,
        email: currentUserData?.email || "",
        mobile: currentUserData?.mobile || "",
        country: country,
        transactionPassword: "******",
      });
      setSelectedCountry(country);
      
      // Load profile image from user data (check both profileImageUrl and imageUrl for backward compatibility)
      const imageUrl = currentUserData?.profileImageUrl || currentUserData?.imageUrl;
      if (imageUrl) {
        setPreviewImage(imageUrl);
      }
      return;
    }

    // Only fetch if we haven't fetched for this userPkId yet
    if (hasFetchedRef.current === userPkId) {
      return;
    }

    // Mark as fetched before making the API call
    hasFetchedRef.current = userPkId;

    // Fetch user data from API using userPkId
    const fetchUserData = async () => {
      try {
        const fetchedUser = await usersApi.getById(userPkId);

        if (fetchedUser) {
          console.log("Fetched user from API:", fetchedUser);

          // Ensure we're using the correct name field (not email)
          const userName = fetchedUser.name && fetchedUser.name !== fetchedUser.email
            ? fetchedUser.name
            : (currentUserData?.name && currentUserData.name !== currentUserData?.email
              ? currentUserData.name
              : fetchedUser.name || "");

          const country = fetchedUser.country || "";
          setFormData({
            name: userName,
            email: fetchedUser.email || "",
            mobile: fetchedUser.mobile || "",
            country: country,
            transactionPassword: "******", // Masked password
          });
          setSelectedCountry(country);

          // Load profile image from API response (check both profileImageUrl and imageUrl)
          const fetchedImageUrl = fetchedUser.profileImageUrl || fetchedUser.imageUrl;
          console.log(fetchedImageUrl,"afdafd")
          const currentImageUrl = currentUserData?.profileImageUrl || currentUserData?.imageUrl;
          
          if (fetchedImageUrl) {
            setPreviewImage(fetchedImageUrl);
          } else if (currentImageUrl) {
            // Keep existing image if API doesn't return one
            setPreviewImage(currentImageUrl);
          }

          // Only update user context if the data is actually different (to avoid infinite loop)
          const needsUpdate =
            fetchedUser.name !== currentUserData?.name ||
            fetchedUser.email !== currentUserData?.email ||
            fetchedUser.mobile !== currentUserData?.mobile ||
            fetchedUser.country !== currentUserData?.country ||
            fetchedImageUrl !== currentImageUrl;

          if (needsUpdate) {
            updateUser(fetchedUser);
          }
        } else {
          // Fallback to localStorage data if API returns no data
          const country = currentUserData?.country || "";

          // Ensure name is not the email address
          const userName = currentUserData?.name && currentUserData.name !== currentUserData?.email
            ? currentUserData.name
            : "";

          setFormData({
            name: userName,
            email: currentUserData?.email || "",
            mobile: currentUserData?.mobile || "",
            country: country,
            transactionPassword: "******",
          });
          setSelectedCountry(country);
          
          // Load profile image from localStorage (check both profileImageUrl and imageUrl)
          const imageUrl = currentUserData?.profileImageUrl || currentUserData?.imageUrl;
          if (imageUrl) {
            setPreviewImage(imageUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fallback to localStorage data on error
        const country = currentUserData?.country || "";

        // Ensure name is not the email address
        const userName = currentUserData?.name && currentUserData.name !== currentUserData?.email
          ? currentUserData.name
          : "";

        setFormData({
          name: userName,
          email: currentUserData?.email || "",
          mobile: currentUserData?.mobile || "",
          country: country,
          transactionPassword: "******",
        });
        setSelectedCountry(country);
        
        // Load profile image from localStorage on error (check both profileImageUrl and imageUrl)
        const imageUrl = currentUserData?.profileImageUrl || currentUserData?.imageUrl;
        if (imageUrl) {
          setPreviewImage(imageUrl);
        }
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userPkId]); // Only depend on userPkId, not the entire user object or updateUser

  // Load user image when user data changes or component mounts
  useEffect(() => {
    const currentUserData = getUserData();
    // Check both profileImageUrl (from API) and imageUrl (for backward compatibility)
    const imageUrl = currentUserData?.profileImageUrl || currentUserData?.imageUrl;
    if (imageUrl) {
      setPreviewImage(imageUrl);
    } else {
      // Clear preview if no image URL
      setPreviewImage(null);
    }
  }, [user?.profileImageUrl, user?.imageUrl, user?.userPkId]);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setFormData((prev) => ({
      ...prev,
      country: value,
    }));
  };

  // Helper function to compress and resize image
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB. The image will be compressed automatically.');
      }

      try {
        // Compress the image
        const compressed = await compressImage(file);
        setCompressedFile(compressed);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(compressed);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original file if compression fails
        setCompressedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleImageUpload = async () => {
    const file = compressedFile || fileInputRef.current?.files?.[0];
    if (!file) {
      alert('Please select an image to upload');
      return;
    }

    // Final size check before upload (max 2MB after compression)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image is still too large after compression. Please try a smaller image or compress it manually.');
      return;
    }

    const currentUser = getUserData();
    if (!currentUser?.nodeId) {
      alert('User node ID not found. Please refresh the page.');
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await imageUploadApi.uploadUserImage(currentUser.nodeId, file);
      
      // Extract image URL from response (check multiple possible response formats)
      const imageUrl = response?.data?.profileImageUrl || response?.data?.imageUrl || response?.profileImageUrl || response?.imageUrl || response?.data?.url;
      
      if (imageUrl) {
        // Update user context with new image URL (store in both fields for compatibility)
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            profileImageUrl: imageUrl,
            imageUrl: imageUrl, // Also set imageUrl for backward compatibility
          };
          updateUser(updatedUser);
        }
        alert('Image uploaded successfully!');
      } else {
        console.warn('Image upload response:', response);
        alert('Image uploaded but URL not received. Please refresh the page.');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Handle specific error cases
      if (error.message?.includes('413') || error.message?.includes('Request Entity Too Large')) {
        alert('Image file is too large. Please select a smaller image (max 2MB recommended).');
      } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        alert('Invalid image file. Please select a valid image (JPG, PNG, or GIF).');
      } else {
        alert(`Failed to upload image: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);

      const currentUser = getUserData();

      // Check if we have any user data at all
      if (!currentUser) {
        console.error("No user data found. Cannot update profile.");
        alert("User data not loaded. Please refresh the page and try again.");
        setIsLoading(false);
        return;
      }

      // Use formData values if they exist and are not empty, otherwise use currentUser values
      // This ensures we always send actual values, not null, unless both formData and currentUser are empty
      const updateRequest: UpdateProfileRequest = {
        userName: formData.name.trim() || currentUser.name || null,
        email: formData.email.trim() || currentUser.email || null,
        country: formData.country.trim() || currentUser.country || null,
        mobile: formData.mobile.trim() || currentUser.mobile || null,
        transactionPassword: formData.transactionPassword !== "******" && formData.transactionPassword.trim() !== ""
          ? formData.transactionPassword.trim()
          : null,
        userNodeId: currentUser.nodeId || null,
      };

      // Validate that we have at least some data to update
      const hasValidData =
        updateRequest.userName !== null ||
        updateRequest.email !== null ||
        updateRequest.country !== null ||
        updateRequest.mobile !== null ||
        updateRequest.userNodeId !== null;

      if (!hasValidData) {
        console.error("No valid data to update. Form data:", formData, "Current user:", currentUser);
        alert("Please fill in at least one field to update, or wait for the form to load.");
        setIsLoading(false);
        return;
      }

      // Debug log to see what we're sending
      console.log("Update request:", updateRequest);
      console.log("Form data:", formData);
      console.log("Current user:", currentUser);

      // Call the API
      const response = await individualProfileApi.updateProfile(updateRequest);

      // Use response data if available, otherwise fall back to formData
      // The API response may contain the updated fields directly
      const updatedCountry = response?.country || updateRequest.country || formData.country || currentUser?.country || "";
      const updatedName = response?.userName || updateRequest.userName || formData.name || currentUser?.name || "";
      const updatedEmail = response?.email || updateRequest.email || formData.email || currentUser?.email || "";
      const updatedMobile = response?.mobile || updateRequest.mobile || formData.mobile || currentUser?.mobile || "";

      // Update form state with response data
      setFormData({
        name: updatedName,
        email: updatedEmail,
        mobile: updatedMobile,
        country: updatedCountry,
        transactionPassword: "******", // Keep password masked
      });
      setSelectedCountry(updatedCountry);

      // Update user context
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          name: updatedName,
          email: updatedEmail,
          mobile: updatedMobile,
          country: updatedCountry,
        };

        updateUser(updatedUser);
      }

      console.log("Profile updated successfully!", response);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // // Country options
  // const countryOptions = [
  //   { value: "South Africa", label: "South Africa" },
  //   { value: "United States", label: "United States" },
  //   { value: "United Kingdom", label: "United Kingdom" },
  //   { value: "Canada", label: "Canada" },
  //   { value: "Australia", label: "Australia" },
  //   { value: "India", label: "India" },
  //   { value: "Germany", label: "Germany" },
  //   { value: "France", label: "France" },
  // ];

  return (
    <>
      <PageMeta title="StyloCoin Dashboard" description="StyloCoin Dashboard" />
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Home</span> / <span>Setting</span> /{" "}
            <span className="text-gray-900 dark:text-white">Profile</span>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            {/* Profile Image Upload Section */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <Label>Profile Image</Label>
              <div className="flex items-center gap-6 mt-4">
                <div className="relative">
                  <div className="overflow-hidden rounded-full h-24 w-24 border-2 border-gray-200 dark:border-gray-700">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="profile-image-input"
                  />
                  <label
                    htmlFor="profile-image-input"
                    className="inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Choose Image
                  </label>
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isUploadingImage || (!compressedFile && !fileInputRef.current?.files?.[0])}
                    className="ml-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingImage ? "Uploading..." : "Upload"}
                  </Button>
                  
                </div>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <div className="relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 dark:border-gray-700 px-3.5 py-3 text-gray-500 dark:text-gray-400">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange("name")}
                        className="pl-[62px]"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 dark:border-gray-700 px-3.5 py-3 text-gray-500 dark:text-gray-400">
                        <EnvelopeIcon className="w-5 h-5" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange("email")}
                        className="pl-[62px]"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <div className="relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 dark:border-gray-700 px-3.5 py-3 text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <Input
                        id="mobile"
                        type="text"
                        value={formData.mobile}
                        onChange={handleInputChange("mobile")}
                        className="pl-[62px]"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Country */}
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      // type={showPassword ? "text" : "password"}
                      value={selectedCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="pr-12"
                      placeholder="Select a country"
                    />
                    {/* <Select
                      options={countryOptions}
                      placeholder="Select a country"
                      onChange={handleCountryChange}
                      value={selectedCountry}
                      defaultValue={selectedCountry}
                    /> */}
                  </div>

                  {/* Transaction Password */}
                  <div>
                    <Label htmlFor="transactionPassword">Transaction Password</Label>
                    <div className="relative">
                      <Input
                        id="transactionPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.transactionPassword}
                        onChange={handleInputChange("transactionPassword")}
                        className="pr-12"
                        placeholder="Enter transaction password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeIcon className="w-5 h-5" />
                        ) : (
                          <EyeCloseIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
