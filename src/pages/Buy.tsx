import { useEffect, useState, useRef } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { InfoIcon } from "../icons";
import jsPDF from "jspdf";
import api, { BankApi, AddWithdrawRequest, WithdrawRequest, buyContainer, ContainerResponse, depositReceiptUploadApi, depositApi } from "../services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useNavigate } from "react-router-dom";
import axios from "axios";



/* =======================
   Container Entity
======================= */
interface Container {
  containerType: "20FT" | "40FT";
  ownershipType: "SINGLE" | "SHARED";
  priceUsd: number;
  priceInr: number;
  minShares: number;
  roi: number;
}

interface PaymentResponse {
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  payment_id: string;
}

interface HistoryItem {
  paymentId: string;
  paymentStatus: string;
}

const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
const userNodeId = user?.nodeId;
console.log("USER NODE ID shri", userNodeId);
/* =======================
   Static Master Data
   (Later replace with API)
======================= */
// const CONTAINERS: Container[] = [
//   // 20 FT
//   { containerType: "20FT", ownershipType: "SINGLE", priceUsd: 3000, priceInr: 276000, minShares: 1, roi: 3.5 },
//   { containerType: "20FT", ownershipType: "SHARED", priceUsd: 0, priceInr: 27600, minShares: 10, roi: 3 },

//   // 40 FT
//   { containerType: "40FT", ownershipType: "SINGLE", priceUsd: 4300, priceInr: 395600, minShares: 1, roi: 4.5 },
//   { containerType: "40FT", ownershipType: "SHARED", priceUsd: 0, priceInr: 36800, minShares: 10, roi: 4 },
// ];
const CONTAINERS: Container[] = [
  { containerType: "20FT", ownershipType: "SINGLE", priceUsd: 3000, priceInr: 276000, minShares: 1, roi: 3.5 },

  { containerType: "20FT", ownershipType: "SHARED", priceUsd: 300, priceInr: 27600, minShares: 10, roi: 3 },

  { containerType: "40FT", ownershipType: "SINGLE", priceUsd: 4300, priceInr: 395600, minShares: 1, roi: 4.5 },

  { containerType: "40FT", ownershipType: "SHARED", priceUsd: 400, priceInr: 36800, minShares: 10, roi: 4 },
];


