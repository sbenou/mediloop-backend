
import React from 'react';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of Telemedicine in Luxembourg",
      excerpt: "Exploring how digital health is transforming healthcare delivery...",
      category: "Healthcare Technology",
      date: "March 15, 2024",
      slug: "future-telemedicine-luxembourg"
    },
    {
      id: 2,
      title: "Managing Your Digital Prescriptions",
      excerpt: "A comprehensive guide to using digital prescriptions effectively...",
      category: "Patient Guide",
      date: "March 10, 2024",
      slug: "managing-digital-prescriptions"
    },
    {
      id: 3,
      title: "Healthcare Innovation in Europe",
      excerpt: "How European countries are leading in healthcare technology...",
      category: "Industry News",
      date: "March 5, 2024",
      slug: "healthcare-innovation-europe"
    }
  ];

  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Healthcare Blog</h1>
        <p className="text-muted-foreground mb-8">
          Stay updated with the latest in healthcare technology and patient care
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                </div>
                <CardTitle className="text-xl">
                  <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.excerpt}</p>
                <Link 
                  to={`/blog/${post.slug}`} 
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  Read more →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Blog;
