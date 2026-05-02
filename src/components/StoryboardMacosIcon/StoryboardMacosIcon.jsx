import styles from './StoryboardMacosIcon.module.css'

export default function StoryboardMacosIcon() {
  return (
    <figure className={styles.frame}>
      <svg
        className={styles.icon}
        viewBox="0 0 512 512"
        role="img"
        aria-label="Storyboard mascot app icon"
      >
        <defs>
          <linearGradient id="outerShell" x1="72" y1="56" x2="456" y2="464" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2f3446" />
            <stop offset="1" stopColor="#151826" />
          </linearGradient>
          <linearGradient id="innerGlass" x1="112" y1="98" x2="412" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1f2538" />
            <stop offset="1" stopColor="#0f1321" />
          </linearGradient>
          <radialGradient id="mascotGlow" cx="0.5" cy="0.45" r="0.65">
            <stop offset="0" stopColor="#6f8cff" stopOpacity="0.42" />
            <stop offset="1" stopColor="#6f8cff" stopOpacity="0" />
          </radialGradient>
          <pattern id="dotGrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="1.25" fill="#7f8ebd" fillOpacity="0.22" />
          </pattern>
          <linearGradient id="faceFill" x1="173" y1="149" x2="338" y2="344" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9fb6ff" />
            <stop offset="1" stopColor="#6e83da" />
          </linearGradient>
          <linearGradient id="eyeFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7fbff" />
            <stop offset="1" stopColor="#d7e3ff" />
          </linearGradient>
          <linearGradient id="beakFill" x1="236" y1="274" x2="274" y2="312" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffd48b" />
            <stop offset="1" stopColor="#f3a94f" />
          </linearGradient>
        </defs>

        <rect x="28" y="28" width="456" height="456" rx="112" fill="url(#outerShell)" />
        <rect x="64" y="64" width="384" height="384" rx="92" fill="url(#innerGlass)" />
        <rect x="64" y="64" width="384" height="384" rx="92" fill="url(#dotGrid)" />
        <rect x="64" y="64" width="384" height="384" rx="92" fill="url(#mascotGlow)" />

        <rect x="112" y="112" width="288" height="288" rx="72" fill="none" stroke="#4b577e" strokeWidth="22" strokeOpacity="0.8" />

        <circle cx="256" cy="256" r="102" fill="url(#faceFill)" />
        <circle cx="220" cy="236" r="26" fill="url(#eyeFill)" />
        <circle cx="292" cy="236" r="26" fill="url(#eyeFill)" />
        <circle cx="220" cy="236" r="10" fill="#2a345f" />
        <circle cx="292" cy="236" r="10" fill="#2a345f" />
        <path d="M256 286 L236 316 H276 Z" fill="url(#beakFill)" />
        <path
          d="M216 322 C229 336, 246 344, 256 344 C266 344, 283 336, 296 322"
          fill="none"
          stroke="#32406f"
          strokeLinecap="round"
          strokeWidth="12"
        />
      </svg>
    </figure>
  )
}
