export const GET_BLOG_ARTICLES = `
  query GetBlogArticles($first: Int!) {
    blogs(first: 1) {
      nodes {
        id
        handle
        title
        articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            id
            handle
            title
            excerpt
            excerptHtml
            contentHtml
            publishedAt
            image {
              url
              altText
              width
              height
            }
            author {
              name
            }
            tags
          }
        }
      }
    }
  }
`

export const GET_ARTICLE_BY_HANDLE = `
  query GetArticleByHandle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        id
        handle
        title
        contentHtml
        excerpt
        publishedAt
        image {
          url
          altText
          width
          height
        }
        author {
          name
        }
        tags
      }
    }
  }
`
