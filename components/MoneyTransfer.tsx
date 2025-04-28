import React, { useState } from 'react';
import { ArrowRight, Camera, QrCode, Eye } from 'lucide-react';
import { useFamilyStore } from '../store/familyStore';
import type { FamilyMember } from '../types';
import QRCodeScanner from './QRCodeScanner';
import PaymentProofCapture from './PaymentProofCapture';
import { supabase } from '../lib/supabase';
import RazorpayPayment from './RazorpayPayment';

interface MoneyTransferProps {
  fromMember: FamilyMember;
  toMember: FamilyMember;
}

export default function MoneyTransfer({ fromMember, toMember }: MoneyTransferProps) {
  const transferMoney = useFamilyStore((state) => state.transferMoney);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    // Always show QR code first if available
    if (toMember.upi_qr_code) {
      setShowQRScanner(true);
      return;
    }

    // If no QR code, show payment proof capture directly
    setShowPaymentProof(true);
  };

  const handleQRScan = async (qrData: string) => {
    setShowQRScanner(false);
    
    try {
      // First open the UPI app for payment
      window.open(qrData, '_blank');
      
      // Then show payment proof capture
      setShowPaymentProof(true);
    } catch (error) {
      console.error('QR scan failed:', error);
    }
  };

  const handlePaymentProofCapture = async (imageUrl: string) => {
    setPaymentProofUrl(imageUrl);
    setShowPaymentProof(false);

    setLoading(true);
    try {
      await transferMoney(fromMember.id, toMember.id, parseFloat(amount), description, imageUrl);
      setAmount('');
      setDescription('');
      setPaymentProofUrl(null);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowRight className="w-5 h-5 text-gray-500" />
        <h4 className="font-medium text-gray-700">Transfer to {toMember.name}</h4>
      </div>

      <RazorpayPayment fromMember={fromMember} toMember={toMember} />

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
          <input
            type="number"
            required
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            placeholder="e.g., Pocket money"
          />
        </div>

        {toMember.upi_qr_code && (
          <div className="flex flex-col items-center space-y-2">
            <img
              src={toMember.upi_qr_code}
              alt="UPI QR Code"
              className="w-32 h-32"
            />
            <button
              type="button"
              onClick={() => setShowQRScanner(true)}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <QrCode className="w-4 h-4 mr-1" />
              <span>Scan QR Code</span>
            </button>
          </div>
        )}

        {paymentProofUrl && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Proof</label>
            <div className="relative">
              <img
                src={paymentProofUrl}
                alt="Payment proof"
                className="w-full rounded-lg cursor-pointer"
                onClick={() => setShowPaymentProofModal(true)}
              />
              <button
                type="button"
                onClick={() => setShowPaymentProofModal(true)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Transfer'}
          </button>
        </div>
      </form>

      {showQRScanner && (
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {showPaymentProof && (
        <PaymentProofCapture
          onCapture={handlePaymentProofCapture}
          onClose={() => setShowPaymentProof(false)}
        />
      )}

      {showPaymentProofModal && paymentProofUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <div className="relative">
              <img
                src={paymentProofUrl}
                alt="Payment proof"
                className="w-full rounded-lg"
              />
              <button
                onClick={() => setShowPaymentProofModal(false)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md"
              >
                <Eye className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}