import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Calendar, MapPin, CreditCard as CreditCardIcon, User, Signature, Download } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { generateCustomerSubscriptionPDF, downloadPDF } from '@/lib/pdfGenerator';
import { worker } from '@/lib/worker';

const CustomerSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [customerSubscriptionPaymentLink, setCustomerSubscriptionPaymentLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Personal Information
    surname: '',
    middleName: '',
    firstName: '',
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    contactAddress: '',
    email: '',
    occupation: '',
    referredBy: '',
    designation: '',
    phone: '',
    
    // Package & Payment
    selectedPackages: [] as string[],
    duration: '',
    paymentPlan: '',
    plotSize: '',
    numberOfPlots: '',
    
    // Next of Kin
    nextOfKinSurname: '',
    nextOfKinOtherNames: '',
    nextOfKinAddress: '',
    nextOfKinPhone: '',
    nextOfKinIdNumber: '',
    nextOfKinRelationship: '',
    
    // Digital Signature
    digitalSignature: '',
    date: new Date().toISOString().split('T')[0],
    
    // Files
    passportPhoto: null as File | null,
    passportPhotoUrl: null as string | null,
  });

  const [installmentPreview, setInstallmentPreview] = useState({
    monthlyPayment: 0,
    totalAmount: 0,
    firstDeposit: 0
  });

  useEffect(() => {
    fetchProperties();
    fetchPaymentLink();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await worker.post('get-properties', {});
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : data.properties || []);
    } catch (error: any) {
      toast.error('Failed to fetch properties: ' + error.message);
    }
  };

  const fetchPaymentLink = async () => {
    try {
      const res = await worker.post('get-payment-links', { section: 'customer-subscription' });
      const data = await res.json();
      if (data && data.length > 0) {
        setCustomerSubscriptionPaymentLink(data[0].url);
      }
    } catch (error: any) {
      console.error('Error fetching payment link:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePackageSelection = (propertyId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPackages: prev.selectedPackages.includes(propertyId)
        ? prev.selectedPackages.filter(id => id !== propertyId)
        : [...prev.selectedPackages, propertyId]
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'passportPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Passport photo must be less than 5MB');
        return;
      }
      
      if (type === 'passportPhoto') {
        setLoading(true);
        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64Content = event.target?.result as string;
            
            if (!base64Content) {
              toast.error('Failed to read file');
              return;
            }

            try {
              const res = await worker.post('upload', {
                file: base64Content,
                type: file.type
              });
              const { url } = await res.json();
              
              setFormData(prev => ({ ...prev, passportPhoto: file, passportPhotoUrl: url }));
              toast.success('Passport photo uploaded successfully!');
            } catch (error: any) {
              toast.error('Failed to upload passport photo: ' + error.message);
            } finally {
              setLoading(false);
            }
          };
          reader.readAsDataURL(file);
        } catch (error: any) {
          toast.error('Failed to upload passport photo: ' + error.message);
          setLoading(false);
        }
      }
    }
  };

  const calculateInstallment = () => {
    if (formData.duration && formData.plotSize && formData.selectedPackages.length > 0) {
      const selectedProperty = properties.find(p => p.id === formData.selectedPackages[0]);
      if (selectedProperty && selectedProperty.installment_config) {
        const config = selectedProperty.installment_config;
        const sqm = Number(formData.plotSize);
        const pricePerSqm = Number(config.price_per_sqm);
        const totalPrice = sqm * pricePerSqm;
        const firstDeposit = (Number(config.min_deposit_percentage) / 100) * totalPrice;
        const remaining = totalPrice - firstDeposit;
        const months = Number(formData.duration);
        const monthlyInterest = Number(config.monthly_interest_rate) / 100;
        const monthlyPayment = (remaining * (1 + monthlyInterest * months)) / months;
        
        setInstallmentPreview({
          monthlyPayment,
          totalAmount: totalPrice,
          firstDeposit
        });
      }
    }
  };

  useEffect(() => {
    calculateInstallment();
  }, [formData.duration, formData.plotSize, formData.selectedPackages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subscriptionData = {
        ...formData,
        passport_photo_url: formData.passportPhotoUrl,
        installment_preview: installmentPreview,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      await worker.post('create-customer-subscription', subscriptionData);

      toast.success('Subscription submitted successfully! We will contact you soon.');
      
      try {
        const pdfBytes = await generateCustomerSubscriptionPDF({
          ...formData,
          passport_photo_url: formData.passportPhotoUrl,
          installment_preview: installmentPreview,
        });
        downloadPDF(pdfBytes, `customer-subscription-${formData.surname}-${formData.firstName}.pdf`);
        toast.success('PDF downloaded successfully!');
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        toast.error('PDF generation failed, but subscription was saved.');
      }
      
      setFormData({
        surname: '',
        middleName: '',
        firstName: '',
        gender: '',
        dateOfBirth: '',
        maritalStatus: '',
        contactAddress: '',
        email: '',
        occupation: '',
        referredBy: '',
        designation: '',
        phone: '',
        selectedPackages: [],
        duration: '',
        paymentPlan: '',
        plotSize: '',
        numberOfPlots: '',
        nextOfKinSurname: '',
        nextOfKinOtherNames: '',
        nextOfKinAddress: '',
        nextOfKinPhone: '',
        nextOfKinIdNumber: '',
        nextOfKinRelationship: '',
        digitalSignature: '',
        date: new Date().toISOString().split('T')[0],
        passportPhoto: null,
        passportPhotoUrl: null,
      });

    } catch (error: any) {
      toast.error('Failed to submit subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formData.surname || !formData.firstName) {
      toast.error('Please fill in at least your surname and first name before downloading PDF.');
      return;
    }

    try {
      const pdfBytes = await generateCustomerSubscriptionPDF({
        ...formData,
        passport_photo_url: formData.passportPhotoUrl || undefined,
        installment_preview: installmentPreview,
      });
      downloadPDF(pdfBytes, `customer-subscription-${formData.surname}-${formData.firstName}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handlePayNow = () => {
    if (!formData.surname || !formData.firstName) {
      toast.error('Please fill in at least your surname and first name before proceeding to payment.');
      return;
    }

    if (!customerSubscriptionPaymentLink) {
      toast.error('Payment link not available. Please try again later or contact support.');
      return;
    }

    const finalPaymentLink = customerSubscriptionPaymentLink;
    
    window.open(finalPaymentLink, '_blank');
    
    toast.success('Payment page opened in new tab. Please complete your payment.');
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20 bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Customer Subscription Form
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Start your investment journey with Cirpman Homes Ltd
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Installment Payment Subscription</span>
            </CardTitle>
            <CardDescription>
              Complete this form to subscribe to our installment payment plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Passport Photo Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Passport Photo</span>
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="passportPhoto">Upload Passport Photo *</Label>
                  <Input
                    id="passportPhoto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'passportPhoto')}
                    required
                  />
                  <p className="text-sm text-gray-500">Maximum file size: 5MB</p>
                </div>
              </div>

              {/* Package Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Package Selection</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.selectedPackages.includes(property.id)
                          ? 'border-brand-gold bg-brand-gold/10'
                          : 'border-gray-200 hover:border-brand-gold'
                      }`}
                      onClick={() => handlePackageSelection(property.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.selectedPackages.includes(property.id)}
                          onChange={() => {}}
                          className="text-brand-gold"
                        />
                        <div>
                          <h4 className="font-semibold">{property.title}</h4>
                          <p className="text-sm text-gray-600">{property.location}</p>
                          <p className="text-sm text-brand-gold">
                            ₦{property.price_min?.toLocaleString()} - ₦{property.price_max?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration and Payment Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleSelectChange('duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentPlan">Payment Plan *</Label>
                  <Select value={formData.paymentPlan} onValueChange={(value) => handleSelectChange('paymentPlan', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outright">Outright</SelectItem>
                      <SelectItem value="Installment">Installment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Plot Size and Number of Plots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plotSize">Plot Size *</Label>
                  <Select value={formData.plotSize} onValueChange={(value) => handleSelectChange('plotSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plot size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200">200 sqm</SelectItem>
                      <SelectItem value="300">300 sqm</SelectItem>
                      <SelectItem value="corner">Corner Piece (+5% charges)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfPlots">Number of Plots *</Label>
                  <Input
                    id="numberOfPlots"
                    name="numberOfPlots"
                    type="number"
                    min="1"
                    value={formData.numberOfPlots}
                    onChange={handleInputChange}
                    placeholder="Enter number of plots"
                    required
                  />
                </div>
              </div>

              {/* Installment Preview */}
              {formData.paymentPlan === 'Installment' && installmentPreview.monthlyPayment > 0 && (
                <div className="bg-brand-gold/10 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Installment Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">First Deposit:</span>
                      <p className="font-semibold">₦{installmentPreview.firstDeposit.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Payment:</span>
                      <p className="font-semibold">₦{installmentPreview.monthlyPayment.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-semibold">₦{installmentPreview.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surname">Surname *</Label>
                    <Input
                      id="surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      placeholder="Enter surname"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status *</Label>
                    <Select value={formData.maritalStatus} onValueChange={(value) => handleSelectChange('maritalStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactAddress">Contact Address *</Label>
                  <Textarea
                    id="contactAddress"
                    name="contactAddress"
                    value={formData.contactAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your full address"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation/Profession *</Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="Enter occupation"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referredBy">Referred By</Label>
                    <Input
                      id="referredBy"
                      name="referredBy"
                      value={formData.referredBy}
                      onChange={handleInputChange}
                      placeholder="Who referred you?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="Enter designation"
                    />
                  </div>
                </div>
              </div>

              {/* Next of Kin */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Next of Kin Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinSurname">Surname *</Label>
                    <Input
                      id="nextOfKinSurname"
                      name="nextOfKinSurname"
                      value={formData.nextOfKinSurname}
                      onChange={handleInputChange}
                      placeholder="Enter next of kin surname"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinOtherNames">Other Names *</Label>
                    <Input
                      id="nextOfKinOtherNames"
                      name="nextOfKinOtherNames"
                      value={formData.nextOfKinOtherNames}
                      onChange={handleInputChange}
                      placeholder="Enter next of kin other names"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextOfKinAddress">Residential Address *</Label>
                  <Textarea
                    id="nextOfKinAddress"
                    name="nextOfKinAddress"
                    value={formData.nextOfKinAddress}
                    onChange={handleInputChange}
                    placeholder="Enter next of kin address"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinPhone">Contact Number(s) *</Label>
                    <Input
                      id="nextOfKinPhone"
                      name="nextOfKinPhone"
                      type="tel"
                      value={formData.nextOfKinPhone}
                      onChange={handleInputChange}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinIdNumber">ID Number</Label>
                    <Input
                      id="nextOfKinIdNumber"
                      name="nextOfKinIdNumber"
                      value={formData.nextOfKinIdNumber}
                      onChange={handleInputChange}
                      placeholder="Enter ID number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinRelationship">Relationship *</Label>
                    <Input
                      id="nextOfKinRelationship"
                      name="nextOfKinRelationship"
                      value={formData.nextOfKinRelationship}
                      onChange={handleInputChange}
                      placeholder="e.g., Spouse, Parent, Sibling"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Signature className="h-5 w-5" />
                  <span>Digital Signature</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="digitalSignature">Digital Signature *</Label>
                    <Input
                      id="digitalSignature"
                      name="digitalSignature"
                      value={formData.digitalSignature}
                      onChange={handleInputChange}
                      placeholder="Type your full name as signature"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPDF}
                  className="border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-blue"
                  disabled={!formData.surname || !formData.firstName}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  type="button"
                  onClick={handlePayNow}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!formData.surname || !formData.firstName || !formData.email}
                >
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue px-8 py-3"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Subscription'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default CustomerSubscription;
