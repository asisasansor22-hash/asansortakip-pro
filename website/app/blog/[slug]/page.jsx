import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/lib/siteData";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }) {
  const post = posts.find((item) => item.slug === params.slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Asis Asansör Blog`,
    description: post.desc,
    keywords: post.keywords,
    alternates: {
      canonical: `/blog/${post.slug}`
    },
    openGraph: {
      title: post.title,
      description: post.desc,
      type: "article",
      publishedTime: post.date,
      url: `/blog/${post.slug}`
    }
  };
}

export default function BlogDetailPage({ params }) {
  const post = posts.find((item) => item.slug === params.slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.desc,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Asis Asansör"
    },
    publisher: {
      "@type": "Organization",
      name: "Asis Asansör"
    },
    mainEntityOfPage: `/blog/${post.slug}`,
    keywords: post.keywords.join(", ")
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <section className="page-hero">
          <div className="container">
            <div className="breadcrumb">
              <Link href="/">Ana Sayfa</Link> / <Link href="/blog">Blog</Link> / {post.tag}
            </div>
            <h1>{post.title}</h1>
            <p className="lead">{post.desc}</p>
            <div className="article-meta">
              <span>{post.tag}</span>
              <time dateTime={post.date}>{post.date}</time>
              <span>{post.readTime}</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container article-body">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
            <div className="article-cta">
              <h2>Asansörünüz için bakım veya revizyon desteği alın.</h2>
              <p>İstanbul'un tüm ilçelerinde bakım, revizyon ve arıza servis talepleriniz için Asis Asansör ile iletişime geçebilirsiniz.</p>
              <Link className="btn btn-dark" href="/iletisim">İletişime Geç</Link>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
