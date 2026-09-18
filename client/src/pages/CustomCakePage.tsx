import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { customCakeService } from '../services/apiService';
import { Button } from '../components/ui/Button';

export const CustomCakePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [occasion, setOccasion] = useState('');
  const [flavour, setFlavour] = useState('');
  const [weight, setWeight] = useState('1 kg');
  const [theme, setTheme] = useState('');
  const [cakeMessage, setCakeMessage] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [mobileNumber, setMobileNumber] = useState('');
  const [additionalReq, setAdditionalReq] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/custom-cake');
      return;
    }

    if (!requiredDate || !preferredTime.trim() || !mobileNumber.trim() || !additionalReq.trim()) {
      setErrorMsg('Please provide your preferred date, preferred time, contact number, and cake requirements.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let uploadedPath: string | undefined = undefined;
      if (imageFile) {
        uploadedPath = await customCakeService.uploadReferenceImage(user.id, imageFile);
      }

      await customCakeService.submitInquiry({
        occasion: occasion || undefined,
        flavour: flavour || undefined,
        weight: weight || undefined,
        theme: theme || undefined,
        cake_message: cakeMessage || undefined,
        required_date: requiredDate,
        preferred_time: preferredTime || undefined,
        delivery_type: deliveryType,
        mobile_number: mobileNumber,
        additional_requirements: additionalReq || undefined,
        reference_image_path: uploadedPath,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Custom cake submission failure:', err);
      setErrorMsg(err.message || 'Failed to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-stone-900">
          Inquiry Submitted Successfully!
        </h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          Our master baker at Cake Box Kakinada will review your design requirements and issue a personalized quote. You can track this request under your account.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button variant="primary" onClick={() => navigate('/orders')}>
            View My Custom Requests
          </Button>
          <Button variant="outline" onClick={() => setSuccess(false)}>
            Submit Another Design
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Bespoke Celebration Cakes
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
          Design Your Dream Cake
        </h1>
        <p className="text-sm text-stone-500 max-w-lg mx-auto">
          Tell us about your event, preferred flavors, and reference design. Our bakery team will review and quote your request.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-xs">
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Occasion & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Occasion / Event
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. 1st Birthday, Wedding, Anniversary"
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Theme / Style
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Floral, Minimalist Pastel, Superhero"
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
              />
            </div>
          </div>

          {/* Flavour & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Preferred Flavour
              </label>
              <input
                type="text"
                value={flavour}
                onChange={(e) => setFlavour(e.target.value)}
                placeholder="e.g. Belgian Truffle, Red Velvet, Butterscotch"
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Estimated Weight
              </label>
              <select
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900 bg-white"
              >
                <option value="500 gms">500 gms</option>
                <option value="1 kg">1 kg (Serves 6–8)</option>
                <option value="1.5 kg">1.5 kg (Serves 10–12)</option>
                <option value="2 kg">2 kg (Serves 14–16)</option>
                <option value="3 kg+">3 kg or larger (Tiered cake)</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Required Date *
              </label>
              <input
                type="date"
                required
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Preferred Time *
              </label>
              <input
                type="text"
                required
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. 5:00 PM evening"
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
              />
            </div>
          </div>

          {/* Contact Phone & Delivery Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Contact Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                Fulfilment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('DELIVERY')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    deliveryType === 'DELIVERY'
                      ? 'border-amber-800 bg-amber-50 text-amber-900 ring-1 ring-amber-800'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('PICKUP')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    deliveryType === 'PICKUP'
                      ? 'border-amber-800 bg-amber-50 text-amber-900 ring-1 ring-amber-800'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Bakery Pickup
                </button>
              </div>
            </div>
          </div>

          {/* Message on cake */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Message on Cake (Optional)
            </label>
            <input
              type="text"
              value={cakeMessage}
              onChange={(e) => setCakeMessage(e.target.value)}
              placeholder="e.g. Happy Birthday Aarav!"
              className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
            />
          </div>

          {/* Reference Image Upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Reference Design Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-stone-300 hover:border-amber-700 rounded-2xl p-6 text-center transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
                id="custom-cake-file"
              />
              <label htmlFor="custom-cake-file" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-amber-800 block">
                  {imageFile ? imageFile.name : 'Click to select reference photo'}
                </span>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  PNG, JPG or WEBP up to 5MB
                </span>
              </label>
            </div>
          </div>

          {/* Additional details */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Cake Requirements & Description *
            </label>
            <textarea
              rows={3}
              required
              value={additionalReq}
              onChange={(e) => setAdditionalReq(e.target.value)}
              placeholder="Describe color palette, design details, edible toppers, piping style, or specific preferences..."
              className="w-full p-3 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700 text-stone-900"
            />
          </div>

          {/* Rules disclosure */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">💡 Custom Cake Ordering Process & Cancellation Rules:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-stone-600">
              <li>Your submission starts in <strong>PENDING</strong> status.</li>
              <li>Our team reviews the design and replies with a confirmed quotation (<strong>QUOTED</strong>).</li>
              <li>You can then review the price and confirm your order directly from your account.</li>
              <li>Cancellations 14+ days prior receive full refund (less deposit); 7–13 days receive 50% refund or store credit; less than 7 days are non-refundable.</li>
            </ul>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={submitting}
            className="w-full shadow-md"
          >
            Submit Custom Cake Inquiry
          </Button>
        </form>
      </div>
    </div>
  );
};
