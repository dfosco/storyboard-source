import { Link } from 'react-router-dom'
import { Text, Label } from '@primer/react'
import Application from '../../templates/Application/Application.jsx'
import { useRecord } from '../../../storyboard/index.js'

/**
 * Dynamic blog post page.
 * Loads a record from posts.record.json matched by the [slug] URL param.
 * URL: /posts/:slug → finds entry where entry.id === slug
 */
export default function Post() {
  const post = useRecord('posts', 'slug')

  if (!post) {
    return (
      <Application title="Blog" subtitle="Post">
        <section style={{ padding: '2rem' }}>
          <Text as="h1">Post not found</Text>
          <Text as="p" color="fg.muted">
            The post you're looking for doesn't exist.
          </Text>
          <Link to="/posts">← Back to all posts</Link>
        </section>
      </Application>
    )
  }

  return (
    <Application title="Blog" subtitle={post.title}>
      <article style={{ maxWidth: '720px', padding: '2rem' }}>
        <header>
          <Text as="h1" sx={{ fontSize: 4, mb: 2 }}>{post.title}</Text>
          <Text as="p" color="fg.muted" sx={{ mb: 3 }}>
            {post.author} · {post.date}
          </Text>
          {post.summary && (
            <Label variant="accent" sx={{ mb: 3 }}>{post.summary}</Label>
          )}
        </header>
        <Text as="div" sx={{ mt: 3, lineHeight: 1.6 }}>
          {(post.body || '').split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </Text>
        <footer style={{ marginTop: '2rem', borderTop: '1px solid var(--borderColor-muted)', paddingTop: '1rem' }}>
          <Link to="/posts">← Back to all posts</Link>
        </footer>
      </article>
    </Application>
  )
}
