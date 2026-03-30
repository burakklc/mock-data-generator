import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Layout, Github, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface DashboardShellProps {
    children: React.ReactNode;
    activeView: 'hero' | 'workspace';
}

export function DashboardShell({ children, activeView }: DashboardShellProps) {
    return (
        <div className="flex-1 flex flex-col font-sans selection:bg-primary/30 min-h-0 w-full relative">
            <main className="flex-1 relative overflow-hidden flex flex-col w-full h-full">
                <AnimatePresence mode="wait">
                    {activeView === 'hero' ? (
                        <motion.div
                            key="hero"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col w-full h-full"
                        >
                            {children}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="workspace"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col w-full h-[calc(100vh-4rem-64px)] overflow-hidden"
                            style={{ height: 'calc(100vh - 4rem - 98px)' }} /* Approx height to fill remaining space */
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
