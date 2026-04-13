import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, getChatId, followUser, unfollowUser, requestFollow, cancelFollowRequest } from "../firebase/db";
import "boxicons/css/boxicons.min.css";
import "../styles/userProfileOverlay.css";

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

/* ── Gmail SVG ── */
function GmailIcon({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size}>
      <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z"/>
      <path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"/>
      <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
      <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8 4.924 8 3 9.924 3 12.298z"/>
      <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8 43.076 8 45 9.924 45 12.298z"/>
    </svg>
  );
}

/* ── Social icon renderer ── */
function SocialIcon({ link, sizeCls = "" }) {
  const inner = link.key === "email"
    ? <GmailIcon size={sizeCls ? 26 : 22} />
    : <i className={`bx ${link.icon}`} />;
  return (
    <div className={`upo-social-icon ${link.cls} ${sizeCls}`}>{inner}</div>
  );
}

/* ── Dynamic Social Links ── */
const SOCIAL_META = {
  instagram: { label: "Instagram", icon: "bxl-instagram", cls: "upo-social-ig", href: (v) => v },
  linkedin:  { label: "LinkedIn",  icon: "bxl-linkedin",  cls: "upo-social-li", href: (v) => v },
  github:    { label: "GitHub",    icon: "bxl-github",    cls: "upo-social-gh", href: (v) => v },
  email:     { label: "Email",     icon: null,            cls: "upo-social-em", href: (v) => `mailto:${v}` },
};

