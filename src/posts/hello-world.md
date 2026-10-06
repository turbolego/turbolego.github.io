---
title: Welcome to My Eleventy Blog
date: 2025-03-07
tags:
  - documentation
  - eleventy
  - 11ty
description: An overview of this Eleventy-powered blog workspace
layout: post.njk
---

# Welcome to My Eleventy Blog

This is a static site blog built with [Eleventy (11ty)](https://www.11ty.dev/), a simpler static site generator. This post provides an overview of the project structure and how to work with it.

## Project Structure

```
project/
├── .github/workflows/      # GitHub Actions workflows
├── src/                    # Source files
│   ├── _data/              # Site data files
│   ├── _includes/          # Template parts/components
│   ├── _layouts/           # Page layouts
│   ├── css/                # Stylesheets
│   └── posts/              # Blog posts (markdown)
├── .eleventy.js            # Eleventy configuration
└── package.json            # Project dependencies
```

## Working with This Blog

### Creating New Posts

To create a new post:

1. Add a new Markdown file to the `src/posts/` directory
2. Include frontmatter at the top of the file:

```markdown
---
title: Your Post Title
date: YYYY-MM-DD
tags:
  - tag1
  - tag2
description: Brief description of your post
layout: post.njk
---
```

### Local Development

Run these commands in your terminal:

- `npm install` - Install dependencies
- `npm start` - Start development server
- `npm run build` - Build for production

### Deployment

The blog is automatically deployed to GitHub Pages when changes are pushed to the main branch. The GitHub Actions workflow:

1. Checks out the code
2. Installs dependencies
3. Builds the site
4. Deploys to the gh-pages branch

## Customization

- Edit site metadata in `src/_data/metadata.json`
- Modify layouts in `src/_layouts/`
- Update styling in `src/css/style.css`

## Key Features

- Responsive design
- Tag-based navigation
- Code syntax highlighting
- Markdown support with various plugins

Happy blogging with Eleventy!
