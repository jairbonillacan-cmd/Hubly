"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowUpRight,
  Bell,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Plus,
  Repeat2,
  Search,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  User,
  Video,
} from "lucide-react";
import { Cover, type CoverKind } from "@/components/Cover";
import { feedCutIndex } from "@/lib/network-catalog";
import type { PlatformSettings, PostFormat, SocialNetwork } from "@/lib/types";

export interface PhoneMedia {
  id: string;
  kind: "image" | "video";
  url?: string;
  name?: string;
}

export interface PhonePost {
  network: SocialNetwork;
  format: PostFormat;
  brandName: string;
  handle: string;
  initials: string;
  color: string;
  caption: string;
  media: PhoneMedia[];
  cover: CoverKind;
  settings?: PlatformSettings;
}

const WIDTH = 360;
const HEIGHT = 760;

/** Marco fijo a tamaño lógico y escalado completo: el post nunca se deforma. */
export function PhoneFrame({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width > 0) setScale(Math.min(width / (WIDTH + 12), height > 0 ? height / (HEIGHT + 12) : 1, 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="hubly-phone-host">
      <div className="hubly-phone-scaled" style={{ width: (WIDTH + 12) * scale, height: (HEIGHT + 12) * scale }}>
        <div className="hubly-phone" data-dark={dark || undefined} style={{ width: WIDTH + 12, height: HEIGHT + 12, transform: `scale(${scale})` }}>
          <i className="hubly-phone-btn is-action" />
          <i className="hubly-phone-btn is-up" />
          <i className="hubly-phone-btn is-down" />
          <i className="hubly-phone-btn is-power" />
          <div className="hubly-phone-screen">
            <div className="hubly-phone-status" aria-hidden>
              <span>9:41</span>
              <b className="hubly-phone-island" />
              <span className="hubly-phone-status-icons">
                <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect y="7" width="3" height="4" rx="1" /><rect x="4.6" y="5" width="3" height="6" rx="1" /><rect x="9.2" y="2.6" width="3" height="8.4" rx="1" /><rect x="13.8" width="3" height="11" rx="1" /></svg>
                <svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="currentColor" opacity="0.5" /><rect x="2" y="2" width="17" height="7" rx="1.6" fill="currentColor" /><rect x="21.6" y="3.5" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.5" /></svg>
              </span>
            </div>
            <div className="hubly-phone-app">{children}</div>
            <div className="hubly-phone-home" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ post, size = 36, ring }: { post: PhonePost; size?: number; ring?: string }) {
  return (
    <span className="np-avatar" style={{ width: size, height: size, background: post.color, boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${ring}` : undefined, fontSize: size * 0.36 }}>
      {post.initials}
    </span>
  );
}

function MediaView({ post, ratio, fit = "cover", rounded = 0 }: { post: PhonePost; ratio?: string; fit?: "cover" | "contain"; rounded?: number }) {
  const [index, setIndex] = useState(0);
  const items = post.media;
  const current = items[Math.min(index, Math.max(items.length - 1, 0))];
  const style = { aspectRatio: ratio, borderRadius: rounded };
  if (!current) {
    return (
      <div className="np-media" style={style}>
        <Cover kind={post.cover} />
      </div>
    );
  }
  return (
    <div className="np-media" style={style}>
      {current.kind === "video" ? (
        <video key={current.id} src={current.url} controls playsInline preload="metadata" style={{ objectFit: fit }} aria-label={current.name || "Video del post"} />
      ) : (
        // Vista previa de un archivo privado: next/image no puede optimizar la URL firmada.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.url} alt={current.name || "Imagen del post"} style={{ objectFit: fit }} />
      )}
      {items.length > 1 && (
        <>
          <button type="button" className="np-nav is-prev" aria-label="Archivo anterior" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="np-nav is-next" aria-label="Archivo siguiente" disabled={index >= items.length - 1} onClick={() => setIndex((i) => i + 1)}>
            <ChevronRight size={18} />
          </button>
          <span className="np-count">{index + 1}/{items.length}</span>
          <span className="np-dots" aria-hidden>
            {items.map((item, i) => <i key={item.id} data-on={i === index || undefined} />)}
          </span>
        </>
      )}
    </div>
  );
}

/** Marca dónde corta el feed; solo se ve en la simulación, no forma parte del post. */
function Caption({ post, strongName, className = "np-caption" }: { post: PhonePost; strongName?: string; className?: string }) {
  const text = post.caption || "Escribe tu copy…";
  const cut = post.caption ? feedCutIndex(post.caption, post.network) : null;
  const name = strongName ? <b>{strongName} </b> : null;
  if (cut === null) return <p className={className}>{name}{text}</p>;
  return (
    <div className={className}>
      <p>{name}{text.slice(0, cut)}</p>
      <div className="np-cut"><span>El feed corta aquí</span></div>
      <p className="np-after-cut">{text.slice(cut)}</p>
    </div>
  );
}

const Bar = ({ children, color }: { children: ReactNode; color?: string }) => <div className="np-tabbar" style={{ color }}>{children}</div>;

function InstagramScreen({ post }: { post: PhonePost }) {
  if (post.format === "Story") {
    return (
      <div className="np-immersive">
        <div className="np-story-bars" aria-hidden>{(post.media.length ? post.media : [{ id: "0" }]).map((m) => <i key={m.id} />)}</div>
        <div className="np-story-head"><Avatar post={post} size={30} /><b>{post.handle}</b><span>Ahora</span></div>
        <MediaView post={post} />
        <div className="np-story-reply"><span>Enviar mensaje…</span><Heart size={22} /><Send size={22} /></div>
      </div>
    );
  }
  if (post.format === "Reel / Video") {
    return (
      <div className="np-immersive">
        <MediaView post={post} />
        <div className="np-rail"><Heart size={26} /><MessageCircle size={26} /><Send size={26} /><MoreHorizontal size={24} /></div>
        <div className="np-reel-info"><span className="np-row"><Avatar post={post} size={30} /><b>{post.handle}</b></span><Caption post={post} className="np-caption is-light" /><span className="np-row"><Music2 size={13} /> Audio original</span></div>
      </div>
    );
  }
  return (
    <div className="np-column">
      <div className="np-ig-top"><strong>Instagram</strong><span className="np-row"><Heart size={22} /><Send size={22} /></span></div>
      <div className="np-post-head"><Avatar post={post} size={32} ring="#E4405F" /><div><b>{post.handle}</b>{post.settings?.location && <small>{post.settings.location}</small>}</div><MoreHorizontal size={18} /></div>
      <MediaView post={post} ratio="4 / 5" />
      <div className="np-actions"><Heart size={24} /><MessageCircle size={24} /><Send size={24} /><Bookmark size={24} style={{ marginLeft: "auto" }} /></div>
      <Caption post={post} strongName={post.handle} />
      {post.settings?.firstComment && <p className="np-caption np-muted">Primer comentario: {post.settings.firstComment}</p>}
      <Bar><Home size={24} /><Search size={24} /><Plus size={24} /><Video size={24} /><User size={24} /></Bar>
    </div>
  );
}

function FacebookScreen({ post }: { post: PhonePost }) {
  return (
    <div className="np-column np-fb">
      <div className="np-fb-top"><strong>facebook</strong><span className="np-row"><i><Plus size={16} /></i><i><Search size={16} /></i><i><MessageCircle size={16} /></i></span></div>
      <div className="np-post-head"><Avatar post={post} size={38} /><div><b>{post.brandName}</b><small className="np-row">Ahora · <Globe size={11} /></small></div><MoreHorizontal size={18} /></div>
      <Caption post={post} />
      <MediaView post={post} ratio="1 / 1" />
      <div className="np-fb-actions"><span><ThumbsUp size={17} /> Me gusta</span><span><MessageCircle size={17} /> Comentar</span><span><Share2 size={17} /> Compartir</span></div>
      <Bar color="#65676B"><Home size={23} color="#1877F2" /><Video size={23} /><User size={23} /><Bell size={23} /></Bar>
    </div>
  );
}

function TikTokScreen({ post }: { post: PhonePost }) {
  return (
    <div className="np-immersive">
      <MediaView post={post} />
      <div className="np-tt-tabs"><span>Siguiendo</span><b>Para ti</b></div>
      <div className="np-rail">
        <span className="np-tt-avatar"><Avatar post={post} size={42} /><i><Plus size={12} /></i></span>
        <Heart size={30} fill="#fff" /><MessageCircle size={30} fill="#fff" /><Bookmark size={28} fill="#fff" /><Share2 size={28} />
        <span className="np-tt-disc"><Music2 size={14} /></span>
      </div>
      <div className="np-reel-info"><b>@{post.handle}</b><Caption post={post} className="np-caption is-light" /><span className="np-row"><Music2 size={13} /> Sonido original</span></div>
      <Bar color="#fff"><Home size={22} /><User size={22} /><span className="np-tt-plus"><Plus size={18} /></span><MessageCircle size={22} /><User size={22} /></Bar>
    </div>
  );
}

function LinkedInScreen({ post }: { post: PhonePost }) {
  return (
    <div className="np-column np-li">
      <div className="np-li-top"><Avatar post={post} size={26} /><span className="np-li-search"><Search size={14} /> Buscar</span><MessageCircle size={21} /></div>
      <div className="np-post-head"><Avatar post={post} size={44} /><div><b>{post.brandName}</b><small className="np-row">Ahora · <Globe size={11} /></small></div><span className="np-li-follow"><Plus size={14} /> Seguir</span></div>
      <Caption post={post} />
      <MediaView post={post} ratio="1.2 / 1" />
      <div className="np-li-actions"><span><ThumbsUp size={17} />Recomendar</span><span><MessageCircle size={17} />Comentar</span><span><Repeat2 size={17} />Compartir</span><span><Send size={17} />Enviar</span></div>
    </div>
  );
}

function YouTubeScreen({ post }: { post: PhonePost }) {
  const title = post.settings?.title || post.caption.slice(0, 100) || "Título del video";
  if (post.format === "Reel / Video" && post.settings?.privacy !== "largo") {
    return (
      <div className="np-immersive">
        <MediaView post={post} />
        <div className="np-rail"><ThumbsUp size={26} /><ThumbsDown size={26} /><MessageCircle size={26} /><Share2 size={26} /></div>
        <div className="np-reel-info"><span className="np-row"><Avatar post={post} size={30} /><b>@{post.handle}</b><span className="np-yt-sub">Suscribirme</span></span><p className="np-caption is-light">{title}</p></div>
        <Bar color="#fff"><Home size={22} /><Video size={22} /><Plus size={24} /><Bell size={22} /><User size={22} /></Bar>
      </div>
    );
  }
  return (
    <div className="np-column">
      <div className="np-yt-top"><span className="np-yt-logo"><i />YouTube</span><span className="np-row"><Bell size={20} /><Search size={20} /></span></div>
      <MediaView post={post} ratio="16 / 9" />
      <div className="np-post-head"><Avatar post={post} size={36} /><div><b>{title}</b><small>{post.brandName}</small></div></div>
    </div>
  );
}

function XScreen({ post }: { post: PhonePost }) {
  return (
    <div className="np-column np-x">
      <div className="np-x-top"><Avatar post={post} size={28} /><strong>𝕏</strong><span /></div>
      <div className="np-x-tweet">
        <Avatar post={post} size={40} />
        <div>
          <p className="np-x-name"><b>{post.brandName}</b> <span>@{post.handle} · Ahora</span></p>
          <p className="np-caption np-flush">{post.caption || "Escribe tu copy…"}</p>
          {(post.media.length > 0 || post.format !== "Texto") && <MediaView post={post} ratio="16 / 10" rounded={16} />}
          <div className="np-x-actions"><MessageCircle size={17} /><Repeat2 size={17} /><Heart size={17} /><Bookmark size={17} /><Share2 size={17} /></div>
        </div>
      </div>
      <Bar><Home size={23} /><Search size={23} /><Bell size={23} /><MessageCircle size={23} /></Bar>
    </div>
  );
}

function ThreadsScreen({ post }: { post: PhonePost }) {
  return (
    <div className="np-column np-th">
      <div className="np-th-top">@</div>
      <div className="np-th-post">
        <div className="np-th-rail"><Avatar post={post} size={36} /><i /></div>
        <div>
          <p className="np-x-name"><b>{post.handle}</b> <span>1 min</span></p>
          <Caption post={post} className="np-caption np-flush" />
          {(post.media.length > 0 || post.format !== "Texto") && <MediaView post={post} ratio="4 / 5" rounded={12} />}
          <div className="np-x-actions is-tight"><Heart size={19} /><MessageCircle size={19} /><Repeat2 size={19} /><Send size={19} /></div>
        </div>
      </div>
      <Bar><Home size={23} /><Search size={23} /><Plus size={23} /><Heart size={23} /><User size={23} /></Bar>
    </div>
  );
}

function PinterestScreen({ post }: { post: PhonePost }) {
  return (
    <div className="np-column np-pin">
      <div className="np-pin-top">Pinterest</div>
      <div className="np-pin-card">
        <MediaView post={post} rounded={24} ratio="3 / 4" />
        <span className="np-pin-save">Guardar</span>
      </div>
      {post.settings?.boardName && <span className="np-pin-board">{post.settings.boardName}</span>}
      <div className="np-post-head"><Avatar post={post} size={28} /><div><b>{post.brandName}</b></div></div>
      {post.settings?.title && <strong className="np-pin-title">{post.settings.title}</strong>}
      <Caption post={post} />
      {post.settings?.link && <span className="np-pin-link"><ArrowUpRight size={14} /> {post.settings.link}</span>}
      <Bar><Home size={23} /><Search size={23} /><Plus size={23} /><MessageCircle size={23} /><User size={23} /></Bar>
    </div>
  );
}

function RedditScreen({ post }: { post: PhonePost }) {
  const community = post.settings?.subreddit ? post.settings.subreddit.replace(/^r\//, "") : "comunidad";
  return (
    <div className="np-column np-rd">
      <div className="np-rd-top"><span className="np-rd-logo">reddit</span><Search size={20} /></div>
      <div className="np-rd-post">
        <p className="np-rd-meta"><b>r/{community}</b> · u/{post.handle}</p>
        {post.settings?.flair && <span className="np-rd-flair">{post.settings.flair}</span>}
        <h4>{post.settings?.title || "Título del hilo"}</h4>
        <Caption post={post} className="np-caption np-flush" />
        {post.media.length > 0 && <MediaView post={post} ratio="4 / 3" rounded={10} />}
        <div className="np-rd-actions"><span><ArrowBigUp size={19} /> Votar <ArrowBigDown size={19} /></span><span><MessageCircle size={16} /></span><span><Share2 size={16} /></span></div>
      </div>
      <Bar><Home size={23} /><Search size={23} /><Plus size={23} /><MessageCircle size={23} /><Bell size={23} /></Bar>
    </div>
  );
}

const GB_TOPIC = { STANDARD: "Novedad", EVENT: "Evento", OFFER: "Oferta" } as const;

function GoogleBusinessScreen({ post }: { post: PhonePost }) {
  const topic = post.settings?.topicType ?? "STANDARD";
  return (
    <div className="np-column np-gb">
      <div className="np-gb-search"><Search size={16} /><span>{post.brandName}</span></div>
      <div className="np-gb-card">
        <div className="np-post-head"><Avatar post={post} size={36} /><div><b>{post.brandName}</b><small className="np-row"><MapPin size={11} /> Perfil de negocio</small></div></div>
        {post.media.length > 0 && <MediaView post={post} ratio="4 / 3" />}
        <span className="np-gb-topic">{topic === "EVENT" ? <CalendarDays size={13} /> : topic === "OFFER" ? <Ticket size={13} /> : null} {GB_TOPIC[topic]}</span>
        {post.settings?.title && <strong className="np-pin-title">{post.settings.title}</strong>}
        <Caption post={post} />
        {topic === "OFFER" && post.settings?.couponCode && <div className="np-gb-coupon">Cupón <b>{post.settings.couponCode}</b></div>}
        <span className="np-gb-cta">{post.settings?.callToAction || "Más información"}</span>
      </div>
    </div>
  );
}

const SCREENS: Record<SocialNetwork, (props: { post: PhonePost }) => ReactNode> = {
  Instagram: InstagramScreen,
  Facebook: FacebookScreen,
  TikTok: TikTokScreen,
  LinkedIn: LinkedInScreen,
  YouTube: YouTubeScreen,
  X: XScreen,
  Threads: ThreadsScreen,
  Pinterest: PinterestScreen,
  Reddit: RedditScreen,
  "Google Business": GoogleBusinessScreen,
};

const isImmersive = (post: PhonePost) =>
  post.network === "TikTok" ||
  (post.network === "Instagram" && (post.format === "Story" || post.format === "Reel / Video")) ||
  (post.network === "YouTube" && post.format === "Reel / Video");

export function PhonePreview({ post }: { post: PhonePost }) {
  const Screen = SCREENS[post.network];
  return (
    <PhoneFrame dark={isImmersive(post)}>
      <Screen post={post} />
    </PhoneFrame>
  );
}
