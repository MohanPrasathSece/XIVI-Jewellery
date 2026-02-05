import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
        <div className="flex min-h-screen items-center justify-center bg-gradient-champagne px-4 font-manrope admin-portal">
            <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-glow transition-all animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gradient-rose">XIVI Portal</h1>
                    <p className="text-muted-foreground mt-2">Executive Access Only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Admin Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@xivi.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-xl border-primary/20 focus:ring-primary"
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
                            className="rounded-xl border-primary/20 focus:ring-primary"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full rounded-full bg-gradient-rose text-primary-foreground hover:shadow-glow h-12 transition-all"
                        disabled={loading}
                    >
                        {loading ? "Verifying..." : "Enter Portal"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
