import { Label, Avatar, StateLabel } from '@primer/react'
import {
  CodeIcon,
  IssueOpenedIcon,
  GitPullRequestIcon,
  PeopleIcon,
  PlayIcon,
  ProjectIcon,
  StarIcon,
  BookIcon,
  ShieldIcon,
  GraphIcon,
  GearIcon,
  ArrowLeftIcon,
  PackageIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  RepoIcon,
  CopyIcon,
} from '@primer/octicons-react'
import Application from '../templates/Application/Application.jsx'
import { useSceneData } from '../../storyboard'
import styles from './securityAdvisory.module.css'

const iconMap = {
  'code': CodeIcon,
  'issue-opened': IssueOpenedIcon,
  'git-pull-request': GitPullRequestIcon,
  'people': PeopleIcon,
  'play': PlayIcon,
  'project': ProjectIcon,
  'star': StarIcon,
  'book': BookIcon,
  'shield': ShieldIcon,
  'graph': GraphIcon,
  'gear': GearIcon,
}

function SecurityAdvisory() {
  const rawTopnav = useSceneData('topnav')
  const topnav = Array.isArray(rawTopnav) ? rawTopnav.map(item => ({
    ...item,
    icon: iconMap[item.icon] || CodeIcon,
  })) : []

  const advisory = useSceneData('advisory') || {}
  const pkg = advisory.package || {}
  const severity = advisory.severity || {}
  const cvssMetrics = Array.isArray(severity.cvssMetrics) ? severity.cvssMetrics : []
  const tags = Array.isArray(advisory.tags) ? advisory.tags : []
  const weaknesses = Array.isArray(advisory.weaknesses) ? advisory.weaknesses : []
  const timeline = Array.isArray(advisory.timeline) ? advisory.timeline : []
  const epss = advisory.epss || {}

  return (
    <Application title="octodemo" subtitle="test-se-fs-gitogether-repo" topnav={topnav}>
      <div className={styles.pageWrapper}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <a href="#" className={styles.breadcrumbLink}>
            <ArrowLeftIcon size={16} />
            <span>{advisory.breadcrumb}</span>
          </a>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>#{advisory.id}</span>
        </nav>

        {/* Title */}
        <h1 className={styles.pageTitle}>
          {advisory.title} <span className={styles.issueNumber}>#{advisory.id}</span>
        </h1>

        {/* State bar */}
        <div className={styles.stateMeta}>
          <StateLabel status="issueClosed" variant="small">
            <CheckCircleIcon size={16} /> Fixed
          </StateLabel>
          <span className={styles.metaText}>
            Opened {advisory.openedAgo} on <strong>{pkg.name}</strong> ({pkg.ecosystem}) · · · Fixed {advisory.fixedAgo}
          </span>
        </div>

        {/* Two-column layout */}
        <div className={styles.contentLayout}>
          {/* Main content */}
          <div className={styles.mainContent}>
            {/* Package info table */}
            <div className={styles.packageTable}>
              <div className={styles.packageColumn}>
                <span className={styles.packageLabel}>Package</span>
                <span className={styles.packageValue}>
                  <PackageIcon size={16} /> {pkg.name} ({pkg.ecosystem})
                </span>
              </div>
              <div className={styles.packageColumn}>
                <span className={styles.packageLabel}>Affected versions</span>
                <code className={styles.packageCode}>{pkg.affectedVersions}</code>
              </div>
              <div className={styles.packageColumn}>
                <span className={styles.packageLabel}>Patched version</span>
                <span className={styles.packageValue}>
                  <strong>{pkg.patchedVersion}</strong> <CopyIcon size={16} className={styles.copyIcon} />
                </span>
              </div>
            </div>

            {/* Advisory body */}
            <article className={styles.advisoryBody}>
              <h2>Summary</h2>
              <p>Log4j versions prior to 2.16.0 are subject to a remote code execution vulnerability via the ldap JNDI parser.</p>
              <p>As per <a href="#">Apache&apos;s Log4j security guide</a>: Apache Log4j2 &lt;=2.14.1 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints. An attacker who can control log messages or log message parameters can execute arbitrary code loaded from LDAP servers when message lookup substitution is enabled. From log4j 2.16.0, this behavior has been disabled by default.</p>
              <p>Log4j version 2.15.0 contained an earlier fix for the vulnerability, but that patch did not disable attacker-controlled JNDI lookups in all situations. For more information, see the <code>Updated advice for version 2.16.0</code> section of this advisory.</p>

              <h2>Impact</h2>
              <p>Logging untrusted or user controlled data with a vulnerable version of Log4J may result in Remote Code Execution (RCE) against your application. This includes untrusted data included in logged errors such as exception traces, authentication failures, and other unexpected vectors of user controlled input.</p>

              <h2>Affected versions</h2>
              <p>Any Log4J version prior to v2.15.0 is affected to this specific issue.</p>
              <p>The v1 branch of Log4J which is considered End Of Life (EOL) is vulnerable to other RCE vectors so the recommendation is to still update to 2.16.0 where possible.</p>

              <h2>Security releases</h2>
              <p>Additional backports of this fix have been made available in versions 2.3.1, 2.12.2, and 2.12.3</p>

              <h2>Affected packages</h2>
              <p>Only the <code>org.apache.logging.log4j:log4j-core</code> package is directly affected by this vulnerability. The <code>org.apache.logging.log4j:log4j-api</code> should be kept at the same version as the <code>org.apache.logging.log4j-core</code> package to ensure compatability if in use.</p>

              <h2>Remediation Advice</h2>

              <h3>Updated advice for version 2.16.0</h3>
              <p>The Apache Logging Services team provided updated mitigation advice upon the release of version 2.16.0, which <a href="#">disables JNDI by default and completely removes support for message lookups</a>.</p>
              <p>Even in version 2.15.0, lookups used in layouts to provide specific pieces of context information will still recursively resolve, possibly triggering JNDI lookups. This problem is being tracked as <a href="#">CVE-2021-45046</a>. More information is available on the <a href="#">GitHub Security Advisory for CVE-2021-45046</a>.</p>
              <p>Users who want to avoid attacker-controlled JNDI lookups but cannot upgrade to 2.16.0 must <a href="#">ensure that no such lookups resolve to attacker-provided data and ensure that the JndiLookup class is not loaded</a>.</p>
              <p>Please note that Log4J v1 is End Of Life (EOL) and will not receive patches for this issue. Log4J v1 is also vulnerable to other RCE vectors and we recommend you migrate to Log4J 2.16.0 where possible.</p>
            </article>

            {/* Timeline */}
            <div className={styles.timeline}>
              {timeline.map((event, index) => (
                <div key={index} className={styles.timelineItem}>
                  <div className={styles.timelineBadge}>
                    {event.action.includes('closed') ? (
                      <CheckCircleIcon size={16} className={styles.closedIcon} />
                    ) : (
                      <ShieldIcon size={16} className={styles.openedIcon} />
                    )}
                  </div>
                  <Avatar src={event.actorAvatar} size={20} alt={event.actor} />
                  <span className={styles.timelineText}>
                    <strong>{event.actor}</strong>
                    {event.isBot && <Label size="small" className={styles.botLabel}>bot</Label>}
                    {' '}{event.action} {event.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Severity */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarHeading}>Severity</h3>
              <div className={styles.severityScore}>
                <Label variant="danger" className={styles.criticalLabel}>{severity.level}</Label>
                <span className={styles.scoreText}>{severity.score}</span>
              </div>
            </div>

            {/* CVSS metrics */}
            <div className={styles.sidebarSection}>
              <h4 className={styles.metricsHeading}>CVSS v3 base metrics</h4>
              <table className={styles.metricsTable}>
                <tbody>
                  {cvssMetrics.map((metric) => (
                    <tr key={metric.label}>
                      <td className={styles.metricLabel}>{metric.label}</td>
                      <td className={styles.metricValue}>{metric.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a href="#" className={styles.learnMore}>Learn more about base metrics</a>
              <p className={styles.cvssVector}>{severity.cvssVector}</p>
            </div>

            {/* EPSS */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarHeading}>EPSS score</h3>
              <p className={styles.epssScore}>{epss.score} ({epss.percentile})</p>
            </div>

            {/* Tags */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarHeading}>Tags</h3>
              <div className={styles.tagList}>
                {tags.map((tag) => (
                  <Label key={tag} className={styles.tag}>{tag}</Label>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarHeading}>Weaknesses</h3>
              <ul className={styles.weaknessList}>
                {weaknesses.map((cwe) => (
                  <li key={cwe} className={styles.weaknessItem}>▸ {cwe}</li>
                ))}
              </ul>
            </div>

            {/* CVE ID */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarHeading}>CVE ID</h3>
              <p className={styles.sidebarValue}>{advisory.cveId}</p>
            </div>

            {/* GHSA ID */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarHeading}>GHSA ID</h3>
              <p className={styles.sidebarValue}>{advisory.ghsaId}</p>
            </div>

            {/* Links */}
            <div className={styles.sidebarSection}>
              <a href="#" className={styles.sidebarLink}>
                <ShieldCheckIcon size={16} /> See advisory in GitHub Advisory Database
              </a>
              <a href="#" className={styles.sidebarLink}>
                <RepoIcon size={16} /> See all of your affected repositories
              </a>
            </div>

            {/* Contribute */}
            <div className={styles.sidebarSection}>
              <p className={styles.contributeText}>See something to contribute?</p>
              <a href="#" className={styles.contributeLink}>Suggest improvements for this advisory on the GitHub Advisory Database.</a>
            </div>
          </aside>
        </div>
      </div>
    </Application>
  )
}

export default SecurityAdvisory
