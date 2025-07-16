"use client"

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
    onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
    return (
        <header className="border-b border-gray-200 bg-white relative z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleSidebar}
                            className="p-2 hover:bg-gray-100"
                            aria-label="Toggle navigation menu"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <Link href="/" className="text-2xl font-bold text-black tracking-tight">
                            ARCH-IV
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}