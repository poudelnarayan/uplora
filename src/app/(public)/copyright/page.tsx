"use client";

import PublicLayout from "@/components/layout/PublicLayout";

export default function CopyrightPage() {
  return (
    <PublicLayout title="Copyright Policy">
      <div className="min-h-[calc(100vh-16rem)] flex flex-col space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 py-8">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Understanding your rights and responsibilities when using Uplora's video collaboration platform.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid gap-8 md:grid-cols-2 lg:grid-cols-1 max-w-4xl mx-auto">
          {/* Copyright Notice */}
          <div className="card p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Copyright Notice</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                © {new Date().getFullYear()} Uplora. All rights reserved. The Uplora name, logo, and all related 
                assets are trademarks of their respective owners.
              </p>
              <p>
                This website and its content, including but not limited to text, graphics, logos, icons, 
                images, audio clips, video clips, data compilations, and software, are the property of 
                Uplora or its content suppliers and are protected by copyright laws.
              </p>
            </div>
          </div>

          {/* User Content Rights */}
          <div className="card p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Your Content Rights</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                You retain all ownership rights to the content you upload to Uplora. By uploading content, 
                you grant Uplora a limited license to store, process, and display your content solely for 
                the purpose of providing our services.
              </p>
              <p>
                You are responsible for ensuring that any content you upload does not infringe on the 
                copyright, trademark, or other intellectual property rights of third parties.
              </p>
            </div>
          </div>

          {/* DMCA Takedown Process */}
          <div className="card p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">DMCA Takedown Requests</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you believe content uploaded by users violates your copyright, you may submit a 
                takedown request. We respond to valid DMCA notices in accordance with the Digital 
                Millennium Copyright Act.
              </p>
              <p>
                To submit a takedown request, please contact us through our Contact page and include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your contact information</li>
                <li>Description of the copyrighted work</li>
                <li>URL or location of the infringing material</li>
                <li>Statement of good faith belief</li>
                <li>Statement of accuracy and authorization</li>
                <li>Your physical or electronic signature</li>
              </ul>
            </div>
          </div>

          {/* Fair Use Guidelines */}
          <div className="card p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Fair Use Guidelines</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Fair use allows limited use of copyrighted material for purposes such as criticism, 
                comment, parody, news reporting, teaching, or research. However, fair use is determined 
                on a case-by-case basis.
              </p>
              <p>
                When in doubt, obtain permission from the copyright holder before using their content. 
                Uplora is not responsible for determining fair use, and users assume all risks when 
                claiming fair use protection.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-8 space-y-6 bg-muted/30">
            <h2 className="text-2xl font-semibold text-foreground">Questions?</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have questions about our copyright policy or need to report copyright 
                infringement, please don't hesitate to reach out.
              </p>
              <p>
                Visit our <a href="/contact" className="text-primary hover:underline font-medium">Contact page</a> to 
                get in touch with our team. We typically respond to copyright inquiries within 24-48 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="py-8"></div>
      </div>
    </PublicLayout>
  );
}
