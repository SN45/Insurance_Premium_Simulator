// web/src/pages/Pay.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  loadStripe,
  type Stripe,
  type PaymentRequest,
  type StripeElementsOptions,
} from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import { api } from '../auth';

type IntentInfo = { clientSecret: string; publishableKey: string };

function CheckoutForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { label: 'Premium payment', amount },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((res) => {
      if (res) setPaymentRequest(pr);
      else setPaymentRequest(null);
    });
  }, [stripe, amount]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setMsg(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // For redirect-based flows in production you would set a success_url/cancel_url
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) setMsg(error.message ?? 'Payment failed');
    else setMsg('Payment succeeded (test).');
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {paymentRequest && <PaymentRequestButtonElement options={{ paymentRequest }} />}

      <PaymentElement onReady={() => setReady(true)} />

      <button
        disabled={!ready}
        className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
      >
        Pay {`$${(amount / 100).toFixed(2)}`}
      </button>

      {msg && <div className="text-sm">{msg}</div>}

      <div className="text-xs text-neutral-500">
        Apple Pay/Google Pay appear when supported by your device/browser. Apple Pay requires
        Safari and domain verification in production.
      </div>
    </form>
  );
}

export default function Pay() {
  const [amount, setAmount] = useState(12784); // cents
  const [info, setInfo] = useState<IntentInfo | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const createIntent = async () => {
    const r = await api.post('/billing/create-intent', { amount });
    const data: IntentInfo = r.data;
    setInfo(data);
    setStripePromise(loadStripe(data.publishableKey));
  };

  const options: StripeElementsOptions | undefined = useMemo(() => {
    if (!info) return undefined;
    const theme = document.documentElement.classList.contains('dark') ? 'night' : 'stripe';
    return {
      clientSecret: info.clientSecret,
      appearance: { theme },
    };
  }, [info]);

  // Re-theme PaymentElement when theme toggles (custom event fired by your ThemeToggle)
  useEffect(() => {
    const handler = () => {
      if (!info) return;
      setInfo({ ...info }); // trigger re-render so appearance picks up new theme
    };
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, [info]);

  return (
    <div className="mx-auto max-w-lg p-6 mt-10 rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800">
      <h2 className="text-xl font-semibold mb-4">Pay Premium</h2>

      {!info ? (
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Amount (USD)</span>
            <input
              type="number"
              value={(amount / 100).toFixed(2)}
              onChange={(e) =>
                setAmount(Math.round(parseFloat(e.target.value || '0') * 100))
              }
              className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800"
            />
          </label>
          <button
            onClick={createIntent}
            className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
          >
            Start Checkout
          </button>
        </div>
      ) : stripePromise && options ? (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm amount={amount} />
        </Elements>
      ) : null}
    </div>
  );
}
