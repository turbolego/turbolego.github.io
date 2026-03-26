const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const CleanCSS = require("clean-css");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight").default;
const htmlminifier = require("html-minifier-terser");
const pluginRss = require("@11ty/eleventy-plugin-rss").default;

module.exports = function(eleventyConfig) {
  // Watch SASS directory for changes
  eleventyConfig.addWatchTarget("./src/sass/");

  // Copy static assets
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("./src/img");
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");

  // Add plugins
  eleventyConfig.addPlugin(syntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });
  eleventyConfig.addPlugin(pluginRss);

  // Prism and Chota define a tag class — replace .tag with .chip to avoid conflicts
  eleventyConfig.addFilter("tagtochip", function(css) {
    return css.replaceAll('.tag', '.chip');
  });

  // CSS minification
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // Date filters
  eleventyConfig.addFilter("readableDate", dateObj =>
    DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy"));

  eleventyConfig.addFilter("dateToISO", dateObj =>
    DateTime.fromJSDate(dateObj).toISO());

  eleventyConfig.addFilter("htmlDateString", dateObj =>
    DateTime.fromJSDate(dateObj).toFormat('yyyy-LL-dd'));

  eleventyConfig.addFilter("year", dateObj =>
    DateTime.fromJSDate(dateObj).toFormat("yyyy"));

  // Get the first `n` elements of a collection
  eleventyConfig.addFilter("head", (array, n) => {
    if (!array) return [];
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });

  // Posts collection
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("./src/posts/*.md");
  });

  // Markdown configuration
  eleventyConfig.setLibrary("md", markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor));

  // HTML minification
  eleventyConfig.addTransform("htmlmin", function(content) {
    if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
      return htmlminifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
    }
    return content;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
