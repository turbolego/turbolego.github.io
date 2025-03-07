const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const CleanCSS = require("clean-css");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlminifier = require("html-minifier-terser");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
  // Watch SASS directory for changes
  eleventyConfig.addWatchTarget("./src/sass/");
  
  // Copy static assets
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("./src/img");
  
  // Add plugins
  eleventyConfig.addPlugin(syntaxHighlight, {
    preAttributes: {
      tabindex: 0,
    },
  });
  eleventyConfig.addPlugin(pluginRss);
  
  // Prism and Chota define a tag class. This leads to styling conflicts
  // So we replace .tag in Chota with .chip.
  eleventyConfig.addFilter("tagtochip", function(css) {
    return css.replaceAll('.tag', '.chip');
  });
  
  // Add CSS minification filter
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });
  
  // Date formatting filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });
  
  // Add dateToISO filter 
  eleventyConfig.addFilter("dateToISO", dateObj => {
    return DateTime.fromJSDate(dateObj).toISO();
  });
  
  // Add htmlDateString filter
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('yyyy-LL-dd');
  });
  
  // Add year filter for copyright
  eleventyConfig.addFilter("year", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy");
  });
  
  // Get the first `n` elements of a collection
  eleventyConfig.addFilter("head", (array, n) => {
    if (!array) return [];
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });
  
  // Create a posts collection 
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("./src/posts/*.md");
  });
  
  // Configure Markdown 
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor);
  eleventyConfig.setLibrary("md", markdownLibrary);
  
  // Minify HTML - using html-minifier-terser for improved security
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
