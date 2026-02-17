import {
  Button, TextInput, ActionMenu, ActionList
} from '@primer/react'
import {
  RepoIcon, SearchIcon, GearIcon, RepoForkedIcon, StarIcon,
  FilterIcon, XCircleFillIcon, ListUnorderedIcon, TableIcon,
  HomeIcon, ProjectIcon, PackageIcon, PeopleIcon, PersonIcon,
  ShieldIcon, GraphIcon, GitPullRequestIcon, EyeIcon,
  LockIcon, CodeIcon, ArchiveIcon, RepoTemplateIcon
} from '@primer/octicons-react'
import Application from '../templates/Application/Application.jsx'
import { useSceneData } from '@storyboard/react'
import styles from './repositories.module.css'

const iconMap = {
  home: HomeIcon,
  repo: RepoIcon,
  project: ProjectIcon,
  package: PackageIcon,
  people: PeopleIcon,
  person: PersonIcon,
  shield: ShieldIcon,
  graph: GraphIcon,
  gear: GearIcon,
  'git-pull-request': GitPullRequestIcon,
  eye: EyeIcon,
  lock: LockIcon,
  code: CodeIcon,
  'repo-forked': RepoForkedIcon,
  archive: ArchiveIcon,
  'repo-template': RepoTemplateIcon,
}

function resolveIcon(icon) {
  if (typeof icon === 'string') return iconMap[icon] || RepoIcon
  return icon
}

function Repositories() {
  const rawTopnav = useSceneData('topnav')
  const topnav = Array.isArray(rawTopnav)
    ? rawTopnav.map(item => ({ ...item, icon: resolveIcon(item.icon) }))
    : []

  const rawSidenav = useSceneData('sidenav')
  const sidenav = Array.isArray(rawSidenav)
    ? rawSidenav.map(item => ({ ...item, icon: resolveIcon(item.icon) }))
    : []

  const rawRepos = useSceneData('repositories')
  const repos = Array.isArray(rawRepos) ? rawRepos : []

  return (
    <Application title="dsp-testing" topnav={topnav} sidenav={sidenav}>
      <div className={styles.content}>
        <header className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>All</h2>
          <Button variant="primary">New repository</Button>
        </header>

        <div className={styles.filterBar}>
          <TextInput
            leadingVisual={FilterIcon}
            placeholder="Filter"
            value="copilot"
            className={styles.filterInput}
            trailingAction={
              <TextInput.Action icon={XCircleFillIcon} aria-label="Clear filter" />
            }
          />
          <TextInput
            leadingVisual={SearchIcon}
            placeholder=""
            aria-label="Search repositories"
            className={styles.searchAction}
          />
        </div>

        <div className={styles.listHeader}>
          <span className={styles.repoCount}>
            <strong>{repos.length} repositories</strong>
          </span>
          <div className={styles.listControls}>
            <ActionMenu>
              <ActionMenu.Button size="small" className={styles.sortButton}>
                Last pushed
              </ActionMenu.Button>
              <ActionMenu.Overlay>
                <ActionList>
                  <ActionList.Item>Last pushed</ActionList.Item>
                  <ActionList.Item>Name</ActionList.Item>
                  <ActionList.Item>Stars</ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewButton} ${styles.viewButtonActive}`} aria-label="List view">
                <ListUnorderedIcon size={16} />
              </button>
              <button className={styles.viewButton} aria-label="Grid view">
                <TableIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        <ul className={styles.repoList}>
          {repos.map(repo => (
            <li key={repo.name} className={styles.repoItem}>
              <div className={styles.repoInfo}>
                <RepoIcon size={16} className={styles.repoIcon} />
                <a href={repo.url} className={styles.repoName}>{repo.name}</a>
                {repo.description && (
                  <span className={styles.repoDescription}>{repo.description}</span>
                )}
              </div>
              <div className={styles.repoMeta}>
                {repo.language && (
                  <span className={styles.language}>
                    <span className={styles.languageDot} />
                    {repo.language}
                  </span>
                )}
                <span className={styles.metaItem}>
                  <GearIcon size={16} />
                </span>
                <span className={styles.metaItem}>
                  <RepoForkedIcon size={16} /> {repo.forks}
                </span>
                <span className={styles.metaItem}>
                  <StarIcon size={16} /> {repo.stars}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Application>
  )
}

export default Repositories
