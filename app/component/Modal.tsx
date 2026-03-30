// component/Modal.tsx
import { ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    maxWidth?: string; // Add custom maxWidth prop
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    maxWidth // Add this to destructuring
}: ModalProps) {
    if (!isOpen) return null;

    // Size classes mapping
    const sizeClasses: Record<string, string> = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-6xl'
    };

    // Get the modal width class
    const getModalWidth = () => {
        if (maxWidth) return maxWidth; // Use custom maxWidth if provided
        return sizeClasses[size] || sizeClasses.md;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className={`inline-block w-full ${getModalWidth()} my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}