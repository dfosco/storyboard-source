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

Download the macOS Launcher from [latest launcher release](https://github.com/dfosco/storyboard/releases/tag/storyboard-launcher-v0.1.3) or directly from [Storyboard-Launcher-macOS-v0.1.3.dmg](https://github.com/dfosco/storyboard/releases/download/storyboard-launcher-v0.1.3/Storyboard-Launcher-macOS-v0.1.3.dmg).

After installing, run:
```bash
sudo xattr -rd com.apple.quarantine '/Applications/Storyboard Launcher.app'
```
<!-- storyboard-launcher-download:end -->

## Getting Started

Storyboard is a static React application that only requires GitHub Pages to be deployed. It can also be easily deployed on other hosts like Vercel and Netlify, but GH Pages has the benefit of authentication being tied to your repository.
