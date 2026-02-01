import ContainerLogo from "../components/images/ContainerLog.png"
export default function ContactCTASection() {
    return (
        <section className="relative w-full bg-white py-20 overflow-hidden">
            {/* Background map */}
            <div className="absolute inset-0 opacity-10">
                <img
                    src="/map-bg.png"
                    alt="Map background"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="relative max-w-7xl mx-auto px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left content */}
                    <div>
                        <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-snug">
                            Take The First Step To <br /> Connect And Collect.
                        </h2>

                        <ul className="space-y-4 mb-10">
                            {[
                                "Invest in tangible assets, containers.",
                                "Containers are insured, so capital is insured.",
                                "Fixed rate or high return strategies.",
                                "Buy-back after 3 years.",
                            ].map((item, index) => (
                                <li key={index} className="flex items-center gap-4 text-green-600 text-lg">
                                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-600 text-white font-bold">
                                        ✓
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="space-y-2 text-lg">
                            <p>
                                <span className="text-slate-400">Email </span>
                                <span className="font-semibold text-slate-900">info@buy-to-let.co</span>
                            </p>
                            <p>
                                <span className="text-slate-400">Hong Kong </span>
                                <span className="font-semibold text-slate-900">+852.3001.11.11</span>
                            </p>
                            <p>
                                <span className="text-slate-400">Dubai </span>
                                <span className="font-semibold text-slate-900">+971.4439.63.86</span>
                            </p>
                        </div>

                        <a
                            href="#"
                            className="inline-block mt-6 text-blue-700 font-semibold underline"
                        >
                            Contact us on Telegram
                        </a>
                    </div>

                    {/* Right address card */}
                    <div className="relative">
                        {/* Pin */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            {/* <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                📍
                            </div> */}
                        </div>

                        {/* Card */}
                        <div className="bg-white shadow-xl rounded-2xl p-6 max-w-md ml-auto">
                            <div className="flex gap-4 items-start">
                                {/* Logo - Left */}
                                <img
                                    src={ContainerLogo}
                                    alt="Logo"
                                    className="w-12 h-12 flex-shrink-0"
                                />

                                {/* Content - Right */}
                                <ul className="space-y-2 text-slate-700 text-sm">
                                    <li>• 64 Connaught Road Central, Hong Kong</li>
                                    <li>
                                      •  Level 702, Building 6, Emaar Square, Burj Khalifa Community, Dubai, UAE PO BOX 122347
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