function SocialLinks({ social }) {
  if (!social) return null;
  const links = Object.entries(SOCIAL_META)
    .filter(([key]) => social[key])
    .map(([key, meta]) => ({ key, ...meta, value: social[key] }));
  if (links.length === 0) return null;

  const count = links.length;

  // 1 link — full row with name + external icon
  if (count === 1) {
    const l = links[0];
    return (
      <div className="upo-socials">
        <h3 className="upo-socials-title">Links</h3>
        <div className="upo-social-list">
          <a className="upo-social-item" href={l.href(l.value)} target="_blank" rel="noreferrer">
            <SocialIcon link={l} />
            <span>{l.label}</span>
            <i className="bx bx-link-external upo-social-ext" />
          </a>
        </div>
      </div>
    );
  }

  // 2 links — side by side with icon + name
  if (count === 2) {
    return (
      <div className="upo-socials">
        <h3 className="upo-socials-title">Links</h3>
        <div className="upo-social-duo">
          {links.map((l) => (
            <a key={l.key} className="upo-social-duo-item" href={l.href(l.value)} target="_blank" rel="noreferrer">
              <SocialIcon link={l} />
              <span>{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // 3 or 4 links — equal grid, icon + label below
  return (
    <div className="upo-socials">
      <h3 className="upo-socials-title">Links</h3>
      <div className="upo-social-grid" style={{ "--upo-grid-cols": count }}>
        {links.map((l) => (
          <a key={l.key} className="upo-social-grid-item" href={l.href(l.value)} target="_blank" rel="noreferrer">
            <SocialIcon link={l} sizeCls="upo-social-icon--lg" />
            <span>{l.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function UserProfileOverlay({ uid, onClose }) {
  const { currentUser, userProfile: myProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isFollowing = (myProfile?.following || []).includes(uid);
  const isRequested = (profile?.pendingFollowers || []).includes(currentUser?.uid);
  const isPrivate   = profile?.isPrivate || false;

  /* ── Load profile ── */
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getUserProfile(uid).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [uid]);

  /* ── Follow ── */
  const handleFollow = useCallback(async () => {
    if (!currentUser || actionLoading) return;
    setActionLoading(true);
    try {
      if (isPrivate) {
        await requestFollow(currentUser.uid, uid);
        setProfile((p) => ({ ...p, pendingFollowers: [...(p.pendingFollowers || []), currentUser.uid] }));
      } else {
        await followUser(currentUser.uid, uid);
        setProfile((p) => ({ ...p, followers: [...(p.followers || []), currentUser.uid] }));
      }
    } catch (e) { console.error(e); }
    setActionLoading(false);
  }, [currentUser, uid, isPrivate, actionLoading]);

  /* ── Unfollow ── */
  const handleUnfollow = useCallback(async () => {
    if (!currentUser || actionLoading) return;
    setActionLoading(true);
    try {
      await unfollowUser(currentUser.uid, uid);
      setProfile((p) => ({ ...p, followers: (p.followers || []).filter((f) => f !== currentUser.uid) }));
    } catch (e) { console.error(e); }
    setActionLoading(false);
  }, [currentUser, uid, actionLoading]);

  /* ── Cancel request ── */
  const handleCancelRequest = useCallback(async () => {
    if (!currentUser || actionLoading) return;
    setActionLoading(true);
    try {
      await cancelFollowRequest(currentUser.uid, uid);
      setProfile((p) => ({ ...p, pendingFollowers: (p.pendingFollowers || []).filter((f) => f !== currentUser.uid) }));
    } catch (e) { console.error(e); }
    setActionLoading(false);
  }, [currentUser, uid, actionLoading]);

  /* ── Message ── */
  const handleMessage = useCallback(() => {
    if (!currentUser || !uid) return;
    const chatId = getChatId(currentUser.uid, uid);
    onClose();
    navigate(`/chat/${chatId}`);
  }, [currentUser, uid, navigate, onClose]);

  /* ── Follow button ── */
  const renderFollowBtn = () => {
    if (actionLoading) return (
      <button className="upo-btn upo-btn--follow" disabled>
        <i className="bx bx-loader-alt bx-spin" />
      </button>
    );
    if (isFollowing) return (
      <button className="upo-btn upo-btn--following" onClick={handleUnfollow}>Following</button>
    );
    if (isRequested) return (
      <button className="upo-btn upo-btn--requested" onClick={handleCancelRequest}>Requested</button>
    );
    return (
      <button className="upo-btn upo-btn--follow" onClick={handleFollow}>Follow</button>
    );
  };

  const initials = getInitials(profile?.fullName);

  return createPortal(
    <div className="upo-overlay">

      {/* Floating back button over cover */}
      <div className="upo-header upo-header--minimal">
        <button className="upo-back-btn" onClick={onClose}>
          <i className="bx bx-arrow-back" />
        </button>
      </div>

      <div className="upo-body">
        {loading ? (
          <div className="upo-skeleton">
            <div className="upo-sk upo-sk--cover" />
            <div className="upo-sk-row">
              <div className="upo-sk upo-sk--avatar" />
              <div className="upo-sk-stats">
                {[0,1,2].map((i) => (
                  <div key={i} className="upo-sk-stat">
                    <div className="upo-sk upo-sk--num" />
                    <div className="upo-sk upo-sk--lbl" />
                  </div>
                ))}
              </div>
            </div>
            <div className="upo-sk-info">
              <div className="upo-sk upo-sk--name" />
              <div className="upo-sk upo-sk--sub" />
              <div className="upo-sk upo-sk--bio" />
              <div className="upo-sk upo-sk--bio upo-sk--bio2" />
            </div>
          </div>
        ) : (
          <>
            {/* Cover + avatar + stats */}
            <div className="upo-cover-section">
              <div className="upo-cover">
                {profile?.coverPhotoURL
                  ? <img src={profile.coverPhotoURL} alt="cover" className="upo-cover-img" />
                  : <div className="upo-cover-placeholder" />
                }
              </div>

              <div className="upo-avatar-wrap">
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt={profile.fullName} className="upo-avatar-img" />
                  : <div className="upo-avatar-fallback">{initials}</div>
                }
              </div>

              <div className="upo-stats-block">
                <div className="upo-stat">
                  <span className="upo-stat-count">{(profile?.posts || []).length || 0}</span>
                  <span className="upo-stat-label">posts</span>
                </div>
                <div className="upo-stat">
                  <span className="upo-stat-count">{(profile?.followers || []).length || 0}</span>
                  <span className="upo-stat-label">followers</span>
                </div>
                <div className="upo-stat">
                  <span className="upo-stat-count">{(profile?.following || []).length || 0}</span>
                  <span className="upo-stat-label">following</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="upo-info">
              <h2 className="upo-name">{profile?.fullName}</h2>
              <p className="upo-username">@{profile?.username}</p>

              {/* Chips */}
              <div className="upo-chips">
                {profile?.role && (
                  <span className={`upo-chip upo-chip--role ${profile.role === "student" ? "upo-chip--student" : "upo-chip--faculty"}`}>
                    <i className={`bx ${profile.role === "student" ? "bx-user" : "bx-chalkboard"}`} />
                    {profile.role === "student" ? "Student" : "Faculty"}
                  </span>
                )}
                {profile?.branch     && <span className="upo-chip"><i className="bx bx-book-alt" />{profile.branch}</span>}
                {profile?.year       && <span className="upo-chip"><i className="bx bx-calendar" />{profile.year}</span>}
                {profile?.roll       && <span className="upo-chip"><i className="bx bx-id-card" />{profile.roll}</span>}
                {profile?.department && <span className="upo-chip"><i className="bx bx-buildings" />{profile.department}</span>}
                {profile?.subject    && <span className="upo-chip"><i className="bx bx-book-open" />{profile.subject}</span>}
              </div>

              {/* Bio */}
              {profile?.bio && <p className="upo-bio">{profile.bio}</p>}

              {/* Actions */}
              <div className="upo-actions">
                {renderFollowBtn()}
                <button className="upo-btn upo-btn--message" onClick={handleMessage}>
                  <i className="bx bx-message-rounded-dots" /> Message
                </button>
              </div>

              {/* Private notice */}
              {isPrivate && !isFollowing && (
                <div className="upo-private-notice">
                  <i className="bx bx-lock-alt" />
                  <div>
                    <p>This account is private</p>
                    <span>Follow to see their posts and activity.</span>
                  </div>
                </div>
              )}

              {/* Social links */}
              <SocialLinks social={profile?.social} />
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}