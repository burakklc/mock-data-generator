export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  sections: Array<{
    heading?: string;
    paragraphs: string[];
    list?: string[];
  }>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-mock-data-and-why-it-matters',
    title: 'What is Mock Data and Why It Matters for Developers',
    excerpt:
      'Learn how mock data keeps development safe, speeds up testing and makes demos more convincing for teams of all sizes.',
    sections: [
      {
        paragraphs: [
          'Mock data is artificially created information that looks realistic enough to be used in software development, testing and demos. Instead of relying on real users, real customers or production databases, developers can work with safe, fake records that follow the same structure as real data but do not expose sensitive information.',
        ],
      },
      {
        paragraphs: [
          'For example, when building a new registration flow, you might need hundreds of sample users with names, emails and passwords to test validation rules, edge cases and UI behavior. Creating those records manually is slow and boring. Mock data generators automate this process by producing random but structured data with a single click.',
        ],
      },
      {
        heading: 'Key Benefits of Mock Data',
        paragraphs: [
          'Using mock data has several important benefits:',
        ],
        list: [
          'Faster development and testing — Developers can quickly seed local databases or staging environments with realistic test records. This makes it easier to test different scenarios, detect bugs and verify that the application behaves correctly under various conditions.',
          'Protecting real user data — Working with production data in development environments can create privacy and security risks. Mock data avoids those risks because it does not belong to real people, even though it looks similar in shape and format.',
          'Better demos and prototypes — When presenting a new feature to stakeholders, realistic sample data makes the interface much more convincing. Empty tables and forms do not show the true value of a product, while populated screens do.',
        ],
      },
      {
        paragraphs: [
          'MockData.net focuses exactly on this use case. It allows you to generate names, emails, addresses, numbers and other fields in formats that are easy to copy into JSON, CSV or SQL. Instead of spending time inventing fake data by hand, you can rely on the generator and stay focused on building features.',
          'As your projects grow, having a convenient way to create mock data becomes more and more important. Whether you are a solo developer, part of a team or a student learning how to code, mock data is a simple but powerful tool that can make your workflow smoother and safer.',
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
