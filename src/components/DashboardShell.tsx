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
        <div className="min-h-screen bg-dark flex flex-col font-sans selection:bg-primary/30">
            {/* HEADER */}
            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-dark/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        M
                    </div>
                    <span className="font-bold text-gray-100 tracking-tight">MockData.net</span>
                </div>

                <nav className="flex items-center gap-6">
                    <a
                        href="https://github.com/burakklc/mock-data-generator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                    </a>
                    <NavLink
                        to="/docs"
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Docs</span>
                    </NavLink>
                </nav>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    {activeView === 'hero' ? (
                        <motion.div
                            key="hero"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            {children}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="workspace"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
