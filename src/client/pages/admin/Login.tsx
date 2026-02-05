import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles } from "lucide-react";

const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast({
                title: "Welcome, Admin",
                description: "Successfully logged in to XIVI portal.",
            });
            navigate("/admin-portal");
        } catch (error: any) {
            toast({
                title: "Access Denied",
                description: error.message || "Invalid credentials.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen font-manrope admin-portal bg-white overflow-hidden">
            {/* Left Side - Image Landing */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="/images/admin-bg.png"
                    alt="Luxury Store Interior"
                    className="absolute inset-0 w-full h-full object-cover animate-pulse-slow"
                />
                <div className="relative z-20 text-center text-white p-12 max-w-lg">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl overflow-hidden">
                        <img src="/new_logo-removebg-preview.png" alt="XIVI Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h2 className="text-4xl font-playfair font-bold mb-6 tracking-wide">XIVI Executive</h2>
                    <p className="text-lg text-white/80 leading-relaxed font-light border-t border-white/10 pt-6">
                        "Elegance is the only beauty that never fades."
                    </p>
                </div>

                <Link
                    to="/"
                    className="absolute top-8 left-8 z-30 flex items-center gap-3 text-white/70 hover:text-white transition-all bg-black/20 hover:bg-black/50 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 text-sm font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Store
                </Link>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative bg-gradient-to-br from-rose-50/50 to-slate-50/50">
                <Link
                    to="/"
                    className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Store
                </Link>

                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex lg:hidden w-16 h-16 bg-white/10 rounded-xl items-center justify-center mb-6 shadow-lg border border-rose-100 overflow-hidden">
                            <img src="/new_logo-removebg-preview.png" alt="XIVI Logo" className="w-12 h-12 object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-playfair">Admin Portal</h1>
                        <p className="text-slate-500">Secure access for management personnel.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 mt-8">
                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@xivi.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="rounded-xl border-slate-200 focus:ring-rose-500 h-12 bg-white/80 backdrop-blur-sm"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Security Key</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="rounded-xl border-slate-200 focus:ring-rose-500 h-12 bg-white/80 backdrop-blur-sm"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-gradient-rose text-white hover:shadow-glow h-12 transition-all font-bold tracking-wide mt-4"
                            disabled={loading}
                        >
                            {loading ? "Authenticating..." : "Access Dashboard"}
                        </Button>
                    </form>

                    <div className="pt-8 mt-8 border-t border-slate-200/60 text-center">
                        <p className="text-xs text-slate-400">
                            &copy; 2026 XIVI Jewelry. <span className="hidden sm:inline">Protected by strict security protocols.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
