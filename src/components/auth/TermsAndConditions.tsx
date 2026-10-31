// Bandookwale Terms and Conditions shown in the sign-up preview modal.
// Text in [square brackets] must be filled in before publishing.

export const TERMS_LAST_UPDATED = "Oct 31, 2026";

type Block =
  | { p: string }
  | { ul: string[] }
  | { ol: string[]; lead: string };

interface Section {
  title: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Acceptance and eligibility",
    blocks: [
      { p: '1.1 Bandookwale ("Bandookwale", "we", "us") is operated by Luthra Gun House Private Limited, a company incorporated on 5 February 2021 under the Companies Act, 2013 (CIN: U29299PB2021PTC052716), with its registered office at Amritsar Road, G.T. Road, Batala, District Gurdaspur, Punjab 143505 (GSTIN: [GSTIN]; Arms Dealer Licence No.: [licence number]). By accessing the website, creating an account or placing an order, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the website.' },
      { p: "1.2 You may use the website and place orders only if you:" },
      {
        ul: [
          "are at least 18 years old (or the minimum age set by law for the product you are buying, if higher);",
          "are a resident of India with a valid Indian delivery address;",
          "are legally capable of entering into a binding contract under the Indian Contract Act, 1872; and",
          "hold every licence, permit or authorisation that the law requires for the product you are ordering.",
        ],
      },
      { p: "1.3 We may ask for proof of age, identity, address and licence at any time, and may refuse or cancel any order if you cannot provide it." },
    ],
  },
  {
    title: "2. Regulated products and legal compliance",
    blocks: [
      { p: "2.1 Many products on the website are regulated under the Arms Act, 1959, the Arms Rules, 2016 and related state rules. You are solely responsible for knowing and following the law that applies to you, including in your state of residence." },
      { p: "2.2 Air guns within the licence-free limit. Air rifles and air pistols with muzzle energy of 20 joules or less and a bore of 0.177 inch (4.5 mm) or less are sold only against valid government photo identification and proof of residence. The muzzle energy and bore of each product are stated on its product page." },
      { p: "2.3 Licensable products. Air weapons above that limit, firearms, ammunition and any other product that requires a licence are sold only to buyers holding a valid arms licence that covers the product, through an authorised dealer. Delivery takes place only after the licence has been verified and any entry or endorsement required by law has been made." },
      { p: "2.4 You must upload or present clear copies of the documents we request. We may verify them with the issuing authority, and may report forged, altered or invalid documents to the police." },
      { p: "2.5 We may refuse, cancel or hold any order where we believe the sale may be unlawful, the documents are incomplete or doubtful, or the product is intended for an unlawful purpose. Where a paid order is cancelled under this clause, we refund the amount paid as set out in Section 5." },
      { p: "2.6 You must not resell, transfer, export or modify any product in breach of the law, or use any product to harm, threaten or intimidate any person or animal." },
    ],
  },
  {
    title: "3. Accounts",
    blocks: [
      { p: "3.1 You need an account to place an order. The information you give must be true, complete and kept up to date, and each person may hold only one account." },
      { p: "3.2 You are responsible for keeping your password confidential and for all activity under your account. Tell us at sourabhluthra001@gmail.com immediately if you suspect unauthorised use." },
      { p: "3.3 We may suspend or close an account, and cancel pending orders, if you breach these Terms, provide false information or documents, or if we are required to do so by law or by a government authority." },
    ],
  },
  {
    title: "4. Orders, pricing and payment",
    blocks: [
      { p: "4.1 Prices are in Indian Rupees and include GST unless stated otherwise. Shipping charges are shown before you confirm the order. We may correct obvious pricing or listing errors, and will offer you a refund or the corrected price if one affects your order." },
      { p: "4.2 Placing an order is an offer to buy. A contract is formed only when we verify your payment and documents and confirm the order. Until then, we may decline the order for any lawful reason." },
      {
        lead: "4.3 How payment works:",
        ol: [
          "When you place an order you receive a unique order reference (for example BW20261031-XXXXXX).",
          "You pay the order total by one of the methods shown at checkout, such as bank transfer or UPI, quoting the order reference.",
          "You submit the payment details on the website: the payment method, amount, transaction reference, payment date and a clear image of the receipt.",
          "Our team checks the payment against our bank records, normally within [1–2 business days].",
          "If the payment is verified, the order is confirmed and you are notified by email. If it is rejected, you are notified by email with the reason, and you may submit corrected details for the same order reference.",
        ],
      },
      { p: "4.4 Stock for an order is reserved while its payment is under review. If a payment is rejected or not submitted within [48 hours], the reserved stock is released and the order may be cancelled." },
      { p: "4.5 Submitting false, edited or someone else's payment receipts is a breach of these Terms and may be reported to the police. We never ask for your card details, UPI PIN, OTP or banking password." },
    ],
  },
  {
    title: "5. Shipping, cancellations, final sale and refunds",
    blocks: [
      { p: "5.1 Shipping. We ship only within India and only to places where the product may lawfully be delivered. Delivery times shown are estimates. Licensable products may need to be collected in person, or delivered only to the licence holder against identity and licence verification." },
      { p: "5.2 Delivery checks. The person receiving the parcel may be asked to show identification. Please inspect the parcel on delivery and report visible damage or missing items within [48 hours] with photos or an unboxing video." },
      { p: "5.3 Cancellation by you. You may cancel an order at no charge before it is dispatched. Once an order has been dispatched, it cannot be cancelled." },
      { p: "5.4 No returns. All sales are final. We do not accept returns or exchanges for change of mind, wrong selection, or any other reason once an order has been delivered. The only exception is where the law requires otherwise: if a product arrives damaged, defective or different from what you ordered and you report it within [48 hours] as set out in 5.2, we will repair, replace or refund it after inspection." },
      { p: "5.5 Refunds. Approved refunds, including refunds for rejected or cancelled orders, are paid to the original payment account within [7 business days] of approval. Bank charges for the original transfer are not refundable unless the cancellation was our fault." },
    ],
  },
  {
    title: "6. Use of the website, intellectual property and privacy",
    blocks: [
      { p: "6.1 You must not use the website to break the law, upload false or harmful content, attempt to access other users' accounts or our systems, scrape data, or interfere with the website's security or operation." },
      { p: "6.2 All content on the website, including the Bandookwale name and logo (a brand of Luthra Gun House Private Limited), text, images and software, belongs to us or our licensors. You may not copy or reuse it without our written permission. Product brand names belong to their respective owners." },
      { p: "6.3 We collect and use your personal data, including identity, address, licence and payment documents, to process orders, verify legal eligibility, prevent fraud and meet legal obligations. We handle it under the Digital Personal Data Protection Act, 2023 and our Privacy Policy. We may share it with courier partners, payment verification staff and government or police authorities where the law requires. We do not sell your personal data." },
      { p: "6.4 We keep transaction and licence records for as long as the Arms Rules, tax law and other laws require, even if you close your account." },
    ],
  },
  {
    title: "7. Liability, disputes and contact",
    blocks: [
      { p: "7.1 Safe use. You must use, store and transport every product safely, follow the manufacturer's instructions, and keep products away from children and unauthorised persons. We are not liable for injury, loss or damage caused by misuse, modification, negligent storage or unlawful use." },
      { p: "7.2 Limitation of liability. To the extent the law allows, our total liability for any claim relating to an order is limited to the amount you paid for that order. We are not liable for indirect or consequential loss. Nothing in these Terms limits rights you have under the Consumer Protection Act, 2019." },
      { p: "7.3 Indemnity. You will compensate us for losses, fines and claims arising from your breach of these Terms or of the law, including the use of false documents." },
      { p: "7.4 Governing law. These Terms are governed by the laws of India. Subject to your rights as a consumer, courts at Gurdaspur, Punjab have exclusive jurisdiction over disputes." },
      { p: "7.5 Grievance Officer. Under the Consumer Protection (E-Commerce) Rules, 2020, complaints can be sent to our Grievance Officer: [Name], [Designation], Luthra Gun House Private Limited, Amritsar Road, G.T. Road, Batala, District Gurdaspur, Punjab 143505. Email: [email]. We acknowledge complaints within 48 hours and aim to resolve them within one month." },
      { p: "7.6 Changes. We may update these Terms. The version in force when you place an order applies to that order, and the date at the top shows when they were last updated." },
      { p: "7.7 Contact. Luthra Gun House Private Limited (Bandookwale), Amritsar Road, G.T. Road, Batala, District Gurdaspur, Punjab 143505. Email: sourabhluthra001@gmail.com." },
    ],
  },
];

export default function TermsAndConditions() {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <header>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bandookwale Terms and Conditions</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Last updated: {TERMS_LAST_UPDATED}</p>
        <p className="mt-3">These Terms govern your use of bandookwale.com and any purchase made through it.</p>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.title} className="space-y-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{section.title}</h3>
          {section.blocks.map((block, i) =>
            "p" in block ? (
              <p key={i}>{block.p}</p>
            ) : "ul" in block ? (
              <ul key={i} className="list-disc space-y-1 pl-6">
                {block.ul.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <div key={i}>
                <p>{block.lead}</p>
                <ol className="mt-1 list-decimal space-y-1 pl-6">
                  {block.ol.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </div>
            )
          )}
        </section>
      ))}
    </article>
  );
}
