import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface UiState {
  toast: (msg: string) => void;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

const Ctx = createContext<UiState | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastShow, setToastShow] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastShow(false), 2200);
  }, []);

  const openModal = useCallback((content: ReactNode) => setModalContent(content), []);
  const closeModal = useCallback(() => setModalContent(null), []);

  return (
    <Ctx.Provider value={{ toast, openModal, closeModal }}>
      {children}
      <div className={`modal-backdrop${modalContent ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal">
          {modalContent}
          {modalContent && (
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
          )}
        </div>
      </div>
      <div className={`toast${toastShow ? ' show' : ''}`}>{toastMsg}</div>
    </Ctx.Provider>
  );
}

export function useUi() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
