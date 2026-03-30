"use client";
import React, { useState } from 'react';
import Modal from '../component/Modal';
import { toast } from 'react-toastify';
import AxiosProvider from '../../provider/AxiosProvider';
import StorageManager from '../../provider/StorageManager';
import { FaStore, FaMoneyBillWave, FaFileInvoice, FaRupeeSign } from 'react-icons/fa';

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

interface AdvancePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: {
        id: string;
        company: string;
        vendor: string;
    } | null;
    poId?: string;
    poData?: {
        po_number: string;
        items: Array<{
            quantity: number;
            rate: number;
            gst_pct?: number;
        }>;
        deductions?: Array<{ amount: number }>;
        advances?: Array<{ amount: number }>;
        total_advances?: number;
        pending_advances?: number;
    };
    onSuccess: () => void;
}

const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
    isOpen, onClose, vendor, poId, poData, onSuccess
}) => {
    const [submitting, setSubmitting] = useState(false);
    const user_id = storage.getUserId();

    const [formData, setFormData] = useState({
        amount: '',
        advance_date: new Date().toISOString().split('T')[0],
        purpose: '',
        notes: ''
    });

    // Calculate PO details if poData is provided
    const getPODetails = () => {
        if (!poData) return null;

        // Calculate amount without GST
        const amountWithoutGst = poData.items?.reduce((sum, item) => {
            return sum + (item.quantity * item.rate);
        }, 0) || 0;

        // Calculate amount with GST
        const amountWithGst = poData.items?.reduce((sum, item) => {
            const itemTotal = item.quantity * item.rate;
            const gstAmount = itemTotal * ((item.gst_pct || 0) / 100);
            return sum + itemTotal + gstAmount;
        }, 0) || 0;

        // Calculate total deductions
        const totalDeductions = poData.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;

        // Calculate total advances already taken
        const totalAdvances = poData.total_advances || poData.advances?.reduce((sum, a) => sum + a.amount, 0) || 0;

        // Calculate net payable and pending balance
        const netPayable = amountWithGst - totalDeductions;
        const pendingBalance = netPayable - totalAdvances;

        // Calculate GST amount
        const gstAmount = amountWithGst - amountWithoutGst;

        return {
            po_number: poData.po_number,
            amount_without_gst: amountWithoutGst,
            amount_with_gst: amountWithGst,
            gst_amount: gstAmount,
            total_deductions: totalDeductions,
            net_payable: netPayable,
            total_advances: totalAdvances,
            pending_balance: pendingBalance,
            item_count: poData.items?.length || 0
        };
    };

    const poDetails = getPODetails();

    const handleSubmit = async () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        // Validate if advance amount exceeds pending balance
        if (poDetails && parseFloat(formData.amount) > poDetails.pending_balance) {
            toast.error(`Advance amount cannot exceed pending balance of ₹${poDetails.pending_balance.toLocaleString('en-IN')}`);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                vendor_id: vendor?.id,
                amount: parseFloat(formData.amount),
                advance_date: formData.advance_date,
                purpose: formData.purpose || `Advance against PO ${poDetails?.po_number || ''}`,
                notes: formData.notes,
                created_by: user_id,
                po_id: poId
            };

            const response = await axiosProvider.post('/advances', payload);

            if (response.data.success) {
                toast.success('Advance payment recorded successfully!');
                if (response.data.po_linked) {
                    toast.success('Advance linked to purchase order.');
                }
                toast.info('Please process the payment from the accounts section to deduct from bank account.');
                onSuccess();
                onClose();
                // Reset form
                setFormData({
                    amount: '',
                    advance_date: new Date().toISOString().split('T')[0],
                    purpose: '',
                    notes: ''
                });
            } else {
                toast.error(response.data.message || 'Failed to record advance');
            }
        } catch (error: any) {
            console.error('Error recording advance:', error);
            toast.error(error.response?.data?.message || 'Failed to record advance payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (!vendor) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Record Advance Payment" size="md">
            {/* Single scrollable container - remove any overflow from Modal and add here */}
            <div className="space-y-4">
                {/* Info Banner */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        This will only record the advance. Payment processing will be handled separately.
                    </p>
                </div>

                {/* Vendor Info */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FaStore className="text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-purple-800">{vendor.company}</h3>
                            <p className="text-sm text-gray-600">{vendor.vendor}</p>
                        </div>
                    </div>
                </div>

                {/* PO Summary Section
                {poDetails && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                            <FaFileInvoice className="text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Purchase Order Summary</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                                <span className="text-gray-600">PO Number:</span>
                                <span className="font-mono font-semibold text-blue-700">{poDetails.po_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Items Count:</span>
                                <span className="font-semibold">{poDetails.item_count} item(s)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal (excl. GST):</span>
                                <span className="font-semibold">₹{poDetails.amount_without_gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">GST Amount ({poDetails.gst_amount > 0 ? ((poDetails.gst_amount / poDetails.amount_without_gst) * 100).toFixed(0) : 0}%):</span>
                                <span className="font-semibold text-green-600">+ ₹{poDetails.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total (incl. GST):</span>
                                <span className="font-semibold">₹{poDetails.amount_with_gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {poDetails.total_deductions > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Deductions:</span>
                                    <span>- ₹{poDetails.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-blue-200 font-bold">
                                <span>Net Payable:</span>
                                <span className="text-blue-700">₹{poDetails.net_payable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {poDetails.total_advances > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Advances Already Taken:</span>
                                    <span>- ₹{poDetails.total_advances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-blue-200 bg-blue-100 p-2 rounded">
                                <span className="font-bold">Pending Balance:</span>
                                <span className={`font-bold ${poDetails.pending_balance < 0 ? 'text-red-600' : 'text-purple-700'}`}>
                                    ₹{poDetails.pending_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                )} */}

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Advance Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                    />
                    {poDetails && poDetails.pending_balance > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum allowed: ₹{poDetails.pending_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    )}
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Advance Date
                    </label>
                    <input
                        type="date"
                        value={formData.advance_date}
                        onChange={(e) => setFormData({ ...formData, advance_date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>

                {/* Purpose */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose (Optional)
                    </label>
                    <input
                        type="text"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., Raw material advance"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows={2}
                        placeholder="Additional notes..."
                    />
                </div>

                {/* Enhanced Advance Summary */}
                {formData.amount && poDetails && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                            <FaMoneyBillWave className="text-purple-600" />
                            Advance Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                            {/* PO Details */}
                            <div className="bg-white p-3 rounded-md mb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 font-medium">PO Number:</span>
                                    <span className="font-mono font-semibold text-blue-600">{poDetails.po_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">PO Total Value:</span>
                                    <span className="font-semibold">₹{poDetails.amount_with_gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {poDetails.total_deductions > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Deductions Applied:</span>
                                        <span className="text-red-600">- ₹{poDetails.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-1 border-t mt-1">
                                    <span className="text-gray-600 font-medium">Net Payable Amount:</span>
                                    <span className="font-semibold text-purple-700">₹{poDetails.net_payable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Advance Details */}
                            <div className="space-y-2">
                                {poDetails.total_advances > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Previous Advances:</span>
                                        <span className="text-orange-600">₹{poDetails.total_advances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Current Advance:</span>
                                    <span className="font-semibold text-purple-700 text-base">
                                        ₹{parseFloat(formData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Advance Date:</span>
                                    <span className="font-medium">{new Date(formData.advance_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Linked PO ID:</span>
                                    <span className="text-xs font-mono text-gray-500 truncate ml-2">{poId?.substring(0, 8)}...{poId?.substring(poId.length - 4)}</span>
                                </div>
                                {formData.purpose && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Purpose:</span>
                                        <span className="font-medium text-gray-700">{formData.purpose}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t mt-2">
                                    <span className="font-semibold">Balance After Advance:</span>
                                    <span className="font-semibold text-green-600">
                                        ₹{(poDetails.pending_balance - parseFloat(formData.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 text-center mt-2 pt-2 border-t">
                                    <FaRupeeSign className="inline mr-1" size={10} />
                                    This advance will be adjusted against the final bill
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simple summary when no PO details available */}
                {formData.amount && !poDetails && (
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FaMoneyBillWave className="text-purple-600" />
                            Advance Summary
                        </h4>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-semibold text-purple-700">
                                    ₹{parseFloat(formData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date:</span>
                                <span className="font-semibold">{new Date(formData.advance_date).toLocaleDateString()}</span>
                            </div>
                            {poId && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Linked PO:</span>
                                    <span className="font-mono text-xs">{poId}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !formData.amount || (poDetails && parseFloat(formData.amount) > poDetails.pending_balance)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${submitting || !formData.amount || (poDetails && parseFloat(formData.amount) > poDetails.pending_balance)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <FaMoneyBillWave /> Record Advance
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AdvancePaymentModal;