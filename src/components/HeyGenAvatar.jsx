import React, { useRef, useState, useCallback } from 'react';
import { LiveAvatarSession, SessionEvent, AgentEventsEnum } from '@heygen/liveavatar-web-sdk';

/**
 * LiveAvatar using the new official Web SDK.
 * - Connects using token from custom Python backend
 * - Decodes LiveKit WebRTC automatically
 * - Fully syncs speaking states
 */
export default function HeyGenAvatar({ avatarState, avatarRef, onAvatarReady }) {
    const videoRef = useRef(null);
    const sessionRef = useRef(null);

    const [status, setStatus] = useState('Disconnected');
    const [error, setError] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);

    // 1. Fetch token
    const getToken = useCallback(async () => {
        const res = await fetch('/api/liveavatar-token', { method: 'POST' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Token request failed (${res.status})`);
        }
        const json = await res.json();
        return json.token;
    }, []);

    // 2. Initialize SDK
    const startAvatar = async () => {
        try {
            setHasStarted(true);
            setStatus('Connecting...');
            setError(null);

            const token = await getToken();

            // Initialize session
            const session = new LiveAvatarSession(token, { voiceChat: false });
            sessionRef.current = session;

            // Bind events
            session.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
                if (state === 'connected') setStatus('Online');
                else if (state === 'disconnected' || state === 'closed') {
                    setStatus('Disconnected');
                    setHasStarted(false); // Safely show the button again
                }
            });

            session.on(SessionEvent.SESSION_STREAM_READY, () => {
                if (videoRef.current) {
                    session.attach(videoRef.current);
                }
            });

            session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => setStatus('Speaking...'));
            session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => setStatus('Online'));

            // Start WebRTC connection
            await session.start();

            setStatus('Online');
            if (onAvatarReady) onAvatarReady();
        } catch (err) {
            console.error('LiveAvatar init error:', err);
            setError(err.message || String(err));
            setStatus('Error');
            setHasStarted(false);
        }
    };

    // Safely assign the avatarRef methods continuously so the parent can always access them
    React.useEffect(() => {
        if (avatarRef) {
            avatarRef.current = {
                speak: async ({ text }) => {
                    // Auto-wake if session has died or disconnected
                    if (!sessionRef.current || status === 'Disconnected' || status === 'Error') {
                        await startAvatar();
                        // short delay to let WebRTC engage
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    if (sessionRef.current) {
                        sessionRef.current.repeat(text);
                    }
                },
                startListening: () => {
                    try {
                        if (sessionRef.current) sessionRef.current.startListening();
                    } catch (e) { }
                    if (status !== 'Disconnected') setStatus('Listening...');
                },
                stopListening: () => {
                    try {
                        if (sessionRef.current) sessionRef.current.stopListening();
                    } catch (e) { }
                    if (status !== 'Disconnected') setStatus('Online');
                },
                interrupt: () => {
                    if (sessionRef.current) sessionRef.current.interrupt();
                    if (status !== 'Disconnected') setStatus('Online');
                },
            };
        }
    }, [status]); // update ref when status changes so closures stay fresh

    // Cleanup
    React.useEffect(() => {
        return () => {
            if (sessionRef.current) {
                sessionRef.current.stop().catch(() => { });
                sessionRef.current = null;
            }
        };
    }, []);

    // ── Render ──────────────────────────────────────────────
    if (error) {
        return (
            <div style={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: '#fff1f2',
                borderRadius: '20px', padding: '20px', textAlign: 'center',
                color: '#be123c', fontSize: '13px',
            }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
                <strong>Avatar unavailable</strong>
                <div style={{ marginTop: '6px', opacity: 0.7, fontSize: '11px' }}>{error}</div>
                <button onClick={startAvatar} style={{
                    marginTop: '15px', padding: '8px 16px', background: '#be123c', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer'
                }}>Retry</button>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', background: '#0f172a' }}>
            {!hasStarted ? (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.9)', zIndex: 10
                }}>
                    <button onClick={startAvatar} style={{
                        padding: '12px 24px', background: '#10b981', color: '#fff', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', transition: 'transform 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                        {status === 'Disconnected' ? 'Reconnect AI Avatar' : 'Start AI Avatar'}
                    </button>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '12px' }}>Requires interaction before playing audio</p>
                </div>
            ) : null}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '20px' }}
            />

            {/* State ring */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: '20px', pointerEvents: 'none',
                border: `3px solid ${avatarState === 'thinking' ? '#f59e0b' :
                    avatarState === 'talking' ? '#10b981' : 'rgba(255,255,255,0.15)'
                    }`,
                transition: 'border-color 0.4s ease',
            }} />

            {/* Status badge */}
            <div style={{
                position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 12px',
                borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
                <span style={{
                    width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                    boxShadow: '0 0 6px currentColor',
                    background: status === 'Online' || status === 'Speaking...' ? '#10b981' :
                        status.startsWith('Connect') || status === 'Listening...' ? '#f59e0b' : '#ef4444',
                }} />
                {status}
            </div>
        </div>
    );
}
