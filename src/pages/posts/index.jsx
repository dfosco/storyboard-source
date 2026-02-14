import { Link } from 'react-router-dom'
import { Text } from '@primer/react'
import Application from '../../templates/Application/Application.jsx'
import { useRecords } from '../../../storyboard/index.js'

/**
 * Blog post listing page.
 * Loads all entries from posts.record.json.
 */
export default function PostsIndex() {
  const posts = useRecords('posts')

  return (
    <Application title="Blog" subtitle="All Posts">
      <section style={{ maxWidth: '720px', padding: '2rem' }}>
        <Text as="h1" sx={{ fontSize: 4, mb: 3 }}>Blog</Text>
        {posts.map((post) => (
          <article key={post.id} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--borderColor-muted)' }}>
            <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
              <Text as="h2" sx={{ fontSize: 2, color: 'accent.fg' }}>{post.title}</Text>
            </Link>
            <Text as="p" color="fg.muted" sx={{ fontSize: 1, mt: 1 }}>
              {post.author} · {post.date}
            </Text>
            {post.summary && (
              <Text as="p" sx={{ mt: 1 }}>{post.summary}</Text>
            )}
          </article>
        ))}
      </section>
    </Application>
  )
}
