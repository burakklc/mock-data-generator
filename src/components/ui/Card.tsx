import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    layoutId?: string;
}

export function Card({ className, children, onClick, layoutId }: CardProps) {
    return (
        <motion.div
            layoutId={layoutId}
            className={cn(
                "bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors cursor-pointer",
                className
            )}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {children}
        </motion.div>
    );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("p-6 pt-0 text-gray-400", className)}>{children}</div>;
}
