
import React from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  image_url: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Joseph M Oluwaseun',
    role: 'Managing Director',
    image_url: '/lovable-uploads/THE TEAM/Joseph M Oluwaseun - Managing Director.jpg',
  },
  {
    name: 'Queen O Oluwaseun',
    role: 'Deputy Managing Director',
    image_url: '/lovable-uploads/THE TEAM/Queen O Oluwaseun - Deputy Managing Director.jpg',
  },
  {
    name: 'Obute Gabriel Ike',
    role: 'General Manager',
    image_url: '/lovable-uploads/THE TEAM/Obute Gabriel Ike - General Manager.jpg',
  },
  {
    name: 'Chinecherem Chimaoluya Obinwanne',
    role: 'Admin Manager HR',
    image_url: '/lovable-uploads/THE TEAM/Chinecherem Chimaoluya Obinwanne - Admin Manager HR.jpg',
  },
  {
    name: 'Joy Ene Ochube',
    role: 'Sales Manager',
    image_url: '/lovable-uploads/THE TEAM/Joy Ene Ochube - Sales Manager.jpg',
  },
  {
    name: 'Alice Yusuf',
    role: 'Assistant Sales Manager',
    image_url: '/lovable-uploads/THE TEAM/Alice Yusuf - Assistant Sales Manager.jpg',
  },
  {
    name: 'Joyce Gmada Ibrahim',
    role: 'Media & Advertising Officer',
    image_url: '/lovable-uploads/THE TEAM/Joyce Gmada Ibrahim - Media & Advertising Officer.jpg',
  },
  {
    name: 'Olabode Sunday Kolade',
    role: 'Technical Personnel',
    image_url: '/lovable-uploads/THE TEAM/Olabode Sunday Kolade - Technical Personnel.jpg',
  },
  {
    name: 'Maris Okoeror',
    role: 'Front Desk Officer',
    image_url: '/lovable-uploads/THE TEAM/Maris Okoeror - Front Desk Officer .jpg',
  },
  {
    name: 'Wisdom Matthew Omokhudu',
    role: 'Account and Finance Officer',
    image_url: '/lovable-uploads/THE TEAM/Wisdom Matthew Omokhudu - Account and Finane Officer.jpg',
  },
];

const About = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About Us
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Cirpman Homes Ltd (CAC RC: 7114480) is an indigenous Real Estate company committed to providing tailored solutions that reflect local values and global standards.
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Company Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="max-w-4xl mx-auto text-lg text-gray-600 leading-relaxed">
            <p className="mb-6">
              Cirpman Homes Ltd (CAC RC: 7114480) is an indigenous Real Estate company committed to providing tailored solutions that reflect local values and global standards. We have been at the forefront of providing accessible and transparent property investment opportunities.
            </p>
            <p className="mb-6">
              We believe that everyone deserves the opportunity to build wealth through real estate, and we've designed our platform to make that possible through innovative financing solutions and comprehensive support.
            </p>
          </div>
        </div>
        {/* Leadership Team */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">Leadership Team</h2>
          {teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-32 h-32 mx-auto mb-4 overflow-hidden rounded-full">
                      {member.image_url ? (
                        <img
                          src={member.image_url}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                    <p className="text-gray-600">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Team Members</h3>
              <p className="text-gray-500">Team member information will be available soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
