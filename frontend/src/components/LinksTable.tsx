import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { LinkResponse } from '../api/client';
import { EditLinkModal } from './EditLinkModal';
import './LinksTable.css';

const BACKEND_ORIGIN = 'http://localhost:3000';

interface LinksTableProps {
  links: LinkResponse[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/** Ellipsis dropdown menu with Edit and Delete actions. */
function RowMenu({
  onEdit,
  onDelete,
  deleting,
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div
      className="row-menu"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="row-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Actions"
      >
        &hellip;
      </button>
      {open && (
        <div className="row-menu-dropdown">
          <button
            className="row-menu-item"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            className="row-menu-item row-menu-item-danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Table of all shortened links. Clicking a row navigates to its analytics page. */
export function LinksTable({ links, loading, error, onRefresh }: LinksTableProps) {
  const [editingLink, setEditingLink] = useState<LinkResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isExpired = (link: LinkResponse) =>
    link.expiresAt != null && new Date(link.expiresAt) < new Date();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this link? This will stop redirects but analytics data is preserved.')) {
      return;
    }

    setDeletingId(id);
    setDeleteError(null);
    try {
      await api.links.delete(id);
      onRefresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete link');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (link: LinkResponse, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('.row-menu')) return;
    navigate(`/links/${link.id}`);
  };

  if (loading) {
    return <div className="table-message">Loading links...</div>;
  }

  if (error) {
    return <div className="table-error">{error}</div>;
  }

  if (links.length === 0) {
    return (
      <div className="table-empty">
        <p>No links yet</p>
        <p className="table-empty-hint">Create your first short link above to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-card">
        <h2 className="table-title">Your Links</h2>
        {deleteError && (
          <div className="table-delete-error">
            {deleteError}
            <button
              className="table-delete-error-dismiss"
              onClick={() => setDeleteError(null)}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}
        <div className="table-wrapper">
          <table className="links-table">
            <thead>
              <tr>
                <th>Short URL</th>
                <th>Destination</th>
                <th>Clicks</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="clickable-row"
                  onClick={(e) => handleRowClick(link, e)}
                >
                  <td>
                    <a
                      href={`${BACKEND_ORIGIN}/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="slug-link"
                    >
                      /{link.slug}
                    </a>
                  </td>
                  <td className="target-cell" title={link.targetUrl}>
                    {link.targetUrl}
                  </td>
                  <td className="clicks-cell">{link._count?.clicks ?? 0}</td>
                  <td>
                    {isExpired(link) ? (
                      <span className="badge badge-expired">Expired</span>
                    ) : link.expiresAt ? (
                      <span className="badge badge-warning">
                        Expires {new Date(link.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="badge badge-active">Active</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <RowMenu
                      onEdit={() => setEditingLink(link)}
                      onDelete={() => handleDelete(link.id)}
                      deleting={deletingId === link.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}
