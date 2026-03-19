import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { LinkResponse } from '../api/client';
import { useWebSocket } from '../lib/useWebSocket';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { LinksTable } from '../components/LinksTable';

/** Home page composing the link creation form and the links table. */
export function LinksPage() {
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.links.list();
      setLinks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useWebSocket((evt) => {
    if (evt.event === 'click:recorded') {
      setLinks((prev) =>
        prev.map((link) =>
          link.id === evt.linkId
            ? { ...link, _count: { clicks: evt.totalClicks } }
            : link,
        ),
      );
    }
  });

  return (
    <div>
      <CreateLinkForm onLinkCreated={fetchLinks} />
      <LinksTable links={links} loading={loading} error={error} onRefresh={fetchLinks} />
    </div>
  );
}
