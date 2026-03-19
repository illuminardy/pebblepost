import { useState } from 'react';
import { api } from '../api/client';
import type { LinkResponse, UpdateLinkRequest } from '../api/client';
import './EditLinkModal.css';

interface EditLinkModalProps {
  link: LinkResponse;
  onClose: () => void;
  onUpdated: () => void;
}

/** Inline modal for editing a link's target URL and expiration date. */
export function EditLinkModal({ link, onClose, onUpdated }: EditLinkModalProps) {
  const [url, setUrl] = useState(link.targetUrl);
  const [expiresAt, setExpiresAt] = useState(
    link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
  );
  const [removeExpiry, setRemoveExpiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const body: UpdateLinkRequest = {};

      if (url !== link.targetUrl) {
        body.url = url;
      }

      if (removeExpiry) {
        body.expiresAt = null;
      } else if (expiresAt) {
        const newExpiry = new Date(expiresAt).toISOString();
        if (newExpiry !== link.expiresAt) {
          body.expiresAt = newExpiry;
        }
      }

      if (body.url === undefined && body.expiresAt === undefined) {
        onClose();
        return;
      }

      await api.links.update(link.id, body);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Link</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-field">
              <label className="modal-label" htmlFor="edit-slug">Short URL</label>
              <input
                id="edit-slug"
                type="text"
                className="modal-input"
                value={`/${link.slug}`}
                disabled
              />
              <span className="modal-hint">Slug cannot be changed</span>
            </div>

            <div className="modal-field">
              <label className="modal-label" htmlFor="edit-url">Target URL</label>
              <input
                id="edit-url"
                type="url"
                className="modal-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-label" htmlFor="edit-expires">Expiration</label>
              <div className="modal-expiry-row">
                <input
                  id="edit-expires"
                  type="datetime-local"
                  className="modal-input"
                  value={removeExpiry ? '' : expiresAt}
                  onChange={(e) => {
                    setExpiresAt(e.target.value);
                    setRemoveExpiry(false);
                  }}
                  disabled={removeExpiry}
                />
                {(link.expiresAt || expiresAt) && (
                  <label className="modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={removeExpiry}
                      onChange={(e) => setRemoveExpiry(e.target.checked)}
                    />
                    Remove expiry
                  </label>
                )}
              </div>
            </div>

            {error && <div className="modal-error">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
