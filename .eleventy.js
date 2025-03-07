const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  
  // Date formatting filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });
  
  // Add dateToISO filter that was missing
  eleventyConfig.addFilter("dateToISO", dateObj => {
    return DateTime.fromJSDate(dateObj).toISO();
  });
  
  // Add htmlDateString filter
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('yyyy-LL-dd');
  });
  
  // Get the first `n` elements of a collection
  eleventyConfig.addFilter("head", (array, n) => {
    if (!array) return [];
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });
  
  // Create a posts collection from all files in /src/posts/
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
