import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Luhn algorithm for credit card validation
const isValidCardNumber = (cardNumber) => {
  const digits = cardNumber.replace(/\s/g, '');
  
  // Must be 13-16 digits
  if (!/^\d{13,16}$/.test(digits)) return false;
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Formatting utilities
const formatters = {
  // Credit card: 1234 5678 9012 3456
  cardNumber: (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : '';
  },
  
  // Expiry: MM/YY
  expiry: (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      let month = digits.slice(0, 2);
      // Ensure month is 01-12
      if (parseInt(month) > 12) month = '12';
      if (parseInt(month) === 0) month = '01';
      return month + (digits.length > 2 ? '/' + digits.slice(2) : '');
    }
    return digits;
  },
  
  // CVV: 123 or 1234
  cvv: (value) => {
    return value.replace(/\D/g, '').slice(0, 4);
  },
  
  // Phone: (123) 456-7890
  phone: (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  },
  
  // Postal code: 12345 or 12345-6789
  postalCode: (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  },
};

// Validation function matching the Zig framework's __validations
const validateForm = (values) => {
  const errors = {};
  
  // email: Validation{ .field_type = .email }
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Must be a valid email address';
  }
  
  // password: Validation{ .field_type = .password }
  if (!values.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(values.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }
  
  // confirm_password: Validation{ .field_type = .password, .target_field = "password", .match = true }
  if (!values.confirmPassword || values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }
  
  // notes: Validation{ .field_type = .string, .required = true, .err = "Notes are required" }
  if (!values.notes) {
    errors.notes = 'Notes are required';
  }
  
  // card_number: Validation{ .field_type = .credit_card }
  if (!values.cardNumber || !isValidCardNumber(values.cardNumber)) {
    errors.cardNumber = 'Must be a valid credit card number';
  }
  
  // expiry: Validation{ .field_type = .expiry, .placeholder = "MM/YY" }
  if (!values.expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry)) {
    errors.expiry = 'Invalid format';
  }
  
  // cvv: Validation{ .field_type = .cvv, .placeholder = "123", .err = "CVV is required" }
  if (!values.cvv || !/^\d{3,4}$/.test(values.cvv)) {
    errors.cvv = 'CVV is required';
  }
  
  // Shipping fields - always validate (the toggle controls visibility in your framework)
  // address: Validation{ .field_type = .string, .required = true }
  if (!values.address) {
    errors.address = 'This field is required';
  }
  
  // state: Validation{ .field_type = .string, .required = true }
  if (!values.state) {
    errors.state = 'This field is required';
  }
  
  // city: Validation{ .field_type = .string, .required = true }
  if (!values.city) {
    errors.city = 'This field is required';
  }
  
  // postal_code: Validation{ .field_type = .string, .required = true }
  if (!values.postalCode) {
    errors.postalCode = 'This field is required';
  }
  
  return errors;
};

