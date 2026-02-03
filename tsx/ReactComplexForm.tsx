import react, { usestate } from "react";
import { useform, usewatch, controller } from "react-hook-form";
import { zodresolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ============================================
// zod schemas
// ============================================

const country = z.enum(["us", "ca", "uk"]);
const paymentmethod = z.enum(["card", "paypal"]);

// custom zod refinements for complex validations
const luhncheck = (cardnumber: string): boolean => {
  const cleaned = cardnumber.replace(/\s/g, "");
  if (!/^[0-9]{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let iseven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseint(cleaned[i], 10);
    if (iseven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    iseven = !iseven;
  }
  return sum % 10 === 0;
};

const expirycheck = (expiry: string): boolean => {
  const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!regex.test(expiry)) return false;
  const [month, year] = expiry.split("/");
  const expdate = new date(2000 + parseint(year), parseint(month) - 1);
  return expdate >= new date();
};

// account schema
const accountschema = z
  .object({
    email: z
      .string()
      .min(1, "email is required")
      .email("please enter a valid email address"),
    password: z
      .string()
      .min(1, "password is required")
      .min(8, "password must be at least 8 characters")
      .regex(/[a-z]/, "password must contain an uppercase letter")
      .regex(/[0-9]/, "password must contain a number"),
    confirmpassword: z.string().min(1, "please confirm your password"),
    contact: z.object({
      phone: z
        .string()
        .min(1, "phone number is required")
        .regex(/^\+[0-9]{10,14}$/, "please enter a valid phone number"),
    }),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: "passwords do not match",
    path: ["confirmpassword"],
  });

// payment schema
const paymentschema = z.object({
  method: z.string().min(1, "payment method is required"),
  expiry: z
    .string()
    .min(1, "expiry date is required")
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "use mm/yy format")
    .refine(expirycheck, "card has expired"),
  cvv: z
    .string()
    .min(1, "cvv is required")
    .regex(/^[0-9]{3,4}$/, "cvv must be 3-4 digits"),
  billingaddress: z.string().min(1, "billing address is required"),
  cardnumber: z
    .string()
    .min(1, "card number is required")
    .refine(luhncheck, "invalid card number"),
});

// shipping schema
const shippingschema = z.object({
  address: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  postalcode: z.string(),
});

// complete form schema with conditional validation
const checkoutformschema = z
  .object({
    account: accountschema,
    payment: paymentschema,
    shippingdetails: z.object({
      shippingsameasbilling: z.boolean(),
    }),
    shipping: shippingschema,
  })
  .superrefine((data, ctx) => {
    // only validate shipping fields if not same as billing
    if (!data.shippingdetails.shippingsameasbilling) {
      if (!data.shipping.address) {
        ctx.addissue({
          code: z.zodissuecode.custom,
          message: "address is required",
          path: ["shipping", "address"],
        });
      }
      if (!data.shipping.country) {
        ctx.addissue({
          code: z.zodissuecode.custom,
          message: "country is required",
          path: ["shipping", "country"],
        });
      }
      if (!data.shipping.state) {
        ctx.addissue({
          code: z.zodissuecode.custom,
          message: "state is required",
          path: ["shipping", "state"],
        });
      }
      if (!data.shipping.city) {
        ctx.addissue({
          code: z.zodissuecode.custom,
          message: "city is required",
          path: ["shipping", "city"],
        });
      }
      if (!data.shipping.postalcode) {
        ctx.addissue({
          code: z.zodissuecode.custom,
          message: "postal code is required",
          path: ["shipping", "postalcode"],
        });
      }
    }
  });

// infer typescript type from zod schema
type checkoutformdata = z.infer<typeof checkoutformschema>;

// ============================================
// utility functions
// ============================================

const formatcardnumber = (value: string): string => {
  const cleaned = value.replace(/\d/g, "");
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

const formatexpiry = (value: string): string => {
  let formatted = value.replace(/\d/g, "");
  if (formatted.length >= 2) {
    formatted = formatted.slice(0, 2) + "/" + formatted.slice(2, 4);
  }
  return formatted;
};

const formatphone = (value: string): string => {
  return value.replace(/[^\d+]/g, "");
};

// ============================================
// components
// ============================================

interface forminputprops {
  label: string;
  type?: string;
  error?: string;
  autocomplete?: string;
  register: any;
  transform?: (value: string) => string;
}

const forminput: react.fc<forminputprops> = ({
  label,
  type = "text",
  error,
  autocomplete,
  register,
  transform,
}) => {
  const { onchange, ...rest } = register;

  return (
    <div classname={`form-field ${error ? "has-error" : ""}`}>
      <div classname="input-wrapper">
        <input
          type={type}
          placeholder=" "
          autocomplete={autocomplete}
          onchange={(e) => {
            if (transform) {
              e.target.value = transform(e.target.value);
            }
            onchange(e);
          }}
          {...rest}
        />
        <label>{label}</label>
      </div>
      {error && (
        <div classname="error-message">
          <svg
            width="14"
            height="14"
            viewbox="0 0 24 24"
            fill="none"
            stroke="currentcolor"
            strokewidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

interface formselectprops {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  register: any;
}

const formselect: react.fc<formselectprops> = ({
  label,
  options,
  error,
  register,
}) => (
  <div classname={`form-field ${error ? "has-error" : ""}`}>
    <div classname="select-wrapper">
      <select {...register}>
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label>{label}</label>
      <svg
        classname="select-arrow"
        width="12"
        height="12"
        viewbox="0 0 24 24"
        fill="none"
        stroke="currentcolor"
        strokewidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
    {error && (
      <div classname="error-message">
        <svg
          width="14"
          height="14"
          viewbox="0 0 24 24"
          fill="none"
          stroke="currentcolor"
          strokewidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </div>
    )}
  </div>
);

interface toggleprops {
  checked: boolean;
  onchange: (checked: boolean) => void;
}

const toggle: react.fc<toggleprops> = ({ checked, onchange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onclick={() => onchange(!checked)}
    classname={`toggle-switch ${checked ? "toggle-on" : "toggle-off"}`}
  >
    <span classname="toggle-thumb" />
    <span classname="toggle-dots">
      {[...array(6)].map((_, i) => (
        <span key={i} classname="toggle-dot" />
      ))}
    </span>
  </button>
);

// ============================================
// main checkout form
// ============================================

export default function checkoutform() {
  const [issubmitting, setissubmitting] = usestate(false);

  const {
    register,
    handlesubmit,
    control,
    formstate: { errors, issubmitted },
    watch,
  } = useform<checkoutformdata>({
    resolver: zodresolver(checkoutformschema),
    mode: "onblur",
    revalidatemode: "onchange",
    defaultvalues: {
      account: {
        email: "vicrokx@gmail.com",
        password: "",
        confirmpassword: "",
        contact: {
          phone: "+31683214074",
        },
      },
      payment: {
        method: "",
        expiry: "",
        cvv: "123",
        billingaddress: "",
        cardnumber: "9999 9999 9999 9999",
      },
      shippingdetails: {
        shippingsameasbilling: false,
      },
      shipping: {
        address: "",
        country: "",
        state: "",
        city: "",
        postalcode: "",
      },
    },
  });

  const shippingsameasbilling = watch("shippingdetails.shippingsameasbilling");

  const onsubmit = async (data: checkoutformdata) => {
    setissubmitting(true);
    console.log("form submitted:", data);

    // simulate api call
    await new promise((resolve) => settimeout(resolve, 2000));
    setissubmitting(false);
    alert("order submitted successfully!");
  };

  const paymentmethods = [
    { value: "card", label: "credit/debit card" },
    { value: "paypal", label: "paypal" },
  ];

  const countries = [
    { value: "us", label: "united states" },
    { value: "ca", label: "canada" },
    { value: "uk", label: "united kingdom" },
  ];

  // helper to get nested error message
  const geterror = (path: string): string | undefined => {
    const keys = path.split(".");
    let current: any = errors;
    for (const key of keys) {
      if (!current?.[key]) return undefined;
      current = current[key];
    }
    return current?.message;
  };

  const errorcount = object.keys(errors).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=dm+sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=instrument+serif:ital@0;1&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --bg-primary: #fafaf9;
          --bg-card: #ffffff;
          --text-primary: #1a1a1a;
          --text-secondary: #6b6b6b;
          --text-placeholder: #9ca3af;
          --border-default: #e5e5e5;
          --border-focus: #1a1a1a;
          --accent-primary: #facc15;
          --accent-hover: #eab308;
          --error: #dc2626;
          --error-bg: #fef2f2;
          --success: #16a34a;
          --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .checkout-container {
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 40px 20px;
          font-family: 'dm sans', -apple-system, blinkmacsystemfont, sans-serif;
        }

        .checkout-form {
          max-width: 520px;
          margin: 0 auto;
        }

        .form-section {
          margin-bottom: 32px;
          animation: fadeslidein 0.5s ease-out forwards;
          opacity: 0;
        }

        .form-section:nth-child(1) { animation-delay: 0.05s; }
        .form-section:nth-child(2) { animation-delay: 0.1s; }
        .form-section:nth-child(3) { animation-delay: 0.15s; }
        .form-section:nth-child(4) { animation-delay: 0.2s; }
        .form-section:nth-child(5) { animation-delay: 0.25s; }

        @keyframes fadeslidein {
          from {
            opacity: 0;
            transform: translatey(12px);
          }
          to {
            opacity: 1;
            transform: translatey(0);
          }
        }

        .section-header {
          font-family: 'instrument serif', georgia, serif;
          font-size: 24px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .section-divider {
          display: flex;
          align-items: stretch;
          gap: 16px;
        }

        .section-line {
          width: 3px;
          background: linear-gradient(180deg, var(--accent-primary) 0%, transparent 100%);
          border-radius: 2px;
          flex-shrink: 0;
        }

        .section-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .row {
          display: grid;
          gap: 16px;
        }

        .row-2 { grid-template-columns: 1fr 1fr; }
        .row-3 { grid-template-columns: 1fr 1fr 1fr; }

        @media (max-width: 480px) {
          .row-2, .row-3 { grid-template-columns: 1fr; }
        }

        /* form field styles */
        .form-field {
          position: relative;
        }

        .input-wrapper,
        .select-wrapper {
          position: relative;
        }

        .input-wrapper input,
        .select-wrapper select {
          width: 100%;
          padding: 18px 16px 8px;
          font-size: 15px;
          font-family: inherit;
          color: var(--text-primary);
          background: var(--bg-card);
          border: 1.5px solid var(--border-default);
          border-radius: var(--radius-md);
          outline: none;
          transition: var(--transition);
          -webkit-appearance: none;
          appearance: none;
        }

        .select-wrapper select {
          cursor: pointer;
          padding-right: 40px;
        }

        .input-wrapper label,
        .select-wrapper label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translatey(-50%);
          font-size: 15px;
          color: var(--text-placeholder);
          pointer-events: none;
          transition: var(--transition);
          background: transparent;
        }

        .input-wrapper input:focus,
        .select-wrapper select:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.06);
        }

        .input-wrapper input:focus + label,
        .input-wrapper input:not(:placeholder-shown) + label,
        .select-wrapper select:focus + label,
        .select-wrapper select:not([value=""]) + label {
          top: 10px;
          transform: translatey(0);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--text-secondary);
          background: var(--bg-card);
          padding: 0 4px;
          margin-left: -4px;
        }

        .select-arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translatey(-50%);
          pointer-events: none;
          color: var(--text-secondary);
          transition: var(--transition);
        }

        .select-wrapper select:focus ~ .select-arrow {
          transform: translatey(-50%) rotate(180deg);
        }

        /* error states */
        .has-error .input-wrapper input,
        .has-error .select-wrapper select {
          border-color: var(--error);
          background: var(--error-bg);
        }

        .has-error .input-wrapper label,
        .has-error .select-wrapper label {
          color: var(--error);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 13px;
          color: var(--error);
          animation: shake 0.4s ease-out;
        }

        @keyframes shake {
          0%, 100% { transform: translatex(0); }
          20% { transform: translatex(-4px); }
          40% { transform: translatex(4px); }
          60% { transform: translatex(-4px); }
          80% { transform: translatex(4px); }
        }

        /* toggle switch */
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }

        .toggle-label {
          font-size: 15px;
          color: var(--text-primary);
        }

        .toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: var(--transition);
          overflow: hidden;
        }

        .toggle-off { background: var(--border-default); }
        .toggle-on { background: var(--accent-primary); }

        .toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }

        .toggle-on .toggle-thumb {
          transform: translatex(24px);
        }

        .toggle-dots {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translatey(-50%);
          display: grid;
          grid-template-columns: repeat(3, 4px);
          grid-template-rows: repeat(2, 4px);
          gap: 2px;
          opacity: 0.5;
        }

        .toggle-on .toggle-dots {
          right: auto;
          left: 8px;
        }

        .toggle-dot {
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
        }

        /* submit button */
        .submit-btn {
          width: 100%;
          padding: 18px 24px;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          color: white;
          background: var(--text-primary);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
          margin-top: 16px;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2a2a2a;
          transform: translatey(-1px);
          box-shadow: var(--shadow-md);
        }

        .submit-btn:active:not(:disabled) {
          transform: translatey(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* shipping section animation */
        .shipping-fields {
          overflow: hidden;
          animation: expandin 0.3s ease-out forwards;
        }

        @keyframes expandin {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }

        /* error summary */
        .error-summary {
          background: var(--error-bg);
          border: 1px solid var(--error);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 24px;
          animation: fadeslidein 0.3s ease-out;
        }

        .error-summary-title {
          font-weight: 600;
          color: var(--error);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-summary-list {
          list-style: none;
          font-size: 14px;
          color: var(--error);
        }

        .error-summary-list li { padding: 4px 0; }

        /* tech badge */
        .tech-badge {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .tech-badge span {
          background: white;
          border: 1px solid var(--border-default);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }
      `}</style>

      <div classname="checkout-container">
        <form
          classname="checkout-form"
          onsubmit={handlesubmit(onsubmit)}
          novalidate
        >
          {/* tech stack badge */}
          <div classname="tech-badge">
            <span>react hook form</span>
            <span>zod</span>
            <span>typescript</span>
          </div>

          {/* error summary */}
          {issubmitted && errorcount > 0 && (
            <div classname="error-summary">
              <div classname="error-summary-title">
                <svg
                  width="18"
                  height="18"
                  viewbox="0 0 24 24"
                  fill="none"
                  stroke="currentcolor"
                  strokewidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                please fix the errors below
              </div>
            </div>
          )}

          {/* account section */}
          <div classname="form-section">
            <h2 classname="section-header">account</h2>
            <div classname="row row-2">
              <forminput
                label="email"
                type="email"
                register={register("account.email")}
                error={geterror("account.email")}
                autocomplete="email"
              />
              <forminput
                label="password"
                type="password"
                register={register("account.password")}
                error={geterror("account.password")}
                autocomplete="new-password"
              />
            </div>
            <forminput
              label="confirm password"
              type="password"
              register={register("account.confirmpassword")}
              error={geterror("account.confirmpassword")}
              autocomplete="new-password"
            />
          </div>

          {/* contact section */}
          <div classname="form-section">
            <div classname="section-divider">
              <div classname="section-line" />
              <div classname="section-content">
                <h3
                  classname="section-header"
                  style={{ marginbottom: 8, fontsize: 18 }}
                >
                  contact
                </h3>
                <forminput
                  label="phone"
                  type="tel"
                  register={register("account.contact.phone")}
                  error={geterror("account.contact.phone")}
                  autocomplete="tel"
                  transform={formatphone}
                />
              </div>
            </div>
          </div>

          {/* payment section */}
          <div classname="form-section">
            <h2 classname="section-header">payment</h2>
            <formselect
              label="payment method"
              register={register("payment.method")}
              options={paymentmethods}
              error={geterror("payment.method")}
            />
            <div classname="row row-3">
              <forminput
                label="expiry"
                register={register("payment.expiry")}
                error={geterror("payment.expiry")}
                autocomplete="cc-exp"
                transform={formatexpiry}
              />
              <forminput
                label="cvv"
                register={register("payment.cvv")}
                error={geterror("payment.cvv")}
                autocomplete="cc-csc"
                transform={(v) => v.replace(/\d/g, "").slice(0, 4)}
              />
              <forminput
                label="billing address"
                register={register("payment.billingaddress")}
                error={geterror("payment.billingaddress")}
                autocomplete="billing street-address"
              />
            </div>
            <forminput
              label="card number"
              register={register("payment.cardnumber")}
              error={geterror("payment.cardnumber")}
              autocomplete="cc-number"
              transform={(v) => formatcardnumber(v).slice(0, 19)}
            />
          </div>

          {/* shipping details section */}
          <div classname="form-section">
            <h2 classname="section-header">shipping details</h2>
            <div classname="toggle-row">
              <span classname="toggle-label">shipping same as billing</span>
              <controller
                name="shippingdetails.shippingsameasbilling"
                control={control}
                render={({ field }) => (
                  <toggle checked={field.value} onchange={field.onchange} />
                )}
              />
            </div>

            {/* conditional shipping fields */}
            {!shippingsameasbilling && (
              <div classname="shipping-fields">
                <div style={{ margintop: 16 }}>
                  <h3
                    classname="section-header"
                    style={{ fontsize: 18, marginbottom: 16 }}
                  >
                    shipping
                  </h3>
                  <div classname="section-content">
                    <forminput
                      label="address"
                      register={register("shipping.address")}
                      error={geterror("shipping.address")}
                      autocomplete="shipping street-address"
                    />
                    <formselect
                      label="country"
                      register={register("shipping.country")}
                      options={countries}
                      error={geterror("shipping.country")}
                    />
                    <div classname="row row-2">
                      <forminput
                        label="state"
                        register={register("shipping.state")}
                        error={geterror("shipping.state")}
                        autocomplete="shipping address-level1"
                      />
                      <forminput
                        label="city"
                        register={register("shipping.city")}
                        error={geterror("shipping.city")}
                        autocomplete="shipping address-level2"
                      />
                    </div>
                    <forminput
                      label="postal code"
                      register={register("shipping.postalcode")}
                      error={geterror("shipping.postalcode")}
                      autocomplete="shipping postal-code"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* submit button */}
          <button type="submit" classname="submit-btn" disabled={issubmitting}>
            {issubmitting && <span classname="spinner" />}
            {issubmitting ? "processing..." : "submit"}
          </button>
        </form>
      </div>
    </>
  );
}
