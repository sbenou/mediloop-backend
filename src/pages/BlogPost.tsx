
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams();

  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <Link to="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>
        
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <Badge variant="secondary" className="mb-4">Healthcare Technology</Badge>
            <h1 className="text-4xl font-bold mb-4">
              The Future of Telemedicine in Luxembourg
            </h1>
            <div className="flex items-center text-muted-foreground mb-6">
              <span>March 15, 2024</span>
              <span className="mx-2">•</span>
              <span>5 min read</span>
            </div>
          </header>
          
          <div className="prose max-w-none">
            <p className="text-lg mb-6">
              The healthcare landscape in Luxembourg is rapidly evolving, with telemedicine 
              at the forefront of this transformation. As we look toward the future, 
              digital health solutions are becoming increasingly integral to patient care.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Current State of Digital Health</h2>
            <p className="mb-6">
              Luxembourg has embraced digital health initiatives, with government support 
              and healthcare providers working together to implement comprehensive solutions 
              that benefit both patients and healthcare professionals.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Benefits for Patients</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>Improved access to healthcare services</li>
              <li>Reduced travel time and costs</li>
              <li>Better continuity of care</li>
              <li>Enhanced patient engagement</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">Looking Ahead</h2>
            <p>
              The future holds exciting possibilities for telemedicine in Luxembourg, 
              with advances in AI, remote monitoring, and integrated health platforms 
              promising to further enhance patient care and outcomes.
            </p>
          </div>
        </article>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default BlogPost;
