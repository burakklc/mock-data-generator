import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';

export default function BlogPage() {
  return (
    <section className="content-page">
      <SEO
        title="Blog"
        description="Insights, tutorials and announcements about generating high-quality mock data for modern teams."
        canonicalUrl="https://mockdatagenerator.app/blog"
      />
      <h1>Blog</h1>
      <p>Insights, tutorials and announcements about generating high-quality mock data for modern teams.</p>
      <div className="blog-list">
        {blogPosts.map((post) => (
          <article key={post.slug} className="blog-card">
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <Link to={`/blog/${post.slug}`} className="blog-card__link">
              Read more →
            </Link>
          </article>
        ))}
      </div>
      <div className="ad-slot" aria-label="Advertisement placeholder">
        Advertisement placeholder
      </div>
    </section>
  );
}
