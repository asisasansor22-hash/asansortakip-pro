import Link from "next/link";
import Reveal from "@/components/Reveal";
import { posts } from "@/lib/siteData";

export const metadata = {
  title: "Asansör Bakım ve Güvenlik Blogu | Asis Asansör",
  description: "Asansör bakım, revizyon, arıza ve güvenlik konularında bina yöneticileri için SEO uyumlu rehber yazılar.",
  alternates: {
    canonical: "/blog"
  }
};

export default function BlogPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">Ana Sayfa / Blog</div>
          <h1>Asansör güvenliği ve bakım rehberi.</h1>
          <p className="lead">
            Bina yöneticileri ve apartman sakinleri için bakım, arıza ve revizyon süreçlerine dair
            site içine gömülü, okunabilir ve SEO uyumlu bilgilendirme yazıları.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container blog-list">
          {posts.map((post) => (
            <Reveal as="article" className="blog-row blog-card-row" key={post.slug}>
              <div className="blog-date">
                <span>{post.tag}</span>
                <time dateTime={post.date}>{post.date}</time>
                <small>{post.readTime}</small>
              </div>
              <div>
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p>{post.desc}</p>
                <Link className="text-link" href={`/blog/${post.slug}`}>
                  Yazıyı Oku
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
