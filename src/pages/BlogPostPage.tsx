import { Link, useParams } from 'react-router-dom';
import { getBlogPost } from '../data/blogPosts';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return (
      <section className="content-page">
        <h1>Post not found</h1>
        <p>The article you are looking for does not exist yet.</p>
        <Link to="/blog">← Back to blog</Link>
      </section>
    );
  }

  return (
    <article className="content-page blog-post">
      <p className="blog-post__back">
        <Link to="/blog">← Back to blog</Link>
      </p>
      <h1>{post.title}</h1>
      {post.sections.map((section, index) => (
        <section key={section.heading ?? index}>
          {section.heading && <h2>{section.heading}</h2>}
          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <div className="ad-slot" aria-label="Advertisement placeholder">
        Advertisement placeholder
      </div>
    </article>
  );
}