export default function Buy() {

  const navigate = useNavigate();

  const [bankDetails, setBankDetails] = useState<WithdrawRequest[]>([]);
  const [openBankModal, setOpenBankModal] = useState(false);
  const [loadingBank, setLoadingBank] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [containerData, setContainerData] = useState<ContainerResponse[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<{
    [investmentPkId: number]: File | null;
  }>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const hasFetchedRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    containerType: "" as "20FT" | "40FT" | "",
    ownershipType: "" as "SINGLE" | "SHARED" | "",
    shares: 0,
    priceUsd: 0,
    priceInr: 0,
    roi: 0,
    minShares: 0,
    currency: ''
  });

  const generateReceiptPDF = (payment: PaymentResponse, amount: number) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Payment Receipt", 20, 20);

    doc.setFontSize(12);
    doc.text(`Payment ID: ${payment.payment_id}`, 20, 40);
    doc.text(`Amount: ${amount} ${payment.pay_currency}`, 20, 50);
    doc.text(`Wallet Address: ${payment.pay_address}`, 20, 60);
    doc.text(`Status: SUCCESS`, 20, 70);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 80);

    doc.save(`receipt-${payment.payment_id}.pdf`);
  };

  const createDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      let investedAmount = 0;

      if (form.currency === "USD") investedAmount = form.priceUsd;
      else if (form.currency === "INR") investedAmount = form.priceInr;
      else if (form.currency === "AED") investedAmount = Math.round(form.priceUsd * 3.67);

      if (!form.containerType) {
        alert("Please select container type");
        return;
      }

      if (!form.ownershipType) {
        alert("Please select ownership type");
        return;
      }

      if (!form.currency) {
        alert("Please select currency");
        return;
      }

      if (!form.priceUsd && !form.priceInr) {
        alert("Invalid price. Please reselect container");
        return;
      }

      if (!investedAmount || investedAmount <= 0) {
        alert("Please select container and currency properly");
        return;
      }

      const depositRequest = {
        userNodeId,
        amount: investedAmount,
      };

      const paymentResponse = await depositApi.add(depositRequest);
      console.log("paymentResponse--->", paymentResponse)

      setPayment(paymentResponse);
      // setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${paymentResponse.pay_address}`);

      pollPaymentStatus(paymentResponse.payment_id);
      navigate("/containerShipment/depositConfirmation", {
        state: {
          paymentResponse: paymentResponse,
          amount: investedAmount,
          currency: form.currency,
          paymentIdValueForPoll: paymentResponse.payment_id
        },
      });
    } catch (err) {
      console.error(err);
      alert("Error creating deposit");
    } finally {
      setIsLoading(false);
    }
  };

  const intervalRef = useRef<any>(null);

  const pollPaymentStatus = (paymentId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      try {
        const res = await axios.get(
          `http://MineCryptos-env.eba-nsbmtw9i.ap-south-1.elasticbeanstalk.com/api/deposit/history/${userNodeId}`
        );

        const record = res.data.data.find((x: HistoryItem) => x.paymentId === paymentId);

        if (record?.paymentStatus === "SUCCESS") {
          clearInterval(intervalRef.current);
          setSuccess(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);


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


  const handleImageUpload = async (investmentPkId: number, investedAmount: number, currency: string) => {
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



    try {
      setIsUploadingImage(true);
      // const response = await imageUploadApi.uploadUserImage(currentUser.nodeId, file);
      const response = await depositReceiptUploadApi.uploadUserImage(
        userNodeId,
        file,
        investmentPkId,

        investedAmount,
        currency
      );

      // Extract image URL from response (check multiple possible response formats)
      const imageUrl = response?.data?.imageUrl || response?.data?.imageUrl || response?.message || response?.imageUrl || response?.data?.imageUrl;

      if (imageUrl) {
        // Update user context with new image URL (store in both fields for compatibility)

        alert('Image uploaded successfully!');
        await fetchContainerData();
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

  const fetchBankDetails = async () => {
    try {
      setLoadingBank(true);

      const res = await BankApi.getAll(1, 25, "ACTIVE", user?.nodeId);
      const data = res?.content?.data || res || [];

      console.log("BANK API DATA 👉", data);

      // 👉 Filter default accounts
      const defaultAccounts = data.filter(
        (item) =>
          item.isDefault === true ||
          item.isDefault === "true" ||
          item.isDefault === 1
      );

      if (defaultAccounts.length === 0) {
        setBankDetails([]);
        setOpenBankModal(true);
        return;
      }

      // 👉 Get latest using highest PK ID
      const latestDefaultAccount = defaultAccounts.sort(
        (a, b) => b.withdrawRequestPkId - a.withdrawRequestPkId
      )[0];

      setBankDetails([latestDefaultAccount]);
      setOpenBankModal(true);

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    if (!form.containerType || !form.ownershipType) return;

    const config = CONTAINERS.find(
      c =>
        c.containerType === form.containerType &&
        c.ownershipType === form.ownershipType
    );

    if (!config) return;

    if (form.ownershipType === "SINGLE") {
      setForm(prev => ({
        ...prev,
        priceUsd: config.priceUsd,
        priceInr: config.priceInr,
        shares: 1,
        minShares: 1,
        roi: config.roi,
      }));
    } else {
      const shares =
        form.shares >= config.minShares ? form.shares : config.minShares;

      setForm(prev => ({
        ...prev,
        shares,
        minShares: config.minShares,
        priceUsd: shares * config.priceUsd,
        priceInr: shares * config.priceInr,
        roi: config.roi,
      }));
    }
  }, [form.containerType, form.ownershipType, form.shares]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let investedAmount: number | null = null;

    if (form.currency === "USD") {
      investedAmount = form.priceUsd;
    } else if (form.currency === "INR") {
      investedAmount = form.priceInr;
    } else if (form.currency === "AED") {
      investedAmount = Math.round(form.priceUsd * 3.67);
    }

    const payload = {
      containerType: form.containerType,
      ownershipType: form.ownershipType,
      shares: form.shares,
      roiPercentage: form.roi,
      currency: form.currency,
      investedAmount: investedAmount,
      userFkId: userNodeId,
      status: "ACTIVE",
    };

    try {
      const depositResponse = await buyContainer.add(payload);
      console.log("investment value--->", depositResponse);

      await fetchContainerData();
      setIsAddMode(false);

    } catch (error) {
      console.error("Error buying container:", error);
    }
  };


  const fetchContainerData = async () => {
    try {
      setIsLoading(true);
      const response = await buyContainer.getAll(1, 25, 'ACTIVE', userNodeId);
      setContainerData(response.content);
    } catch (error) {
      console.error('Error fetching income types:', error);

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContainerData();
  }, []);


  return (
    <>
      <PageMeta title="Buy Container" description="Buy Shipping Containers" />

      <div className="mt-4">
        <PageBreadcrumb pageTitle="Buy Container" />
      </div>


      <div className="flex justify-end mb-4">
        <div className="mr-4">
          <Button
            onClick={fetchBankDetails}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
          >
            View Admin Bank Detail
          </Button>
        </div>
        <Button
          onClick={() => setIsAddMode(!isAddMode)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
        >
          {isAddMode ? "View Containers" : "Buy Container"}
        </Button>
      </div>


      {/* Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
        <InfoIcon className="w-5 h-5 text-blue-600" />
        <p className="text-sm text-blue-700">
          Minimum contract period: <b>36 months</b>. ROI credited monthly until container is sold.
        </p>
      </div>

      {isAddMode && (
        <ComponentCard title="Buy Container">
          <form onSubmit={createDeposit} className="space-y-6">

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Container Type</Label>
                <Select
                  options={[
                    { value: "20FT", label: "20 FT" },
                    { value: "40FT", label: "40 FT" },
                  ]}
                  onChange={v => setForm({ ...form, containerType: v as any })}
                />
              </div>

              <div>
                <Label>Ownership Type</Label>
                <Select
                  options={[
                    { value: "SINGLE", label: "Single Owner" },
                    { value: "SHARED", label: "Shared" },
                  ]}
                  onChange={v => setForm({ ...form, ownershipType: v as any })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Currency Type</Label>
                <Select
                  options={[
                    { value: "INR", label: "INR" },
                    { value: "USD", label: "USD" },
                    { value: "AED", label: "AED" },
                  ]}
                  onChange={v => setForm({ ...form, currency: v as any })}
                />
              </div>

              <div>
                <Label>Payment Through</Label>
                <Select
                  options={[
                    { value: "BANK", label: "Bank" },
                  ]}
                  onChange={v => setForm({ ...form })}
                />
              </div>
            </div>

            {form.ownershipType === "SHARED" && (
              <div>
                <Label>
                  Number of Shares (Min {form.minShares})
                </Label>
                <Input
                  type="number"
                  min={form.minShares}
                  value={form.shares}
                  onChange={e =>
                    setForm({ ...form, shares: Number(e.target.value) })
                  }
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Price (USD)</Label>
                <Input value={form.priceUsd} disabled />
              </div>

              <div>
                <Label>Price (INR)</Label>
                <Input value={form.priceInr} disabled />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p><b>Monthly ROI:</b> {form.roi}%</p>
              <p><b>Minimum Contract:</b> 15 Months</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                Proceed to Pay
              </Button>
            </div>
          </form>
        </ComponentCard>
      )}
      {!isAddMode && (
        <ComponentCard title="Available Containers">
          <Table>
            <TableHeader>
              <TableRow className="text-gray-800 dark:text-white">
                <TableCell>#</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Ownership</TableCell>
                <TableCell>USD</TableCell>
                <TableCell>ROI %</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell>UPLOAD RECEIPT</TableCell>
                <TableCell>DOWNLOAD RECEIPT</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containerData.length === 0 ? (
                <TableRow className="text-gray-800 dark:text-white">
                  <TableCell colSpan={5} className="text-center py-6">
                    No Containers Found
                  </TableCell>
                </TableRow>
              ) : (
                containerData.map((c) => (
                  <TableRow key={c.investmentPkId} className="text-gray-800 dark:text-white">
                    <TableCell>{c.investmentPkId}</TableCell>
                    <TableCell>{c.containerType}</TableCell>
                    <TableCell>{c.ownershipType}</TableCell>
                    <TableCell>${c.investedAmount}</TableCell>
                    <TableCell>{c.roiPercentage}%</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>
                      {c.imageUrl ? (
                        <div className="flex flex-col items-start gap-2">
                          <a
                            href={c.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition duration-200"
                          >
                            👁 View Document
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, c.investmentPkId)}
                            className="hidden"
                            id={`profile-image-input-${c.investmentPkId}`}
                          />

                          <label
                            htmlFor={`profile-image-input-${c.investmentPkId}`}
                            className="inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                          >
                            Choose Image
                          </label>

                          <Button
                            size="sm"
                            disabled={c.status === "APPROVED"}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() =>
                              handleImageUpload(c.investmentPkId, c.investedAmount, c.currency)
                            }
                          >
                            Upload
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {c.status === "APPROVED" || c.status === "SUCCESS" ? (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            generateReceiptPDF({
                              payment_id: String(c.investmentPkId),
                              pay_amount: c.investedAmount,
                              pay_currency: c.currency,
                              pay_address: "N/A",
                            }, c.investedAmount)
                          }
                        >
                          Download
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">Not Available</span>
                      )}
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ComponentCard>
      )}

      {/* bank detail */}
      {openBankModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-[500px] p-6 relative animate-fadeIn">

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpenBankModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-lg"
            >
              ✖
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">
              Admin Bank Details
            </h2>

            {loadingBank ? (
              <p className="text-center">Loading...</p>
            ) : bankDetails.length === 0 ? (
              <p className="text-center text-gray-500">No Bank Details Found</p>
            ) : (
              bankDetails.map((bank, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 mb-3 bg-gray-50"
                >
                  <p><b>Account Holder:</b> {bank.accountHolderName}</p>
                  <p><b>Bank Name:</b> {bank.bankName}</p>
                  <p><b>Account No:</b> {bank.accountNumber}</p>
                  <p><b>IFSC Code:</b> {bank.ifscCode}</p>
                  {bank.upiId && (
                    <p><b>UPI ID:</b> {bank.upiId}</p>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </>
  );
}
