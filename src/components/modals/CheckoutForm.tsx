
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Trip } from '../../types';

interface CheckoutFormProps {
  trip: Trip;
  onSucceed: () => void;
}

export const CheckoutForm = ({ trip, onSucceed }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: trip.amount,
          metadata: { tripId: trip.id, customerName: trip.customerName }
        }),
      });

      const { clientSecret, error: backendError } = await response.json();
      if (backendError) throw new Error(backendError);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement) as any,
          billing_details: { name: trip.customerName },
        },
      });

      if (result.error) {
        setError(result.error.message || 'حدث خطأ في الدفع');
      } else if (result.paymentIntent.status === 'succeeded') {
        onSucceed();
      }
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
        }} />
      </div>
      {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
      <button
        disabled={!stripe || processing}
        type="submit"
        className="w-full bg-gold text-white py-4 rounded-2xl font-black shadow-lg shadow-gold/20 hover:bg-dark transition-all disabled:opacity-50"
      >
        {processing ? 'جاري المعالجة...' : `دفع ${trip.amount} BHD الآن`}
      </button>
    </form>
  );
};
