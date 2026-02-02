import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArtStyle,
  PieceShape,
  PieceMaterial,
  MovementType,
  UserPreferences,
  TopicType,
  PuzzleBackground,
} from "./types";
import { useProductionPipeline } from "./hooks/useProductionPipeline";
import { CanvasHandle } from "./components/AutoColorCanvas";
import Sidebar from "./components/Sidebar";
import CanvasArea from "./components/CanvasArea";
import Header from "./components/Header";
import ProductionProgress from "./components/ProductionProgress";
import MetadataStudio from "./components/engagement/MetadataStudio";
import ThumbnailGenerator from "./components/ThumbnailGenerator";
import AudioStatus from "./components/layout/AudioStatus";
import RecordingSystem from "./components/RecordingSystem";
import { MusicTrack } from "./components/sidebar/MusicUploader";
import { playWithFade, pauseWithFade } from "./utils/audioFade";
import { BackendModeProvider } from "./contexts/BackendModeContext";

const AppContent: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    style: ArtStyle.HYPER_REALISTIC,
    subject: "Ancient Mystery Revealed",
    durationMinutes: 1.0,
    pieceCount: 500,
    shape: PieceShape.JIGSAW,
    material: PieceMaterial.CARDBOARD,
    movement: MovementType.STANDARD,
    background: PuzzleBackground.FROSTED_DISCOVERY,
    topicType: TopicType.MANUAL,
    showDocumentaryTips: true,
  });

  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);

  const [engagementGifUrl, setEngagementGifUrl] = useState<string | null>(null);
  const [channelLogoUrl, setChannelLogoUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);

  const handleAddCloudTrack = useCallback(
    (url: string, title: string, source: "backend" | "ai" = "backend") => {
      const newTrack: MusicTrack = {
        id: Math.random().toString(36).substr(2, 9),
        name: title,
        url: url,
        source: source,
      };
      setMusicTracks((prev) => [...prev, newTrack]);
      setSelectedTrackId(newTrack.id);
      // Note: Audio is already loaded in selectSmartMusic, don't reload here to prevent conflicts
      console.log(`📝 [App] Cloud track added to list: ${title} (${source})`);
    },
    []
  );

  const {
    state,
    setState,
    metadata,
    isMetadataLoading,
    setThumbnailDataUrl,
    setLastVideoBlob,
    processPipelineItem,
    toggleAutoMode,
  } = useProductionPipeline(
    preferences,
    setPreferences,
    musicTracks,
    selectedTrackId,
    setActiveTrackName,
    handleAddCloudTrack,
    audioRef,
    musicBufferRef
  );

  const handleToggleSolve = async () => {
    setState((s) => {
      const nextSolving = !s.isSolving;
      if (audioRef.current) {
        if (nextSolving) {
          audioRef.current.currentTime = 0;
          // Fade in over 2 seconds
          playWithFade(audioRef.current, { duration: 2000, targetVolume: 1.0 });
        } else {
          // Fade out over 1.5 seconds then pause
          pauseWithFade(audioRef.current, { duration: 1500 });
        }
      }
      return {
        ...s,
        isSolving: nextSolving,
        isRecording: nextSolving,
        pipelineStep: nextSolving ? "RECORDING" : "IDLE",
      };
    });
  };

  const handleToggleFullPackage = useCallback(() => {
    setState((prev) => ({ ...prev, isFullPackage: !prev.isFullPackage }));
  }, [setState]);

  const handlePuzzleFinished = async () => {
    if (audioRef.current) {
      // Fade out over 1.5 seconds when puzzle completes
      await pauseWithFade(audioRef.current, { duration: 1500 });
      audioRef.current.currentTime = 0;
    }
    setState((s) => ({ ...s, isSolving: false, isRecording: false, pipelineStep: "PACKAGING" }));
  };

  return (
    <div className="flex h-screen bg-[#020205] text-slate-100 overflow-hidden font-['Inter'] relative">
      <audio ref={audioRef} loop crossOrigin="anonymous" style={{ display: "none" }} />

      {/* Production Progress Indicator */}
      {state.isAutoMode && state.productionSteps && state.productionSteps.length > 0 && (
        <ProductionProgress
          currentVideo={state.currentQueueIdx + 1}
          totalVideos={state.queue.length}
          steps={state.productionSteps}
        />
      )}

      <RecordingSystem
        isRecording={state.isRecording}
        getCanvas={() => canvasHandleRef.current?.getCanvas() || null}
        audioRef={audioRef}
        musicBufferRef={musicBufferRef}
        metadata={metadata}
        durationMinutes={preferences.durationMinutes}
        onRecordingComplete={setLastVideoBlob}
      />

      <aside className="w-[420px] z-40 h-full glass-panel flex flex-col shrink-0">
        <Sidebar
          preferences={preferences}
          setPreferences={setPreferences}
          isGenerating={state.isGenerating}
          isSolving={state.isSolving}
          isAutoMode={state.isAutoMode}
          pipelineStep={state.pipelineStep}
          isFullPackage={state.isFullPackage}
          currentPackageIndex={state.currentQueueIdx}
          packageQueueLength={state.queue.length}
          onToggleFullPackage={handleToggleFullPackage}
          hasImage={!!state.imageUrl}
          onGenerate={(isManual: boolean) => {
            processPipelineItem(
              { duration: preferences.durationMinutes, source: "VIRAL", pieceCount: 500 },
              isManual,
              0
            );
          }}
          onAutoMode={toggleAutoMode}
          onToggleSolve={handleToggleSolve}
          musicTracks={musicTracks}
          selectedTrackId={selectedTrackId}
          onAddMusicTracks={(files) => {
            const newTracks = Array.from(files).map((f: File) => ({
              id: Math.random().toString(36).substr(2, 9),
              name: f.name,
              url: URL.createObjectURL(f),
              source: "manual" as const,
            }));
            setMusicTracks((prev) => [...prev, ...newTracks]);
            if (newTracks.length === 1) setSelectedTrackId(newTracks[0].id);
          }}
          onAddCloudTrack={handleAddCloudTrack}
          onSelectTrack={setSelectedTrackId}
          onRemoveTrack={(id) => {
            setMusicTracks((prev) => prev.filter((t) => t.id !== id));
            if (selectedTrackId === id) setSelectedTrackId(null);
          }}
          onGifChange={setEngagementGifUrl}
          onChannelLogoChange={setChannelLogoUrl}
        />
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#020205] relative z-10 flex flex-col">
        <Header
          progress={state.progress}
          isColoring={state.isSolving}
          isRecording={state.isRecording}
          error={state.error}
          hasImage={!!state.imageUrl}
        />

        <section className="h-[85vh] w-full relative bg-black shrink-0">
          <CanvasArea
            canvasHandleRef={canvasHandleRef}
            imageUrl={state.imageUrl}
            durationMinutes={preferences.durationMinutes}
            isColoring={state.isSolving}
            pieceCount={preferences.pieceCount}
            shape={preferences.shape}
            material={preferences.material}
            movement={preferences.movement}
            background={preferences.background}
            topicCategory={preferences.topicCategory}
            engagementGifUrl={engagementGifUrl}
            channelLogoUrl={channelLogoUrl}
            onProgress={(p) => setState((prev) => ({ ...prev, progress: p }))}
            onFinished={handlePuzzleFinished}
            onToggleSolve={handleToggleSolve}
            docSnippets={state.docSnippets}
            storyArc={state.storyArc}
            showDocumentaryTips={preferences.showDocumentaryTips}
            progress={state.progress}
          />
        </section>

        <div className="w-full bg-[#050508] border-t border-white/5 pb-32">
          {(state.imageUrl || metadata || isMetadataLoading) && (
            <div className="max-w-7xl mx-auto px-8 py-20 space-y-20">
              <ThumbnailGenerator
                imageUrl={state.imageUrl}
                metadata={metadata}
                isLoading={isMetadataLoading}
                isShortsMode={true}
                narrativeLens={preferences.narrativeLens}
                onThumbnailReady={setThumbnailDataUrl}
              />
              <MetadataStudio metadata={metadata} isLoading={isMetadataLoading} />
            </div>
          )}
        </div>
        <AudioStatus
          isSolving={state.isSolving}
          musicTrack={activeTrackName || "Standby"}
          hasError={state.audioError}
        />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BackendModeProvider>
      <AppContent />
    </BackendModeProvider>
  );
};

export default App;
