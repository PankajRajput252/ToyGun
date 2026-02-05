import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { InfoIcon } from "../icons";
import api,{buyContainer,ContainerResponse} from "../services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";


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
    
  
const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
const userNodeId = user?.nodeId;
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
  const [isAddMode, setIsAddMode] = useState(false);
   const [isLoading, setIsLoading] = useState<boolean>(false);
   const [containerData, setContainerData] = useState<ContainerResponse[]>([]);

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

  /* =======================
     Price Auto Calculation
  ======================= */
  // useEffect(() => {
  //   if (!form.containerType || !form.ownershipType) return;

  //   const config = CONTAINERS.find(
  //     c =>
  //       c.containerType === form.containerType &&
  //       c.ownershipType === form.ownershipType
  //   );

  //   if (!config) return;

  //   if (form.ownershipType === "SINGLE") {
  //     setForm(prev => ({
  //       ...prev,
  //       priceUsd: config.priceUsd,
  //       priceInr: config.priceInr,
  //       shares: 1,
  //       minShares: 1,
  //       roi: config.roi,
  //     }));
  //   } else {
  //     const shares = form.shares >= config.minShares ? form.shares : config.minShares;

  //     setForm(prev => ({
  //       ...prev,
  //       priceUsd: 0,
  //       priceInr: shares * config.priceInr,
  //       shares,
  //       minShares: config.minShares,
  //       roi: config.roi,
  //     }));
  //   }
  // }, [form.containerType, form.ownershipType, form.shares]);
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
  const handleSubmit =  async (e: React.FormEvent) => {
    console.log("Pankaj")
    e.preventDefault();
    let investedAmount: number | null = null;

    if (form.currency === "USD") {
      investedAmount = form.priceUsd;
    } else if (form.currency === "INR") {
      investedAmount = form.priceInr;
    } else if (form.currency === "AED") {
      // Example conversion (replace with live FX later)
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
      status: 'ACTIVE'
    };

    console.log("BUY PAYLOAD 👉", payload);
    // TODO: POST to backend
       const depositResponse = await buyContainer.add(payload);
          console.log("investment value--->",depositResponse)

  };

  
    const fetchContainerData = async () => {
      try {
        setIsLoading(true);
        const response = await buyContainer.getAll(1, 25, 'ACTIVE',userNodeId);
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
          Minimum contract period: <b>15 months</b>. ROI credited monthly until container is sold.
        </p>
      </div>

      {isAddMode && (
        <ComponentCard title="Buy Container">
          <form onSubmit={handleSubmit} className="space-y-6">

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
              <TableRow className="text-white">
                <TableCell>#</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Ownership</TableCell>
                <TableCell>USD</TableCell>
                <TableCell>ROI %</TableCell>
                 <TableCell>STATUS</TableCell>
                  <TableCell>UPLOAD RECEIPT</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containerData.length === 0 ? (
                <TableRow className="text-white">
                  <TableCell colSpan={5} className="text-center py-6">
                    No Containers Found
                  </TableCell>
                </TableRow>
              ) : (
                containerData.map((c) => (
                  <TableRow key={c.investmentPkId} className="text-white">
                    <TableCell>{c.investmentPkId}</TableCell>
                    <TableCell>{c.containerType}</TableCell>
                    <TableCell>{c.ownershipType}</TableCell>
                    <TableCell>${c.investedAmount}</TableCell>
                    <TableCell>{c.roiPercentage}%</TableCell>
                     <TableCell>{c.status}</TableCell>
                    <TableCell>{}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ComponentCard>
      )}
    </>
  );
}
