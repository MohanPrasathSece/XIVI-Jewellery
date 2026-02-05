import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    Loading XIVI...
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;
