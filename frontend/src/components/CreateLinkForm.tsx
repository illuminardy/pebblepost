import { useState } from 'react';
import { api } from '../api/client';
import type { CreateLinkRequest, LinkResponse } from '../api/client';
import './CreateLinkForm.css';

const BACKEND_ORIGIN = 'http://localhost:3000';

interface CreateLinkFormProps {
  onLinkCreated: () => void;
}

/** Form card for creating a new short link with URL, optional slug, and optional expiration. */
export function CreateLinkForm({ onLinkCreated }: CreateLinkFormProps) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreatedLink(null);
    setSubmitting(true);

    try {
      const body: CreateLinkRequest = { url };
      if (slug.trim()) body.slug = slug.trim().toLowerCase();
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

      const link = await api.links.create(body);
      setCreatedLink(link);
      setUrl('');
      setSlug('');
      setExpiresAt('');
      onLinkCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-card-title">Shorten a Link</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="url">
            Long URL <span className="required">*</span>
          </label>
          <input
            id="url"
            type="url"
            className="form-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group form-group-grow">
            <label className="form-label" htmlFor="slug">
              Custom Alias (optional)
            </label>
            <input
              id="slug"
              type="text"
              className="form-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-custom-alias"
            />
            <span className="form-hint">3-30 chars, lowercase alphanumeric and hyphens</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="expiresAt">
              Expires (optional)
            </label>
            <input
              id="expiresAt"
              type="datetime-local"
              className="form-input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Shorten Link'}
        </button>
      </form>

      {formError && <div className="form-error">{formError}</div>}

      {createdLink && (
        <div className="form-success">
          Link created:{' '}
          <a
            href={`${BACKEND_ORIGIN}/${createdLink.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {BACKEND_ORIGIN}/{createdLink.slug}
          </a>
        </div>
      )}
    </div>
  );
}
