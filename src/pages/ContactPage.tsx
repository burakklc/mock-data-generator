import { useState, type ChangeEvent, type FormEvent } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Contact form submission', formData);
    setSubmitted(true);
  };

  return (
    <article className="content-page">
      <h1>Contact</h1>
      <p>
        If you have any questions, feedback or suggestions about MockData.net, feel free to reach out. You can contact
        us via email at <a href="mailto:support@mockdata.net">support@mockdata.net</a>.
      </p>
      <p>Typical topics you can contact us about:</p>
      <ul>
        <li>Reporting a bug or an error on the website</li>
        <li>Requesting a new data generator or feature</li>
        <li>Asking about usage or limitations</li>
        <li>Sharing general feedback or improvement ideas</li>
      </ul>
      <p>We usually respond within a reasonable time frame. Thank you for helping us make MockData.net better.</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </label>
        <label>
          Message
          <textarea name="message" rows={5} value={formData.message} onChange={handleChange} required />
        </label>
        <button type="submit">Send Message</button>
        {submitted && <p className="contact-form__success">Thanks! Your message has been noted.</p>}
      </form>
      <div className="ad-slot" aria-label="Advertisement placeholder">
        Advertisement placeholder
      </div>
    </article>
  );
}
