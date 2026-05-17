export default function Branding() {
  const valueProps = [
    'Collect feedback from every channel in one inbox',
    'Spot trends with AI-powered theme detection',
    'Close the loop with automated follow-ups',
  ]

  return (
    <aside className="relative flex min-h-screen flex-col justify-center gap-3 bg-indigo-950 p-6 text-white">
      <header className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500 text-lg"
        >
          🔁
        </span>
        <span className="text-lg font-semibold tracking-tight text-white">Loopline</span>
      </header>

      <div className="max-w-md">
        <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-white">
          Close the feedback loop.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-indigo-100">
          Loopline turns scattered customer feedback into a clear roadmap — so your
          team ships what people actually want.
        </p>

        <ul className="mt-6 space-y-2">
          {valueProps.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-indigo-500"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-sm leading-relaxed text-white">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <figure className="rounded-xl border border-indigo-800 bg-indigo-900/60 p-2.5">
        <blockquote className="text-xs leading-snug text-white">
          “Loopline replaced four tools and finally got product, support, and design
          talking about the same feedback.”
        </blockquote>
        <figcaption className="mt-1.5 flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white"
          >
            MK
          </span>
          <span className="text-xs">
            <span className="block font-medium text-white">Maya Kapoor</span>
            <span className="block text-indigo-300">Head of Product, Northwind</span>
          </span>
        </figcaption>
      </figure>
    </aside>
  )
}
