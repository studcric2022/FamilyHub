import React, { useState, useEffect } from 'react';
import { Wallet, ArrowRight, QrCode, History, Eye, Edit, Trash } from 'lucide-react';
import { useFamilyStore } from '../store/familyStore';
import { supabase } from '../lib/supabase';
import RazorpayPayment from './RazorpayPayment';
import { format } from 'date-fns';

export default function FinanceManager() {
  const { members, transactions, removeMember, updateMember } = useFamilyStore();
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTransactionForProof, setSelectedTransactionForProof] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user?.id);
    });
  }, []);

  // Sort members to put logged-in user first
  const sortedMembers = [...members].sort((a, b) => {
    if (a.user_id === currentUser) return -1;
    if (b.user_id === currentUser) return 1;
    return 0;
  });

  const handlePaymentProofSubmit = async (transactionId: string) => {
    if (!paymentProof && !utrNumber) return;

    try {
      let proofUrl = '';
      
      if (paymentProof) {
        // Upload proof to storage
        const fileName = `payment-proofs/${Date.now()}-${paymentProof.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('public1')
          .upload(fileName, paymentProof);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('public1')
          .getPublicUrl(fileName);

        proofUrl = publicUrl;
      }

      // Update transaction with proof
      await supabase
        .from('transactions')
        .update({
          payment_proof: proofUrl,
          utr_number: utrNumber,
          status: 'completed'
        })
        .eq('id', transactionId);

      setShowProofModal(false);
      setPaymentProof(null);
      setUtrNumber('');
      // Refresh transactions
      await useFamilyStore.getState().fetchTransactions();
    } catch (error) {
      console.error('Failed to save payment proof:', error);
      alert('Failed to save payment proof');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(memberId);
      } catch (error) {
        console.error('Failed to remove member:', error);
        alert('Failed to remove member');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Finance Manager</h2>
      <div className="grid gap-6">
        {sortedMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.relation}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className="text-xl font-bold text-gray-900">₹{member.balance}</p>
                  </div>
                  {member.user_id === currentUser && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Only show RazorpayPayment for other members */}
              {member.user_id !== currentUser && <RazorpayPayment fromMember={member} />}

              {/* Show QR code only for logged-in user */}
              {member.user_id === currentUser && member.upi_qr_code && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <QrCode className="w-5 h-5 text-gray-500" />
                    <h4 className="font-medium text-gray-700">Your UPI QR Code</h4>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={member.upi_qr_code}
                      alt="UPI QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Transaction History</h4>
                  <History className="w-5 h-5 text-gray-500" />
                </div>
                <div className="space-y-3">
                  {transactions
                    .filter((t) => t.from_id === member.id || t.to_id === member.id)
                    .map((transaction) => {
                      const isReceiver = transaction.to_id === member.id;
                      const otherMember = members.find((m) =>
                        isReceiver ? m.id === transaction.from_id : m.id === transaction.to_id
                      );

                      return (
                        <div key={transaction.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <ArrowRight
                                className={`w-4 h-4 ${
                                  isReceiver ? 'text-green-500' : 'text-red-500'
                                }`}
                              />
                              <div>
                                <p className="font-medium text-gray-800">
                                  {isReceiver ? 'Received from' : 'Sent to'} {otherMember?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(transaction.created_at!), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-medium ${
                                  isReceiver ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {isReceiver ? '+' : '-'}₹{transaction.amount}
                              </p>
                              {transaction.status === 'completed' && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                          {transaction.description && (
                            <p className="mt-2 text-sm text-gray-500">{transaction.description}</p>
                          )}
                          {transaction.payment_proof && (
                            <button
                              onClick={() => setSelectedTransaction(transaction.id)}
                              className="mt-2 flex items-center text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              <span>View Payment Proof</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Submit Payment Proof</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">UTR Number</label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter UTR number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowProofModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedTransactionForProof && handlePaymentProofSubmit(selectedTransactionForProof)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Submit Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing payment proof viewer modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <div className="relative">
              <img
                src={transactions.find(t => t.id === selectedTransaction)?.payment_proof}
                alt="Payment proof"
                className="w-full rounded-lg"
              />
              <button
                onClick={() => setSelectedTransaction(null)}
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