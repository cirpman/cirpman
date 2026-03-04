import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Upload, User, Building, CreditCard, Signature, Download, CreditCard as CreditCardIcon } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { generateConsultantSubscriptionPDF, downloadPDF } from '@/lib/pdfGenerator';
import { worker } from '@/lib/worker';

const ConsultantSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [consultantSubscriptionPaymentLink, setConsultantSubscriptionPaymentLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    contactAddress: '',
    email: '',
    occupation: '',
    employer: '',
    referredBy: '',
    designation: '',
    placement: '',
    phone: '',
    idNumber: '',
    
    // Next of Kin
    nextOfKinSurname: '',
    nextOfKinOtherNames: '',
    nextOfKinAddress: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
    
    // Bank Account Information
    bankName: '',
    accountName: '',
    accountNumber: '',
    
    // Digital Signature
    digitalSignature: '',
    date: new Date().toISOString().split('T')[0],
    
    // Files
    passportPhoto: null as File | null,
    passportPhotoUrl: null as string | null,
  });

  useEffect(() => {
    fetchPaymentLink();
  }, []);

  const fetchPaymentLink = async () => {
    try {
      const res = await worker.post('get-payment-links', { section: 'Consultant Application' });
      const data = await res.json();
      if (data && data.length > 0) {
        setConsultantSubscriptionPaymentLink(data[0].url);
      }
    } catch (error: any) {
      toast.error('Failed to fetch consultant application payment link: ' + error.message);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'passportPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'passportPhoto') {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error('Passport photo must be less than 5MB');
          return;
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subscriptionData = {
        ...formData,
        passport_photo_url: formData.passportPhotoUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      await worker.post('create-consultant-subscription', subscriptionData);

      toast.success('Consultant application submitted successfully! We will contact you soon.');

      try {
        const pdfBytes = await generateConsultantSubscriptionPDF({
          ...formData,
          passport_photo_url: formData.passportPhotoUrl,
        });
        downloadPDF(pdfBytes, `consultant-application-${formData.firstName}-${formData.lastName}.pdf`);
        toast.success('PDF downloaded successfully!');
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        toast.error('PDF generation failed, but application was saved.');
      }

      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        maritalStatus: '',
        contactAddress: '',
        email: '',
        occupation: '',
        employer: '',
        referredBy: '',
        designation: '',
        placement: '',
        phone: '',
        idNumber: '',
        nextOfKinSurname: '',
        nextOfKinOtherNames: '',
        nextOfKinAddress: '',
        nextOfKinPhone: '',
        nextOfKinRelationship: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        digitalSignature: '',
        date: new Date().toISOString().split('T')[0],
        passportPhoto: null,
        passportPhotoUrl: null,
      });
    } catch (error: any) {
      toast.error('Failed to submit application: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please fill in at least your first name and last name before downloading PDF.');
      return;
    }

    try {
      const pdfBytes = await generateConsultantSubscriptionPDF(formData);
      downloadPDF(pdfBytes, `consultant-application-${formData.firstName}-${formData.lastName}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handlePayNow = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please fill in at least your first name and last name before proceeding to payment.');
      return;
    }

    if (!consultantSubscriptionPaymentLink) {
      toast.error('Payment link not available. Please try again later or contact support.');
      return;
    }

    const finalPaymentLink = consultantSubscriptionPaymentLink;
    
    window.open(finalPaymentLink, '_blank');
    
    toast.success('Payment page opened in new tab. Please complete your application fee payment.');
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20 bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Consultant Application Form
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join our team as a sales representative for Cirpman Homes Ltd
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Sales Representative Application</span>
            </CardTitle>
            <CardDescription>
              Complete this form to apply as a consultant/sales representative
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

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="employer">Employer</Label>
                    <Input
                      id="employer"
                      name="employer"
                      value={formData.employer}
                      onChange={handleInputChange}
                      placeholder="Enter current employer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="placement">Placement/Package</Label>
                    <Input
                      id="placement"
                      name="placement"
                      value={formData.placement}
                      onChange={handleInputChange}
                      placeholder="Enter placement or package"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your ID number"
                    required
                  />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Bank Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Bank Account Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input
                      id="accountName"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      placeholder="Enter account name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Enter account number"
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
                  disabled={!formData.firstName || !formData.lastName}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  type="button"
                  onClick={handlePayNow}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!formData.firstName || !formData.lastName || !formData.email}
                >
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Pay Application Fee
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue px-8 py-3"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
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

export default ConsultantSubscription;
