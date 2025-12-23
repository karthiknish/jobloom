#!/usr/bin/env node

/**
 * Create Blog Posts Script for HireAll
 *
 * This script creates blog posts using the admin API endpoint.
 * Make sure to set ADMIN_TOKEN environment variable with a valid admin JWT token.
 *
 * Run with: ADMIN_TOKEN=your_jwt_token node create-blog-posts.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('Error: ADMIN_TOKEN environment variable is required');
  console.log('Usage: ADMIN_TOKEN=your_jwt_token node create-blog-posts.js');
  process.exit(1);
}

const sampleBlogPosts = [
  {
    title: "10 Essential Skills Every Job Seeker Needs in 2025",
    excerpt: "Discover the most in-demand skills that will make you stand out in today's competitive job market.",
    content: "# 10 Essential Skills Every Job Seeker Needs in 2025\n\nIn today's rapidly evolving job market, staying ahead of the curve is crucial for career success.\n\n## 1. Digital Literacy\n\nTechnology proficiency is now a baseline requirement.\n\n## 2. Data Analysis\n\nUnderstanding data trends is increasingly important.\n\n## 3. Communication Skills\n\nSoft skills remain crucial for success.",
    category: "Career Development",
    tags: ["skills", "career"],
    featuredImage: "https://images.pexels.com/photos/3184430/pexels-photo-3184430.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published"
  },
  {
    title: "Mastering Salary Negotiation",
    excerpt: "Learn how to negotiate your salary and benefits package effectively.",
    content: "# Mastering Salary Negotiation\n\nNegotiating your salary is a critical part of the job search process.\n\n## Research Market Rates\n\nUnderstand the market value for your role and experience level.\n\n## Know Your Value\n\nHighlight your achievements and the value you bring to the company.\n\n## Key Tips\n\nBe professional, prepared, and ready to discuss the entire compensation package.",
    category: "Career Development",
    tags: ["salary", "negotiation"],
    featuredImage: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published"
  },
  {
    title: "Building a Personal Brand",
    excerpt: "Learn how to build a compelling personal brand for career growth.",
    content: "# Building a Personal Brand\n\nYour personal brand is how others perceive you professionally.\n\n## Key Components\n\n- Professional identity\n- Values and beliefs\n- Online presence\n\n## Getting Started\n\nDefine your unique value proposition and create consistent content.\n\n## Networking\n\nBuild genuine professional relationships online.",
    category: "Career Development",
    tags: ["personal branding", "career"],
    featuredImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published"
  }
];

/**
 * Make HTTP request to API
 */
function makeAPIRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https://') ? https : http;
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        ...options.headers
      }
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function createBlogPost(postData) {
  const url = `${BASE_URL}/api/blog/admin/posts`;

  try {
    const response = await makeAPIRequest(url, {
      method: 'POST',
      body: postData
    });

    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.data, status: response.status };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createBlogPosts() {
  try {
    console.log('Starting blog posts creation via API...');
    console.log(`API URL: ${BASE_URL}/api/blog/admin/posts`);
    console.log(`Using admin token: ${ADMIN_TOKEN.substring(0, 20)}...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sampleBlogPosts.length; i++) {
      const post = sampleBlogPosts[i];
      console.log(`\nCreating post ${i + 1}/${sampleBlogPosts.length}: "${post.title}"`);

      const result = await createBlogPost(post);

      if (result.success) {
        console.log(`   Success - Post ID: ${result.data.postId}, Slug: ${result.data.slug}`);
        successCount++;
      } else {
        console.log(`   Failed - ${JSON.stringify(result.error)}`);
        if (result.status) {
          console.log(`   Status: ${result.status}`);
        }
        errorCount++;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nBlog posts creation complete!`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Total: ${sampleBlogPosts.length}`);

    if (successCount > 0) {
      console.log('\nBlog posts created:');
      sampleBlogPosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   Category: ${post.category}`);
        console.log(`   Image: ${post.featuredImage}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error creating blog posts:', error);
    process.exit(1);
  }
}

// Run the script
createBlogPosts().then(() => {
  console.log('Blog posts creation complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
