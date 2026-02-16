interface LogoProps {
    className?: string;
    iconSize?: number;
    textSize?: string;
    showText?: boolean;
}

export default function Logo({
    className = "",
    textSize = "text-2xl",
    showText = true
}: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {showText && (
                <div className="flex flex-col">
                    <h1 className={`${textSize} font-black tracking-tighter leading-none`}>
                        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent uppercase">
                            MTA
                        </span>
                        <span className="text-foreground ml-1">Analytics</span>
                    </h1>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none mt-1">
                        Painel de Controle
                    </span>
                </div>
            )}
        </div>
    );
}
