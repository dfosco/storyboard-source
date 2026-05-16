export default function Branding() {
  const valueProps = [
    'Collect feedback from every channel in one inbox',
    'Spot trends with AI-powered theme detection',
    'Close the loop with automated follow-ups',
  ]

  return (
    <aside className="relative flex min-h-screen flex-col justify-between bg-indigo-950 p-10 text-white lg:p-14">
      <header className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500 text-lg"
        >
          🔁
        </span>
        <span className="text-lg font-semibold tracking-tight text-white">Loopline</span>
      </header>

      <div className="mt-12 max-w-md">
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
          Close the feedback loop.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-indigo-100">
          Loopline turns scattered customer feedback into a clear roadmap — so your
          team ships what people actually want.
        </p>

        <ul className="mt-10 space-y-4">
          {valueProps.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-500"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-base leading-relaxed text-white">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <figure className="mt-12 rounded-xl border border-indigo-800 bg-indigo-900/60 p-5">
        <blockquote className="text-sm leading-relaxed text-white">
          “Loopline replaced four tools and finally got product, support, and design
          talking about the same feedback.”
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white"
          >
            MK
          </span>
          <span className="text-sm">
            <span className="block font-medium text-white">Maya Kapoor</span>
            <span className="block text-indigo-300">Head of Product, Northwind</span>
          </span>
        </figcaption>
      </figure>
    </aside>
  )
}
