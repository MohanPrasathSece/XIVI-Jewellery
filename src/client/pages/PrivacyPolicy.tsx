import { motion } from "framer-motion";

const PrivacyPolicy = () => {
    return (
        <div className="pt-24 min-h-screen bg-slate-50 font-manrope">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-center text-gradient-rose mb-12">
                        Privacy Policy
                    </h1>

                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm space-y-8 text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">1. Information We Collect</h2>
                            <p>
                                When you visit XIVI or make a purchase, we collect certain information to fulfill your order and improve your experience. This includes:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Personal identifiers (Name, Email, Phone Number, Shipping Address).</li>
                                <li>Payment information (processed securely via Razorpay).</li>
                                <li>Order history and preferences.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">2. How We Use Your Information</h2>
                            <p>
                                We use your data securely to:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Process and deliver your orders.</li>
                                <li>Send order updates and tracking information.</li>
                                <li>Respond to your customer service requests.</li>
                                <li>Improve our website and product offerings.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">3. Data Protection</h2>
                            <p>
                                Your security is paramount. We implement strict security measures to protect your personal information. We do not sell, trade, or rent your personal identification information to others.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">4. Cookies</h2>
                            <p>
                                Our website uses cookies to enhance your browsing experience, analyze site traffic, and understand where our audience is coming from. You can choose to disable cookies through your browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">5. Third-Party Services</h2>
                            <p>
                                We may use third-party services (like Razorpay for payments and logistics partners for shipping) who have their own privacy policies. We encourage you to review them.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">6. Contact Us</h2>
                            <p>
                                If you have questions about our Privacy Policy, please contact us at <a href="mailto:hello@xivi.in" className="text-primary hover:underline">hello@xivi.in</a>.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
