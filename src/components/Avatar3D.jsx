import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Html } from '@react-three/drei';

// A Ready Player Me female avatar URL stored locally
const avatarUrl = "/rp_posedplus_00068_18_300k.glb";

function Model({ state }) {
    const { scene } = useGLTF(avatarUrl);

    // Clone the scene so we can mutate it safely
    const clone = useMemo(() => scene.clone(), [scene]);
    const headRef = useRef(null);
    const neckRef = useRef(null);

    // Find specific bones for animation
    useEffect(() => {
        clone.traverse((child) => {
            if (child.isBone) {
                if (child.name === 'Head') headRef.current = child;
                if (child.name === 'Neck') neckRef.current = child;
            }
        });
    }, [clone]);

    useFrame((stateObj) => {
        const t = stateObj.clock.getElapsedTime();

        // 1. Idle Body Animations (Breathing)
        if (neckRef.current) {
            neckRef.current.rotation.x = Math.sin(t * 1.5) * 0.02;
        }

        // 2. Head & State Animations
        if (headRef.current) {
            if (state === 'listening') {
                headRef.current.rotation.x = Math.sin(t * 0.8) * 0.04;
                headRef.current.rotation.y = Math.sin(t * 0.5) * 0.08;
            } else if (state === 'thinking') {
                headRef.current.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.02;
                headRef.current.rotation.y = 0.2 + Math.sin(t * 1.2) * 0.03;
            } else if (state === 'talking') {
                headRef.current.rotation.x = Math.sin(t * 5) * 0.03 + 0.02;
                headRef.current.rotation.y = Math.sin(t * 3) * 0.06;
            }
        }

        // 3. Safe Facial Morph Targets (Lip Sync & Blinking)
        clone.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                // Blinking (eyeBlinkLeft / eyeBlinkRight)
                const eyeL = child.morphTargetDictionary['eyeBlinkLeft'];
                const eyeR = child.morphTargetDictionary['eyeBlinkRight'];

                // Blink logic: quick spike every few seconds
                const blinkPhase = (t * 2) % (Math.PI * 2);
                const blinkAmt = blinkPhase > Math.PI * 1.9 ? Math.pow(Math.sin(blinkPhase), 40) : 0;

                if (eyeL !== undefined) child.morphTargetInfluences[eyeL] = blinkAmt;
                if (eyeR !== undefined) child.morphTargetInfluences[eyeR] = blinkAmt;

                // Talking (jawOpen) ARkit uses 'jawOpen'
                const jawOpen = child.morphTargetDictionary['jawOpen'];
                const mouthSmile = child.morphTargetDictionary['mouthSmile'];

                if (jawOpen !== undefined) {
                    if (state === 'talking') {
                        // Rapid varied movement for speech simulation
                        const speechAmount = Math.max(0, Math.sin(t * 20) * 0.4 + Math.sin(t * 35) * 0.4);
                        child.morphTargetInfluences[jawOpen] = speechAmount * 0.9;
                    } else {
                        // Mouth closed when not talking
                        child.morphTargetInfluences[jawOpen] = 0;
                    }
                }

                // Add a friendly expression when just listening
                if (mouthSmile !== undefined) {
                    child.morphTargetInfluences[mouthSmile] = state === 'listening' ? 0.4 : 0.1;
                }
            }
        });
    });

    // Position the model - face portrait view
    return <primitive object={clone} position={[0, -1.2, 0]} scale={1.0} />;
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("WebGL 3D Avatar Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            // Fallback to the AI-generated high-quality static images gracefully
            const state = this.props.avatarState;
            const imgSrc = state === 'thinking' ? '/avatar_thinking.png' :
                state === 'talking' ? '/avatar_talking.png' :
                    '/avatar_idle.png';
            return (
                <div style={{ width: '100%', height: '100%', background: '#f0f9ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imgSrc} alt="Avatar Fallback" style={{ width: '100%', borderRadius: '20px', zIndex: 1, border: '4px solid white' }} className={`ai-avatar-image ${state}`} />
                    <div style={{ position: 'absolute', bottom: 10, fontSize: 10, backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 4, zIndex: 2 }}>3D WebGL Unavailable</div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function Avatar3D({ state }) {
    return (
        <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', background: '#e0e7ff', position: 'relative' }}>
            <ErrorBoundary avatarState={state}>
                <Canvas camera={{ position: [0, 1.5, 2.0], fov: 30 }} gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance" }}>
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[2, 2, 5]} intensity={1.5} />
                    <directionalLight position={[-2, 2, -2]} intensity={0.5} />
                    <Environment preset="city" />
                    <React.Suspense fallback={<Html center><div style={{ color: '#fff', fontSize: '14px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '10px' }}>Loading 3D Model...</div></Html>}>
                        <Model state={state} />
                    </React.Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
}

useGLTF.preload(avatarUrl);



