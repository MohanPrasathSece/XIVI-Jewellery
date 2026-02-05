import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <img src="/new_logo-removebg-preview.png" alt="XIVI Logo" className="h-16 w-auto animate-pulse" />
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping -z-10" />
                </div>
                <p className="text-sm font-medium tracking-widest text-primary animate-pulse uppercase">
                    XIVI
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;
