export default function AboutPage() {
  return (
    <article className="content-page">
      <h1>About MockData.net</h1>
      <section>
        <p>
          MockData.net is a simple yet powerful tool that helps developers, testers, data engineers and product teams
          generate realistic test data in seconds. Modern software projects require a lot of sample data to test user
          flows, performance, validation rules and integrations. Creating that data manually is time-consuming and
          error-prone, so MockData.net focuses on making this process fast and reliable.
        </p>
      </section>
      <section>
        <p>
          The platform allows you to create random names, emails, addresses, phone numbers, UUIDs, dates, numeric ranges
          and more, in different formats such as JSON, CSV or SQL inserts. You can quickly copy or download the
          generated data and paste it into your local database, API client, frontend application or any other environment
          where you need realistic dummy records.
        </p>
      </section>
      <section>
        <p>
          MockData.net is designed to be lightweight, fast and easy to use. There are no complex onboarding steps or
          sign-up requirements for basic usage. You open the page, choose your options and generate your data. This makes
          it suitable for hackathons, prototypes, MVPs, demos and educational projects.
        </p>
      </section>
      <section>
        <p>
          Our long-term goal is to turn MockData.net into a helpful companion for everyday development tasks by
          continuously adding new generators, presets and templates for common scenarios. We want developers to spend
          less time creating fake data and more time solving real problems.
        </p>
      </section>
      <div className="ad-slot" aria-label="Advertisement placeholder">
        Advertisement placeholder
      </div>
    </article>
  );
}
