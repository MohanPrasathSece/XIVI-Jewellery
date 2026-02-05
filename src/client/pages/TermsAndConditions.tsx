import { motion } from "framer-motion";

const TermsAndConditions = () => {
    return (
        <div className="pt-24 min-h-screen bg-slate-50 font-manrope">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-center text-gradient-rose mb-12">
                        Terms & Conditions
                    </h1>

                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm space-y-8 text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">1. Introduction</h2>
                            <p>
                                Welcome to XIVI. By accessing our website and purchasing our silver jewelry, you agree to be bound by these Terms and Conditions. Please read them carefully before making a purchase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">2. Products & Pricing</h2>
                            <p>
                                We strive to display the colors and details of our products as accurately as possible. However, due to monitor discrepancies, we cannot guarantee that your display of color will be accurate.
                            </p>
                            <p className="mt-2">
                                All prices are listed in Indian Rupees (INR) and are subject to change without notice. We reserve the right to modify or discontinue any product at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">3. Orders & Payments</h2>
                            <p>
                                By placing an order, you confirm that all details provided are accurate. We utilize secure payment gateways (Razorpay) for transactions. Orders are subject to acceptance and availability.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">4. Shipping & Delivery</h2>
                            <p>
                                We aim to dispatch orders within 2-3 business days. Delivery times may vary based on location. XIVI is not liable for delays caused by courier partners or unforeseen circumstances.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">5. Returns & Refunds</h2>
                            <p>
                                Due to the nature of our products, we only accept returns for damaged or defective items reported within 48 hours of delivery. Please refer to our Return Policy for detailed information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">6. Intellectual Property</h2>
                            <p>
                                All content on this website, including images, text, and designs, is the property of XIVI and is protected by copyright laws. Unauthorized use is prohibited.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair">7. Contact Information</h2>
                            <p>
                                For any queries regarding these terms, please contact us at <a href="mailto:hello@xivi.in" className="text-primary hover:underline">hello@xivi.in</a>.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
