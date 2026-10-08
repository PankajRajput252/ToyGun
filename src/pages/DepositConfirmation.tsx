import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { PaymentResponse } from "../services/api";
import axios from "axios";

const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
const userNodeId = user?.nodeId;
console.log("loggedInPrnId for history",userNodeId)

interface DepositConfirmationData {
  paymentResponse: PaymentResponse;
  amount: number;
  currency: string;
  paymentId: string;
  walletAddress: string;
  creationTime: string;
  expiryTime: string;
}

interface HistoryItem {
  paymentId: string;
  paymentStatus: string;
}

export default function DepositConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [success, setSuccess] = useState<boolean>(false);
  const [paymentIdValue,setPaymentIdValue]=useState("");
  const [confirmationData, setConfirmationData] = useState<DepositConfirmationData | null>(null);

  const pollPaymentStatus = async (paymentId: string) => {
    console.log("paymentId is setting",paymentId)
    try {
      const res = await axios.get(
        `http://MineCryptos-env.eba-nsbmtw9i.ap-south-1.elasticbeanstalk.com/api/deposit/history/${userNodeId}`
      );
  
      const list: HistoryItem[] = res.data.data;
  
      const record = list.find((x) => x.paymentId === paymentId);
  
      if (record && record.paymentStatus === "SUCCESS") {
        setSuccess(true);
      }
    } catch (err) {
      console.log(err);
    }
  };
  

  useEffect(() => {
    // Get deposit data from navigation state
    const state = location.state as { paymentResponse?: PaymentResponse; amount?: number; currency?: string,paymentIdValueForPoll?:string } | null;
    
    if (!state?.paymentResponse) {
      // If no deposit data, redirect back to deposit page
      navigate("/StyloCoin/depositFund");
      return;
    }

    // Generate payment ID (using depositPkId or a random string)
    // const paymentId = state.paymentResponse. 
    //   ? `DEP${state.deposit.depositPkId.toString().padStart(10, '0')}`
    //   : generatePaymentId();

    // Generate wallet address (in real app, this would come from API)
    // const walletAddress = generateWalletAddress(state.currency || "USDT.BEP20");

    // Calculate times
    const now = new Date();
    const expiry = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
    setPaymentIdValue(state.paymentIdValueForPoll ||state.paymentResponse.payment_id)
    setConfirmationData({
      paymentResponse: state.paymentResponse,
      amount: state.amount || state.paymentResponse?.pay_amount || 0,
      currency: state.currency || state.paymentResponse.pay_currency || "USDT.BSC",
      paymentId:state.paymentResponse.payment_id,
      walletAddress:state.paymentResponse.pay_address,
      creationTime: formatDateTime(now),
      expiryTime: formatDateTime(expiry),
    });
    console.log("Wallet address received:", confirmationData?.walletAddress);

  }, [location.state, navigate]);


  const getQRValue = () => {
    const addr = confirmationData?.walletAddress;
  
    if (confirmationData?.currency.includes("BSC") || confirmationData?.currency.includes("BEP20")) {
      return `ethereum:${addr}`; // Trust wallet uses ethereum: for BSC, BEP20 & ERC20
    }
  
    if (confirmationData?.currency.includes("TRC20")) {
      return `tron:${addr}`;
    }
  
    if (confirmationData?.currency.includes("BTC")) {
      return `bitcoin:${addr}`;
    }
    console.log("QR Value sent:", addr);

    return addr; // fallback
  };
  


  useEffect(() => {
    if (!paymentIdValue) return; // Wait until value is set
  
    console.log("Starting polling for:", paymentIdValue);
  
    const interval = setInterval(() => {
      pollPaymentStatus(paymentIdValue);
    }, 4000);
  
    return () => clearInterval(interval); // Proper cleanup
  }, [paymentIdValue]);
  

  // const generatePaymentId = (): string => {
  //   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  //   let result = "";
  //   for (let i = 0; i < 26; i++) {
  //     result += chars.charAt(Math.floor(Math.random() * chars.length));
  //   }
  //   return result;
  // };

  // const generateWalletAddress = (currency: string): string => {
  //   // In a real app, this would come from the API
  //   // For now, generate a placeholder address
  //   const prefix = currency.includes("BTC") ? "1" : currency.includes("ETH") || currency.includes("USDT") ? "0x" : "";
  //   const randomHex = Array.from({ length: 40 }, () => 
  //     Math.floor(Math.random() * 16).toString(16)
  //   ).join("");
  //   return `${prefix}${randomHex}`;
  // };

  const formatDateTime = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    
    return `${month}/${day}/${year} ${displayHours}:${minutes}:${seconds} ${ampm}`;
  };

  const copyToClipboard = (text: string) => {
    console.log("Wallet address received:", text);

    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (!confirmationData) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
      {/* Important Reminder */}
      <div className="mb-6 rounded-lg border border-blue-600/30 bg-gradient-to-r from-blue-900/40 to-blue-800/30 p-4 sm:p-6 shadow-lg">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 ring-2 ring-blue-400/30 flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-blue-200 text-lg mb-2">Important Reminder</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Kindly Make sure you send exact amount mention to be paid when you send from your wallet or exchange as they might charge your transaction fee. If you send PARTIAL PAYMENT or EXTRA PAYMENT your ID will not be activated automatically. You will have to contact support team in this case and it can take upto 48 hours for the Solution.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan QR Code Panel */}
        <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-2xl backdrop-blur-sm p-4 sm:p-6 md:p-8">
          <h3 className="font-bold text-white text-xl mb-6">Scan QR Code</h3>
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4 max-w-full">
              <QRCodeSVG
                // value={confirmationData.walletAddress}
                value={getQRValue()}
                size={256}
                level="H"
                includeMargin={true}
                className="max-w-full h-auto"
              />
            </div>
            <div className="w-full bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-white font-mono text-sm break-all">
                {confirmationData.walletAddress}
              </p>
              <button
                onClick={() => copyToClipboard(confirmationData.walletAddress)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Copy Address
              </button>
            </div>
          </div>
        </div>

        {/* Payment Details Panel */}
        <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-2xl backdrop-blur-sm p-4 sm:p-6 md:p-8">
          <h3 className="font-bold text-white text-xl mb-6">Payment Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Amount To Send</p>
              <p className="text-orange-500 font-bold text-lg break-all">
                {confirmationData.amount.toFixed(8)} {confirmationData.currency}
              </p>
              <p className="text-gray-500 text-xs mt-1">(Total confirms needed: 10)</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Received So Far</p>
              <p className="text-gray-300 font-medium">
                0.00000000 {confirmationData.currency} unconfirmed
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <p className="text-yellow-400 font-medium">Waiting for buyer funds...</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Payment Id</p>
              <p className="text-white font-mono text-sm break-all">
                {confirmationData.paymentId}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                (have this handy if you need any support related to this transaction)
              </p>
              <button
                onClick={() => copyToClipboard(confirmationData.paymentId)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Copy Payment ID
              </button>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Creation Time</p>
              <p className="text-white font-medium">{confirmationData.creationTime}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Expiry Time</p>
              <p className="text-white font-medium">{confirmationData.expiryTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">2025 © Mine Cryptos. All Right Reserved</p>
      </div>
       {/* Step 3: Success */}
       {success && (
                <div style={styles.successBox}>
                    <h3>🎉 Deposit Successful!</h3>
                    <p>Your wallet has been credited.</p>
                </div>
            )}
    </div>
  );
}


// ====================
// Inline Styles
// ====================
const styles: { [key: string]: React.CSSProperties } = {
  successBox: {
      background: "#d4ffd4",
      padding: "20px",
      borderRadius: "10px",
      textAlign: "center",
      marginTop: "20px",
  },
};