// Error Message Component with Tooltip
const ErrorMessage = ({ error, show }) => {
  if (!show || !error) return null;
  
  return (
    <div className="overflow-hidden transition-all duration-300 ease-out max-h-10 opacity-100 mt-1.5">
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <p className="text-xs text-destructive truncate cursor-default max-w-full">
            {error}
          </p>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center"
          sideOffset={8}
          className="bg-[#f97316] text-white border-0 px-3 py-2 text-sm font-medium max-w-xs rounded-lg shadow-lg"
        >
          <p>{error}</p>
          <div 
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 rotate-45 bg-[#f97316]"
          />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

// Styled Select Component
const StyledSelect = ({ placeholder, options, value, onChange, error, showError }) => {
  return (
    <div className="relative flex-1 min-w-[150px]">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className="h-12 bg-white border-gray-200 hover:border-gray-300 transition-colors duration-200 
            focus:ring-2 focus:ring-offset-0 focus:ring-blue-500/20 focus:border-blue-500
            data-[placeholder]:text-muted-foreground/70"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent 
          className="bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="py-3 px-4 cursor-pointer transition-colors duration-150
                hover:bg-gray-50 focus:bg-gray-100 focus:text-gray-900
                data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700
                data-[state=checked]:font-medium"
            >
              <div className="flex items-center gap-3">
                {option.icon && <span className="text-lg">{option.icon}</span>}
                <div>
                  <p className="font-medium">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ErrorMessage error={error} show={showError} />
    </div>
  );
};

// Floating Label Input Component
const FloatingInput = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  showError,
  placeholder = '',
  maxLength,
  inputMode
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || value;
  
  return (
    <div className="relative flex-1 min-w-[150px]">
      <div className="relative">
        <Label 
          htmlFor={name}
          className={`absolute left-3 transition-all duration-200 ease-out pointer-events-none bg-white px-1 z-10
            ${isFloating 
              ? 'top-0 -translate-y-1/2 text-xs text-muted-foreground' 
              : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70'
            }`}
        >
          {label}
        </Label>
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ''}
          maxLength={maxLength}
          inputMode={inputMode}
          className="h-12 transition-all duration-200"
        />
      </div>
      <ErrorMessage error={error} show={showError} />
    </div>
  );
};

// Section Component
const FormSection = ({ title, children, nested = false }) => {
  return (
    <section className={`mb-8 ${nested ? 'border-l-2 border-muted pl-4 mt-4' : ''}`}>
      <p className={`font-semibold mb-5 ${nested ? 'text-sm text-muted-foreground' : 'text-base'}`}>
        {title}
      </p>
      {children}
    </section>
  );
};

// Main Form Component
export default function AccountForm() {
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    notes: '',
    phone: '',
    paymentMethod: '',
    expiry: '',
    cvv: '',
    billingAddress: '',
    cardNumber: '',
    shippingSameAsBilling: true,
    address: '',
    country: '',
    state: '',
    city: '',
    postalCode: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply formatting based on field name
    let formattedValue = value;
    if (formatters[name]) {
      formattedValue = formatters[name](value);
    }
    
    setFormValues(prev => ({ ...prev, [name]: formattedValue }));
    
    if (submitted && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleSelectChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm(formValues);
    setErrors(validationErrors);
    setSubmitted(true);
    
    if (Object.keys(validationErrors).length === 0) {
      console.log('Form submitted:', formValues);
    }
  };
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <Card className="max-w-4xl mx-auto shadow-lg border-0">
          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleSubmit}>
            {/* Account Section */}
            <FormSection title="Account">
              <div className="flex flex-wrap gap-4">
                <FloatingInput
                  label="Email"
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={handleChange}
                  error={errors.email}
                  showError={submitted}
                />
                <FloatingInput
                  label="Password"
                  name="password"
                  type="password"
                  value={formValues.password}
                  onChange={handleChange}
                  error={errors.password}
                  showError={submitted}
                />
                <FloatingInput
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  showError={submitted}
                />
              </div>
              
              {/* Notes */}
              <div className="mt-6">
                <Label htmlFor="notes" className="text-sm text-muted-foreground mb-2 block">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formValues.notes}
                  onChange={handleChange}
                  className="min-h-[100px] transition-all duration-200"
                />
                <ErrorMessage error={errors.notes} show={submitted} />
              </div>
              
              {/* Contact Subsection */}
              <FormSection title="Contact" nested>
                <FloatingInput
                  label="Phone"
                  name="phone"
                  type="text"
                  value={formValues.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  showError={submitted}
                  maxLength={14}
                  inputMode="tel"
                />
              </FormSection>
            </FormSection>
            
            {/* Payment Section */}
            <FormSection title="Payment">
              <StyledSelect
                placeholder="Payment Method"
                value={formValues.paymentMethod}
                onChange={(value) => handleSelectChange('paymentMethod', value)}
                options={[
                  { value: 'credit', label: 'Credit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
                  { value: 'debit', label: 'Debit Card', icon: '🏦', description: 'Direct from your bank' },
                  { value: 'paypal', label: 'PayPal', icon: '🅿️', description: 'Pay with PayPal balance' },
                  { value: 'apple', label: 'Apple Pay', icon: '🍎', description: 'Quick and secure' },
                ]}
              />
              
              <div className="flex flex-wrap gap-4 mt-4">
                <FloatingInput
                  label="Expiry"
                  name="expiry"
                  type="text"
                  placeholder="MM/YY"
                  value={formValues.expiry}
                  onChange={handleChange}
                  error={errors.expiry}
                  showError={submitted}
                  maxLength={5}
                  inputMode="numeric"
                />
                <FloatingInput
                  label="Cvv"
                  name="cvv"
                  type="text"
                  placeholder="123"
                  value={formValues.cvv}
                  onChange={handleChange}
                  error={errors.cvv}
                  showError={submitted}
                  maxLength={4}
                  inputMode="numeric"
                />
                <FloatingInput
                  label="Billing address"
                  name="billingAddress"
                  type="text"
                  value={formValues.billingAddress}
                  onChange={handleChange}
                  error={errors.billingAddress}
                  showError={submitted}
                />
                <FloatingInput
                  label="Card number"
                  name="cardNumber"
                  type="text"
                  maxLength={19}
                  value={formValues.cardNumber}
                  onChange={handleChange}
                  error={errors.cardNumber}
                  showError={submitted}
                  inputMode="numeric"
                />
              </div>
            </FormSection>
            
            {/* Shipping Details Section */}
            <FormSection title="Shipping details">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="shippingSameAsBilling" className="text-sm cursor-pointer">
                  Shipping same as billing
                </Label>
                <Switch
                  id="shippingSameAsBilling"
                  checked={formValues.shippingSameAsBilling}
                  onCheckedChange={(checked) => 
                    setFormValues(prev => ({ ...prev, shippingSameAsBilling: checked }))
                  }
                />
              </div>
            </FormSection>
            
            {/* Shipping Section */}
            <FormSection title="Shipping">
              <div className="space-y-4">
                <FloatingInput
                  label="Address"
                  name="address"
                  type="text"
                  value={formValues.address}
                  onChange={handleChange}
                  error={errors.address}
                  showError={submitted}
                />
                
                <StyledSelect
                  placeholder="Country"
                  value={formValues.country}
                  onChange={(value) => handleSelectChange('country', value)}
                  options={[
                    { value: 'us', label: 'United States', icon: '🇺🇸' },
                    { value: 'ca', label: 'Canada', icon: '🇨🇦' },
                    { value: 'uk', label: 'United Kingdom', icon: '🇬🇧' },
                    { value: 'au', label: 'Australia', icon: '🇦🇺' },
                    { value: 'de', label: 'Germany', icon: '🇩🇪' },
                    { value: 'fr', label: 'France', icon: '🇫🇷' },
                    { value: 'jp', label: 'Japan', icon: '🇯🇵' },
                  ]}
                />
                
                <div className="flex flex-wrap gap-4">
                  <FloatingInput
                    label="State"
                    name="state"
                    type="text"
                    value={formValues.state}
                    onChange={handleChange}
                    error={errors.state}
                    showError={submitted}
                  />
                  <FloatingInput
                    label="City"
                    name="city"
                    type="text"
                    value={formValues.city}
                    onChange={handleChange}
                    error={errors.city}
                    showError={submitted}
                  />
                  <FloatingInput
                    label="Postal code"
                    name="postalCode"
                    type="text"
                    value={formValues.postalCode}
                    onChange={handleChange}
                    error={errors.postalCode}
                    showError={submitted}
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
              </div>
            </FormSection>
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 mt-4 text-base font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
