const permalink = require('permalink');

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  return new Promise((resolve, reject) => {
    const postTemplate = path.resolve('src/templates/post.jsx');
    const tagPage = path.resolve('src/pages/tags.jsx');
    const tagPosts = path.resolve('src/templates/tag.jsx');

    resolve(
      graphql(
        `
          query {
            allMarkdownRemark(
              sort: { order: ASC, fields: [frontmatter___date] }
            ) {
              edges {
                node {
                  frontmatter {
                    permalink
                    title
                    tags
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          return reject(result.errors);
        }

        const posts = result.data.allMarkdownRemark.edges;

        const postsByTag = {};
        // create tags page
        posts.forEach(({ node }) => {
          if (node.frontmatter.tags) {
            node.frontmatter.tags.forEach(tag => {
              if (!postsByTag[tag]) {
                postsByTag[tag] = [];
              }

              postsByTag[tag].push(node);
            });
          }
        });

        const tags = Object.keys(postsByTag);

        createPage({
          permalink: '/tags',
          component: tagPage,
          context: {
            tags: tags.sort(),
          },
        });

        //create tags
        tags.forEach(tagName => {
          const posts = postsByTag[tagName];

          createPage({
            permalink: `/tags/${tagName}`,
            component: tagPosts,
            context: {
              posts,
              tagName,
            },
          });
        });

        //create posts
        posts.forEach(({ node }, index) => {
          const permalink = node.frontmatter.permalink;
          const prev = index === 0 ? null : posts[index - 1].node;
          const next =
            index === posts.length - 1 ? null : posts[index + 1].node;
          createPage({
            permalink,
            component: postTemplate,
            context: {
              pathSlug: permalink,
              prev,
              next,
            },
          });
        });
      })
    );
  });
};

/* Allows named imports */
exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
  });
};
