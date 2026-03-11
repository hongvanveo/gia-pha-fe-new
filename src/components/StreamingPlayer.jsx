import React from 'react';
import ReactPlayer from 'react-player';
import { Video } from 'lucide-react';

const StreamingPlayer = ({ url, type, title }) => {
    console.log("StreamingPlayer PROPS => url:", url, "type:", type, "title:", title);
    if (!url) {
        return (
            <div className="streaming-player-placeholder" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{
                    aspectRatio: "16/9",
                    background: "var(--surface-hover)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-light)",
                    gap: 12
                }}>
                    <Video size={48} opacity={0.3} />
                    <span>Chưa có nguồn phát trực tiếp cho sự kiện này.</span>
                </div>
                {title && (
                    <div style={{ padding: 16, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Video size={20} color="var(--primary)" /> {title}
                        </h3>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="streaming-player-wrapper" style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 8 }}>
                <div style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    animation: 'pulse 2s infinite'
                }}>
                    <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }}></span>
                    TRỰC TIẾP
                </div>
                {type && (
                    <div style={{
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        textTransform: 'uppercase'
                    }}>
                        {type}
                    </div>
                )}
            </div>

            <div style={{ position: 'relative', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                {(type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) ? (
                    <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                        src={`https://www.youtube.com/embed/${url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop()}?autoplay=0&rel=0`}
                        title={title || "YouTube video player"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                ) : (type === 'facebook' || url.includes('facebook.com')) ? (
                    <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`}
                        title={title || "Facebook video player"}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    ></iframe>
                ) : (
                    <ReactPlayer
                        url={url}
                        controls
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                        playing={false}
                        config={{
                            file: { forceHLS: type === 'hls' || url.includes('.m3u8') }
                        }}
                    />
                )}
            </div>

            {title && (
                <div style={{ padding: 16, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Video size={20} color="var(--primary)" /> {title}
                    </h3>
                </div>
            )}

            <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
        </div>
    );
};

export default StreamingPlayer;
