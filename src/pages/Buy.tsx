import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { InfoIcon } from "../icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

/* =======================
   Backend Entity Mapping
======================= */
interface Container {
  containerPkId: number;
  containerType: string;
  ownershipType: string;
  priceUsd: number;
  priceInr: number;
  min_shares: number;
  contract_months: number;
  roiPercentage: number;
}

export default function Buy() {
  const [isAddMode, setIsAddMode] = useState(false);
  const [containers, setContainers] = useState<Container[]>([]);

  /* Buy Form State */
  const [formData, setFormData] = useState({
    containerType: "",
    ownershipType: "",
    priceUsd: "",
    priceInr: "",
    shares: "",
  });

  /* =======================
     Fetch Containers (API)
  ======================= */
  useEffect(() => {
    // TODO: replace with API call
    setContainers([
      {
        containerPkId: 1,
        containerType: "20FT",
        ownershipType: "SINGLE",
        priceUsd: 5000,
        priceInr: 420000,
        min_shares: 1,
        contract_months: 12,
        roiPercentage: 8,
      },
    ]);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      containerType: formData.containerType,
      ownershipType: formData.ownershipType,
      priceUsd: Number(formData.priceUsd),
      priceInr: Number(formData.priceInr),
      shares: Number(formData.shares),
    };

    console.log("BUY CONTAINER PAYLOAD", payload);
    // TODO: POST to backend
  };

  return (
    <>
      <PageMeta title="Buy Container" description="Manage Containers" />

      <div className="mt-4">
        <PageBreadcrumb pageTitle="Buy Container" />
      </div>

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsAddMode(!isAddMode)}
          className={`px-6 py-2 ${
            isAddMode
              ? "bg-gray-500 hover:bg-gray-600"
              : "bg-orange-500 hover:bg-orange-600"
          } text-white`}
        >
          {isAddMode ? "View Containers" : "Buy Container"}
        </Button>
      </div>

      {/* Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <InfoIcon className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-700">
            Containers power 90% of global trade. Own containers and earn
            consistent ROI from world trade logistics.
          </p>
        </div>
      </div>

      {/* =======================
           BUY FORM
      ======================= */}
      {isAddMode && (
        <ComponentCard title="Buy New Container">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Container Type</Label>
                <Select
                  options={[
                    { value: "20FT", label: "20 FT" },
                    { value: "40FT", label: "40 FT" },
                  ]}
                  onChange={(v) =>
                    setFormData({ ...formData, containerType: v })
                  }
                />
              </div>

              <div>
                <Label>Ownership Type</Label>
                <Select
                  options={[
                    { value: "SINGLE", label: "Single" },
                    { value: "SHARED", label: "Shared" },
                  ]}
                  onChange={(v) =>
                    setFormData({ ...formData, ownershipType: v })
                  }
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Price (USD)</Label>
                <Input
                  name="priceUsd"
                  type="number"
                  value={formData.priceUsd}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Price (INR)</Label>
                <Input
                  name="priceInr"
                  type="number"
                  value={formData.priceInr}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label>Number of Shares</Label>
              <Input
                name="shares"
                type="number"
                value={formData.shares}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                Buy Container
              </Button>
            </div>
          </form>
        </ComponentCard>
      )}

      {/* =======================
           CONTAINER TABLE
      ======================= */}
      {!isAddMode && (
        <ComponentCard title="Available Containers">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Ownership</TableCell>
                <TableCell>USD</TableCell>
                <TableCell>ROI %</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No Containers Found
                  </TableCell>
                </TableRow>
              ) : (
                containers.map((c) => (
                  <TableRow key={c.containerPkId}>
                    <TableCell>{c.containerPkId}</TableCell>
                    <TableCell>{c.containerType}</TableCell>
                    <TableCell>{c.ownershipType}</TableCell>
                    <TableCell>${c.priceUsd}</TableCell>
                    <TableCell>{c.roiPercentage}%</TableCell>
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
