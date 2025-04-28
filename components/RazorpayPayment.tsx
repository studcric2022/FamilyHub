import React, { useState } from 'react';
import { useFamilyStore } from '../store/familyStore';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({ fromMember }: { fromMember: FamilyMember }) {
  const [amount, setAmount] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const { members, transferMoney } = useFamilyStore();

  // Filter out the current member from the list
  const availableMembers = members.filter(m => m.id !== fromMember.id);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedMemberId) return;

    const toMember = members.find(m => m.id === selectedMemberId);
    if (!toMember) return;

    setLoading(true);
    try {
      const options = {
        key: "rzp_test_YTmMl22W3tFlYo",
        amount: parseFloat(amount) * 100,
        currency: "INR",
        name: "FamilyHub",
        description: `Transfer to ${toMember.name}`,
        handler: async function(response: any) {
          try {
            await transferMoney(
              fromMember.id,
              toMember.id,
              parseFloat(amount),
              `Razorpay Payment: ${response.razorpay_payment_id}`
            );
            alert('Payment successful!');
            setAmount('');
            setSelectedMemberId('');
          } catch (error) {
            console.error('Transfer failed:', error);
            alert('Payment successful but transfer failed. Please contact support.');
          }
        },
        prefill: {
          name: fromMember.name,
        },
        notes: {
          fromMember: fromMember.name,
          toMember: toMember.name
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">Transfer Money</h3>
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Member</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
          >
            <option value="">Select a family member</option>
            {availableMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.relation})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
          <input
            type="number"
            min="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
            placeholder="Enter amount"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedMemberId || !amount}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
} 