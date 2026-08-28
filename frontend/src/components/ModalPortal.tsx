import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  isOpen?: boolean;
  children: React.ReactNode;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ isOpen = true, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(children, document.body);
};
