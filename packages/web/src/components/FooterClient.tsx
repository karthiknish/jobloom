"use client";

import { motion } from "framer-motion";

export function FooterClient({ children }: { children: React.ReactNode }) {
    return (
        <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-foreground"
        >
            {children}
        </motion.footer>
    );
}
