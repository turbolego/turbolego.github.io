---
title: My New Post
date: 2025-03-07 10:50:51
tags: [documentation, workspace, hexo]
---

## Workspace Documentation

This workspace is set up to use [Hexo](https://hexo.io/), a fast, simple & powerful blog framework. Here's a quick overview of the key directories and files:

### Key Files and Directories

-   `package.json`: This file contains metadata about the project, including dependencies and scripts. Key scripts include:
    -   `build`: Generates the static site.
    -   `clean`: Cleans the generated files.
    -   `deploy`: Deploys the site.
    -   `server`: Starts a local server for previewing the site.
-   `_config.yml`: This is the main configuration file for Hexo. It contains settings for the site title, theme, and other options.
-   `source/`: This directory contains the source files for the blog posts and pages.
    -   `_posts/`: This directory contains the markdown files for the blog posts.
-   `themes/`: This directory contains the themes for the Hexo site. The current theme is `landscape`.
-   `.github/workflows/pages.yml`: This file defines the GitHub Actions workflow for building and deploying the site to GitHub Pages.

### Workflow

The typical workflow for creating and deploying a new blog post is as follows:

1.  Create a new post using the `hexo new "My New Post"` command.
2.  Write the content of the post in the `source/_posts/` directory.
3.  Preview the site locally using the `hexo server` command.
4.  Generate the static site using the `hexo generate` command.
5.  Deploy the site to GitHub Pages using the `hexo deploy` command.

### Dependencies

The key dependencies for this project are:

-   `hexo`: The core Hexo framework.
-   `hexo-generator-archive`: Generates archive pages.
-   `hexo-generator-category`: Generates category pages.
-   `hexo-generator-index`: Generates the index page.
-   `hexo-generator-tag`: Generates tag pages.
-   `hexo-renderer-ejs`: Renders EJS templates.
-   `hexo-renderer-marked`: Renders Markdown files.
-   `hexo-renderer-stylus`: Renders Stylus stylesheets.
-   `hexo-server`: Provides a local server for previewing the site.
-   `hexo-theme-landscape`: The default theme for the site.

For more information, please refer to the [Hexo documentation](https://hexo.io/docs/).