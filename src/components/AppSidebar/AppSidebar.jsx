import { useNavigate } from 'react-router-dom'
import { ActionList, Text } from '@primer/react'
import styles from './AppSidebar.module.css'

const navItems = [
  { label: 'Overview', path: '/Dashboard' },
  { label: 'Issues', path: '/Dashboard' },
  { label: 'Projects', path: '/Dashboard' },
  { label: 'Views', path: '/Dashboard' },
]

export default function AppSidebar({ orgName, activePage, userInfo }) {
  const navigate = useNavigate()

  return (
    <div className={styles.sidebar}>
      <Text as="p" size="large" weight="bold">
        {orgName || '—'}
      </Text>
      <hr className={styles.divider} />
      <nav>
        <ActionList>
          {navItems.map((item) => (
            <ActionList.Item
              key={item.label}
              active={activePage === item.label}
              onSelect={() => navigate(item.path)}
            >
              {item.label}
            </ActionList.Item>
          ))}
        </ActionList>
      </nav>
      {userInfo && (
        <>
          <hr className={styles.divider} />
          <div className={styles.userInfo}>
            <Text as="p" size="small" className={styles.faded}>{userInfo.name || '—'}</Text>
            <Text as="p" size="small" className={styles.faded}>{userInfo.role || '—'}</Text>
          </div>
        </>
      )}
    </div>
  )
}
