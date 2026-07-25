import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  delay = 0,
}) => {
  const hoverProps = hoverEffect
    ? {
        whileHover: { 
          y: -4, 
          scale: 1.01,
          boxShadow: '0 20px 40px 0 rgba(139, 92, 246, 0.08)' 
        },
        whileTap: { scale: 0.99 },
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      {...hoverProps}
      onClick={onClick}
      className={`glass rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
      {children}
    </motion.div>
  );
};
