import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/api.js';
import { Chip, Empty, PageHead, fmtDate } from '../../components/ui.jsx';

export default function Notifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState(null);
  const load = async () => setItems(await api.listNotifications(profile.id));
  useEffect(() => { load(); }, []); // eslint-disable-line
  if (!items) return null;
  return (
    <div>
      <PageHead title="Notifications" subtitle="Updates from recruiters about your applications." />
      {items.length === 0 ? <Empty>No notifications yet.</Empty> : (
        <ul className="plain">
          {items.map((n) => (
            <li key={n.id} className={`card row between ${n.read ? '' : 'unread'}`}>
              <div>
                <div className="row" style={{ gap: 8 }}>{!n.read && <Chip tone="ok">New</Chip>}<b>{n.type}</b></div>
                <p>{n.message}</p>
                <small className="muted">{fmtDate(n.sentAt)}</small>
              </div>
              <button className="btn ghost" onClick={async () => { await api.markNotificationRead(n.id, !n.read); load(); }}>{n.read ? 'Mark as unread' : 'Mark as read'}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
