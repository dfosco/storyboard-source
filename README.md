# Storyboard

> [!NOTE]  
> This README is a work in progress 

Storyboard is a design tool for prototyping that runs entirely on GitHub. It bundles four key capabilities in a single platform:

1. A framework for building **stateful prototypes** in React
2. An overlay of design tools for inspecting, documenting and interacting with your prototypes
3. An interactive canvas where you can add components, prototypes, Figma files, and more
4. The *viewfinder*, a homepage for every prototype created by your team.

Storyboard is free and open-source, and can be deployed by forking the example repository and enabling GitHub Pages.

<!-- lots of medias -->

<!-- storyboard-launcher-download:start -->
## Storyboard Launcher (Desktop App)

Download the macOS Launcher from [latest release](https://github.com/dfosco/storyboard/releases/latest).

After installing, run:
```bash
sudo xattr -rd com.apple.quarantine '/Applications/Storyboard Launcher.app'
```
<!-- storyboard-launcher-download:end -->

## Getting Started

Storyboard is a static React application that only requires GitHub Pages to be deployed. It can also be easily deployed on other hosts like Vercel and Netlify, but GH Pages has the benefit of authentication being tied to your repository.

To get started:

1. Fork the example repository
2. Enable GitHub Pages deployment (or set your external host)
3. Add your team as collaborators on the repository so they can see the GitHub Pages deployment (in case you set it to private)

That's it! You can now start creating and pushing prototypes.

### Local setup

Clone your fork of Storyboard, then:

```bash
npm run setup
```

This will install dependencies, set up the [Caddy](https://caddyserver.com/) reverse proxy, and check for the GitHub CLI. After setup, start the dev server:

```bash
npx storyboard dev
```

Your storyboard instance will be available at `http://storyboard.localhost/storyboard/`.

When working in a [git worktree](https://git-scm.com/docs/git-worktree), each worktree gets its own URL:

```bash
cd .worktrees/my-feature
npx storyboard dev
# → http://storyboard.localhost/branch--my-feature/storyboard/
```

#### Storyboard CLI

The `storyboard` CLI (alias: `sb`) wraps all dev tooling. Run via `npx`:

| Command | Description |
|---------|-------------|
| `npx storyboard dev` | Start Vite dev server + update proxy |
| `npx storyboard setup` | Install deps, Caddy, start proxy |
| `npx storyboard proxy` | Regenerate proxy config + reload |
| `npx storyboard update:flag <key> <value>` | Update a feature flag |

## Creating prototypes

Every prototype is a sub-folder in the `/src/prototypes` folder. To create a new prototype, you can do it in two different ways:

- On the UI, click  the `Create tool` and choose `Create Prototype`. It will provide you with a set of options and create the right folder and files to start your prototype.

<!-- media -->

- Ask your AI assistant (e.g.: Copilot or Claude Code) `create a prototype for me`. This will run a dedicated skill that will ask the same set of options as the UI and create the folder and files for your prototype.

<!-- media -->

If you want to create one yourself by hand, try out this small example:


```text
src/prototypes/MyProfile/
  my-profile.prototype.json
  default.flow.json
  index.jsx
```

```json
// my-profile.prototype.json
{
  "meta": {
    "title": "My Profile",
    "description": "Simple profile prototype",
    "author": ["your-name"]
  }
}
```

```json
// default.flow.json
{
  "user": {
    "name": "Jane Doe",
    "bio": "Designer & developer",
    "avatar": "https://avatars.githubusercontent.com/u/1?v=4"
  }
}
```

```jsx
// index.jsx
import { Avatar, Heading, Text } from '@primer/react'
import { useFlowData } from '@dfosco/storyboard-react'

export default function MyProfilePage() {
  const user = useFlowData('user')

  return (
    <main>
      <Avatar src={user?.avatar} size={64} />
      <Heading as="h1">{user?.name ?? 'Unknown user'}</Heading>
      <Text>{user?.bio ?? 'No bio yet'}</Text>
    </main>
  )
}
```

Storyboard only runs React prototypes at the moment. Open a discussion if you'd like to see other frontend frameworks supported.



#### Live editing 

> Wait, I can create a prototype by editing the UI? How does this work?

Yes! Storyboard runs a two-way dev server on your local machine that lets you **live edit** the code from your browser. 

This means you can edit the prototype code manually, but storyboard can also edit the code on your repository *from the browser UI.* 

Think of storyboard as a full stack web app running on your machine... it's just that the repository itself is your database! 

<!-- some medias -->

**Live editing** is only available on your local developer environment (for now).

#### Flows

A single prototype can contain multiple flows. The idea is that for the same exploration, you might want to represent e.g.: an empty state, a default state, an error state, etc...

Flows allow you to do two things:

1. Define entrypoint URLs to any place in your prototype. This could be as simple as a `Landing page` and `Dashboard` flow that take users directly to these pages for convenience of navigation.

<!-- flow media -->

2. Define an initial set of data for that flow. Useful for populating pages that read data objects, and setting up states such as e.g.: `empty state`, `error state` that are defined by the data and not hardcoded in the layout.
<!-- flow media -->

Learn more in < Getting started with state-driven prototypes >.

#### Components, Templates, Recipes, Styles

You can provide an easy way for your team to create prototypes that match your product's pages, patterns, and styles. 

On top of importing your design system, you can create folders in to provide shared utilities for all prototypes: `src/components`, `src/templates`, `src/recipes`, `src/styles`, etc. Templates and Recipes in these folders will be listed as options for prototype creation.

To import any of these shared assets on a file, just do e.g.:

`import Application from "@/templates/Application.tsx"`

You don't need to worry with file paths, the `@/` works from anywhere in the repo.

#### Templates vs Recipes

Recipes are Templates with specific data attached. For example, you might want to have your Application template with navigation that reflects a user account, but also a team account. 

Instead of creating two Templates that duplicate the same code with slightly different data, you can create two Recipes! Each one using the same Template, but loading different sets of data. 

Jump here to [learn how to create a recipe] – but you might want to learn about state data first and how we handle it. Let's go:

### Getting started with state-driven prototypes

Storyboard is **not** made to use real data from APIs.

> Wait, what?

Yeah, that's right. Real data can be useful in certain scenarios, but *prototyping* with real data from APIs is counter-productive. Here's why:

- Adding APIs to your prototype adds a lot of complexity for authentication and hosting.
- Even if you have APIs properly set up, your account might not have the data you need to design your desired flows e.g.: an account that has 2000 tickets, an enterprise account with invoiced billing configured, a-post-with-really-long-title-so-you-can-see-if-the-UI-breaks.
- Assuming you got the real data you need, the _users_ of your prototype might not have useful data in their account to test the experience as you intended to.

_* gently puts down microphone *_

OK, with that out of the way... what should you use instead?

### Storyboard data files

Storyboard prototypes are powered by data files that live in your repository. The framework also provides an easy way for your front-end to read from those files. 

Here's the 3 types of data files:

| Type | Purpose | Name |
|--------|---------|---------|
| `.flow.json` | Data to represent a specific flow | `emptyState.flow.json` |

In this example, a flow that has all the fields used in a page, but with empty values. Your components could render your empty state experience based on this.

| Type | Purpose | Name |
|--------|---------|---------|
| `.object.json` | Reusable data object | `teamNavigation.object.json` | 

An object can be used anywhere, but this could be imported by a Recipe to show what navigation should contain for a Team page! Others could be `userNavigation.object.json`, `loggedOutNavigation.object.json`, etc...

| Type | Purpose | Name |
|--------|---------|---------|
| `.record.json` | Repeatable collection | `tickets.record.json` | 

If you're prototyping an issue-tracking tool, you can have 100 tickets described in a record file, and read them from the UI. It's like an API in your pocket!

---

Data files must be placed inside each prototype directory, and are not meant to be shared across prototypes. This is so that they can be easily read in your prototype without paths:

```jsx

import { useObject } from '@dfosco/storyboard-react'

const user = useObject('teamNavigation')
```

This will import the data from `teamNavigation.object.json` in your prototype regardless of the location of the file, as long as the file is in `/src/prototypes/your-prototype`. 

Different prototypes can have objects with the same name too, and will match their local copies.

Let's dive deeper.

#### Using object hooks

#### Using flow hooks

#### Using record hooks

#### Downsides to this approach

As with any optimization, there are downsides to this approach. We are optimizing for more interactive and stateful prototypes, and in doing so reducing fidelity to your own product's codebase.

The code of your prototype will handle data in a way that's fundamentally different than your product — you're not talking to your own APIs, and you're not querying from your database.

Storyboard prototypes are meant to be used as a reference for **layout and interaction**, and designers and developers are expected to adjust the code to match production needs. It is a prototype after all, please don't copy and paste the code 😅

### Design Tools

#### Create

#### Autosync

#### Theme switcher

#### Inspect 

#### Comments

#### Flow switcher

#### Feature flags


### Canvas

#### Sticky Notes

#### Markdown blocks

#### Prototype Embeds

#### Figma Embeds

#### Local Components